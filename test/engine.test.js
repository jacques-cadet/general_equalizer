import { describe, expect, it, vi } from "vitest";
import { BUILT_IN_PRESETS, HIGH_CUT, LOW_CUT, MODES, createEqualizer } from "../src/engine.js";

// ---- a small fake Web Audio API: nodes remember what they're connected to ----
class Param { constructor(v = 0) { this.value = v; } setTargetAtTime(v) { this.value = v; } }
class Node {
  constructor(ctx, kind) { this.ctx = ctx; this.kind = kind; this.out = new Set(); this.gain = new Param(1); }
  connect(n) { this.out.add(n); return n; }
  disconnect(n) { if (n === undefined) this.out.clear(); else this.out.delete(n); }
}
class Biquad extends Node {
  constructor(ctx) { super(ctx, "biquad"); this.type = "lowpass"; this.frequency = new Param(350); this.gain = new Param(0); this.Q = new Param(1); }
}
class FakeContext {
  constructor() { this.state = "suspended"; this.currentTime = 0; this.destination = new Node(this, "destination"); this.created = 0; }
  createGain() { return new Node(this, "gain"); }
  createBiquadFilter() { return new Biquad(this); }
  createDynamicsCompressor() { const n = new Node(this, "limiter"); for (const k of ["threshold", "knee", "ratio", "attack", "release"]) n[k] = new Param(); return n; }
  createMediaElementSource(el) {
    if (el.__ctx) throw new Error("InvalidStateError: element already has a source");
    el.__ctx = this; this.created++;
    return (this.lastSource = new Node(this, "media"));
  }
  resume() { this.state = "running"; return Promise.resolve(); }
  close() { this.state = "closed"; return Promise.resolve(); }
}
const fakeEl = () => {
  const l = {};
  return { paused: true, addEventListener: (t, f) => { (l[t] ||= new Set()).add(f); }, removeEventListener: (t, f) => l[t]?.delete(f),
    fire: (t) => l[t]?.forEach((f) => f()), listeners: l };
};
const memStorage = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; };

/** The nodes after the EQ input, in order, until the destination. */
const nodes = (eq) => {
  const out = []; let n = eq.input;
  for (let i = 0; i < 30 && n; i++) { const [next] = n.out; if (!next) break; out.push(next); n = next; }
  return out;
};
/** Same, as filter types / node kinds. */
const chain = (eq) => nodes(eq).map((n) => (n.kind === "biquad" ? n.type : n.kind));
const make = (opts = {}) => {
  const ctx = new FakeContext();
  const storage = opts.storage ?? memStorage();
  return { ctx, storage, eq: createEqualizer({ audioContext: ctx, storage, ...opts }) };
};

describe("modes and bands", () => {
  it("has 3 / 7 / 11 bands with a low shelf, peaking mids and an 8 kHz high shelf", () => {
    for (const [m, n] of [[3, 3], [7, 7], [11, 11]]) {
      const bands = MODES[m];
      expect(bands).toHaveLength(n);
      expect(bands[0].type).toBe("lowshelf");
      expect(bands.at(-1)).toMatchObject({ type: "highshelf", freq: 8000 });
      bands.slice(1, -1).forEach((b) => { expect(b.type).toBe("peaking"); expect(b.q).toBeGreaterThan(0); });
    }
    expect(MODES[3][1].q).toBe(0.4);   // same Q as the original website EQ
  });

  it("defaults to 3-band, ±12 dB, flat, cuts off, no bypass", () => {
    const { eq } = make();
    expect(eq.getState()).toMatchObject({ mode: 3, range: 12, bypass: false, values: [0, 0, 0], cuts: { low: LOW_CUT.off, high: HIGH_CUT.off } });
  });

  it("builds the chain on attach: cuts, then the bands, then the speakers", () => {
    const { eq } = make();
    eq.attach(fakeEl());
    expect(chain(eq)).toEqual(["highpass", "lowpass", "lowshelf", "peaking", "highshelf", "destination"]);
    eq.setMode(7);
    expect(chain(eq)).toEqual(["highpass", "lowpass", "lowshelf", ...Array(5).fill("peaking"), "highshelf", "destination"]);
  });
});

describe("gains and range", () => {
  it("rounds to 0.1 dB and clamps to the range", () => {
    const { eq } = make();
    const id = MODES[3][1].id;
    eq.setGain(id, 1.2999999);
    expect(eq.getState().gains[id]).toBe(1.3);
    eq.setGain(id, 40);
    expect(eq.getState().gains[id]).toBe(12);
    eq.setGain(id, "abc");
    expect(eq.getState().gains[id]).toBe(0);
  });

  it("narrowing the range clamps what is heard; widening restores the stored value", () => {
    const { eq } = make();
    eq.attach(fakeEl());
    const id = MODES[3][0].id;
    eq.setRange(18);
    eq.setGain(id, 15);
    eq.setRange(6);
    expect(eq.getState().gains[id]).toBe(6);
    expect(nodes(eq)[2].gain.value).toBe(6);  // the low shelf filter hears the clamped value
    eq.setRange(18);
    expect(eq.getState().gains[id]).toBe(15);
  });

  it("ignores unknown ranges and band ids", () => {
    const { eq } = make();
    eq.setRange(9);
    expect(eq.getState().range).toBe(12);
    const before = eq.getState();
    eq.setGain("nope", 3);
    expect(eq.getState()).toBe(before);
  });

  it("keeps separate gains per mode", () => {
    const { eq } = make();
    eq.applyValues([1, 2, 3]);
    eq.setMode(7);
    expect(eq.getState().values).toEqual([0, 0, 0, 0, 0, 0, 0]);
    eq.setMode(3);
    expect(eq.getState().values).toEqual([1, 2, 3]);
  });

  it("reset flattens the current mode and turns both cuts off", () => {
    const { eq } = make();
    eq.applyValues([4, -4, 2]);
    eq.setCut("low", 200); eq.setCut("high", 5000);
    eq.reset();
    expect(eq.getState()).toMatchObject({ values: [0, 0, 0], cuts: { low: 20, high: 20000 } });
  });
});

describe("cuts and bypass", () => {
  it("clamps cut frequencies to their ranges and drives the filters", () => {
    const { eq } = make();
    eq.attach(fakeEl());
    eq.setCut("low", 5); eq.setCut("high", 99999);
    expect(eq.getState().cuts).toEqual({ low: 20, high: 20000 });
    eq.setCut("low", 141.4);
    expect(nodes(eq)[0].frequency.value).toBe(141);
    // Web Audio reads lowpass/highpass Q in dB: Butterworth = -3.01 dB (not 0.707, which would add a +0.7 dB bump)
    expect(nodes(eq)[0].Q.value).toBeCloseTo(-3.0103, 3);
    expect(nodes(eq)[1].Q.value).toBeCloseTo(-3.0103, 3);
  });

  it("bypass routes the input straight to the speakers and back", () => {
    const { eq, ctx } = make();
    eq.attach(fakeEl());
    eq.setBypass(true);
    expect([...eq.input.out]).toEqual([ctx.destination]);
    eq.setBypass(false);
    expect(chain(eq)[0]).toBe("highpass");
  });

  it("can output into a custom destination node", () => {
    const ctx = new FakeContext();
    const dest = ctx.createGain();
    const eq = createEqualizer({ audioContext: ctx, destination: dest, storage: null });
    eq.attach(fakeEl());
    expect(chain(eq).at(-1)).toBe("gain");
    eq.setBypass(true);
    expect([...eq.input.out]).toEqual([dest]);
  });
});

describe("sources", () => {
  it("creates one media source per element, even across instances and re-attaches", () => {
    const ctx = new FakeContext();
    const a = createEqualizer({ audioContext: ctx, storage: null });
    const b = createEqualizer({ audioContext: ctx, storage: null });
    const el = fakeEl();
    a.attach(el); a.detach(el); a.attach(el);
    b.attach(el);
    expect(ctx.created).toBe(1);
  });

  it("a detached element keeps playing straight to the speakers", () => {
    const { eq, ctx } = make();
    const el = fakeEl();
    eq.attach(el);
    const src = ctx.lastSource;
    expect([...src.out]).toEqual([eq.input]);
    eq.detach(el);
    expect([...src.out]).toEqual([ctx.destination]);
    expect(el.listeners.play.size).toBe(0);
    eq.attach(el);   // and can come back
    expect([...src.out]).toEqual([eq.input]);
  });

  it("resumes a suspended context when the element plays", () => {
    const { eq, ctx } = make();
    const el = fakeEl();
    eq.attach(el);
    expect(ctx.state).toBe("suspended");
    el.fire("play");
    expect(ctx.state).toBe("running");
  });

  it("connectSource accepts any audio node and returns a disconnect function", () => {
    const { eq, ctx } = make();
    const node = new Node(ctx, "osc");
    const off = eq.connectSource(node);
    expect(node.out.has(eq.input)).toBe(true);
    off();
    expect(node.out.has(eq.input)).toBe(false);
  });

  it("creates its own AudioContext lazily when none is given, and closes it on dispose", () => {
    globalThis.window = { AudioContext: FakeContext };
    try {
      const eq = createEqualizer({ storage: null });
      expect(eq.audioContext).toBe(null);
      eq.attach(fakeEl());
      const ctx = eq.audioContext;
      expect(ctx).toBeInstanceOf(FakeContext);
      eq.dispose();
      expect(ctx.state).toBe("closed");
      expect(eq.audioContext).toBe(null);
    } finally { delete globalThis.window; }
  });
});

describe("saving", () => {
  it("saves every setting under the storage key prefix and loads it back", () => {
    const storage = memStorage();
    const a = createEqualizer({ audioContext: new FakeContext(), storage, storageKey: "mine" });
    a.setMode(7); a.setRange(18); a.setBypass(true); a.setCut("high", 9000); a.applyValues([1, 2, 3, 4, 5, 6, 17]);
    expect([...storage.m.keys()].every((k) => k.startsWith("mine:"))).toBe(true);
    const b = createEqualizer({ audioContext: new FakeContext(), storage, storageKey: "mine" });
    expect(b.getState()).toMatchObject({ mode: 7, range: 18, bypass: true, cuts: { high: 9000 }, values: [1, 2, 3, 4, 5, 6, 17] });
    const other = createEqualizer({ audioContext: new FakeContext(), storage, storageKey: "other" });
    expect(other.getState().mode).toBe(3);
  });

  it("survives junk in storage and storage that throws", () => {
    const storage = memStorage();
    storage.setItem("geq:mode", "{nope"); storage.setItem("geq:gains", '{"3:f120": "x"}'); storage.setItem("geq:presets", '[{"bad":1}]');
    const eq = createEqualizer({ audioContext: new FakeContext(), storage });
    expect(eq.getState()).toMatchObject({ mode: 3, values: [0, 0, 0], userPresets: [] });
    const throwing = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("full"); } };
    const t = createEqualizer({ audioContext: new FakeContext(), storage: throwing });
    expect(() => t.setRange(6)).not.toThrow();
    expect(t.getState().range).toBe(6);
  });

  it("storage: null saves nothing", () => {
    const eq = createEqualizer({ audioContext: new FakeContext(), storage: null, defaultMode: 11, defaultRange: 6 });
    eq.setMode(7);
    expect(eq.getState()).toMatchObject({ mode: 7, range: 6 });
    expect(createEqualizer({ storage: null, defaultMode: 11 }).getState().mode).toBe(11);
  });
});

describe("presets", () => {
  it("applies built-ins for the current mode", () => {
    const { eq } = make();
    eq.setMode(7);
    expect(eq.applyPreset("b-bass")).toBe(true);
    expect(eq.getState().values).toEqual(BUILT_IN_PRESETS.find((p) => p.id === "b-bass").values[7]);
  });

  it("saves, overwrites by name (case-insensitive, per mode), applies and deletes user presets", () => {
    const { eq } = make();
    eq.applyValues([1, 1, 1]);
    const p1 = eq.savePreset("  Mine  ");
    expect(p1).toMatchObject({ name: "Mine", mode: 3, values: [1, 1, 1] });
    eq.applyValues([2, 2, 2]);
    eq.savePreset("MINE");
    expect(eq.getState().userPresets).toHaveLength(1);
    eq.applyValues([0, 0, 0]);
    eq.applyPreset(eq.getState().userPresets[0].id);
    expect(eq.getState().values).toEqual([2, 2, 2]);
    eq.setMode(7);
    expect(eq.applyPreset(eq.getState().userPresets[0].id)).toBe(false);   // a 3-band preset doesn't apply to 7 bands
    eq.deletePreset(eq.getState().userPresets[0].id);
    expect(eq.getState().userPresets).toEqual([]);
    expect(eq.savePreset("   ")).toBe(null);
  });

  it("updates a user preset in place (same id and name), only in its own mode", () => {
    const { eq, storage } = make();
    eq.applyValues([1, 1, 1]);
    const p = eq.savePreset("Mine");
    eq.applyValues([3, -2, 0.5]);
    const fn = vi.fn(); eq.subscribe(fn);
    expect(eq.updatePreset(p.id)).toMatchObject({ id: p.id, name: "Mine", mode: 3, values: [3, -2, 0.5] });
    expect(eq.getState().userPresets).toEqual([{ ...p, values: [3, -2, 0.5] }]);
    expect(JSON.parse(storage.getItem("geq:presets"))[0].values).toEqual([3, -2, 0.5]);
    expect(fn).toHaveBeenCalled();
    eq.setMode(7);
    expect(eq.updatePreset(p.id)).toBe(null);   // a 3-band preset can't take 7 values
    expect(eq.updatePreset("nope")).toBe(null);
    expect(eq.updatePreset("b-flat")).toBe(null);   // built-ins are read-only
  });

  it("keeps at most maxUserPresets", () => {
    const { eq } = make({ maxUserPresets: 2 });
    eq.savePreset("a"); eq.savePreset("b"); eq.savePreset("c");
    expect(eq.getState().userPresets.map((p) => p.name)).toEqual(["b", "c"]);
  });

  it("accepts custom built-in presets", () => {
    const presets = [{ id: "x", name: "X", values: { 3: [5, 0, 5], 7: [0, 0, 0, 0, 0, 0, 0], 11: Array(11).fill(0) } }];
    const { eq } = make({ presets });
    expect(eq.getState().presets).toBe(presets);
    eq.applyPreset("x");
    expect(eq.getState().values).toEqual([5, 0, 5]);
  });
});

describe("subscribe / getState", () => {
  it("notifies on every change and keeps the same snapshot between changes", () => {
    const { eq } = make();
    const fn = vi.fn();
    const off = eq.subscribe(fn);
    const s1 = eq.getState();
    expect(eq.getState()).toBe(s1);
    eq.setGain(MODES[3][0].id, 2);
    eq.setBypass(true);
    eq.setRange(6);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(eq.getState()).not.toBe(s1);
    off();
    eq.setRange(12);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("a listener that throws doesn't break the others", () => {
    const { eq } = make();
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const good = vi.fn();
    eq.subscribe(() => { throw new Error("boom"); });
    eq.subscribe(good);
    eq.setRange(6);
    expect(good).toHaveBeenCalled();
    err.mockRestore();
  });
});


describe("limiter", () => {
  it("is off by default, and when on sits at the end of the chain and after bypass", () => {
    const ctx = new FakeContext();
    const st = memStorage();
    const eq = createEqualizer({ audioContext: ctx, storage: st });
    eq.attach(fakeEl());
    expect(eq.getState().limiter).toBe(false);
    expect(chain(eq).at(-1)).toBe("destination");
    eq.setLimiter(true);
    expect(eq.getState().limiter).toBe(true);
    expect(chain(eq).slice(-3)).toEqual(["limiter", "gain", "destination"]);
    const lim = nodes(eq).at(-3);
    expect(lim.threshold.value).toBe(-2);
    expect(nodes(eq).at(-2).gain.value).toBeCloseTo(10 ** (-1.14 / 20), 3);   // make-up gain taken back out
    expect(lim.ratio.value).toBe(20);
    eq.setBypass(true);
    expect(chain(eq)).toEqual(["limiter", "gain", "destination"]);
    eq.setBypass(false);
    eq.setMode(7);                                     // rebuilding the bands keeps the limiter
    expect(chain(eq).slice(-3)).toEqual(["limiter", "gain", "destination"]);
    eq.setLimiter(false);
    expect(chain(eq).at(-1)).toBe("destination");
    expect(chain(eq)).not.toContain("limiter");
    eq.setLimiter(true);
    const again = createEqualizer({ audioContext: new FakeContext(), storage: st });
    expect(again.getState().limiter).toBe(true);       // saved
  });
  it("defaultLimiter turns it on when nothing is saved", () => {
    expect(createEqualizer({ storage: null, defaultLimiter: true }).getState().limiter).toBe(true);
  });
});
