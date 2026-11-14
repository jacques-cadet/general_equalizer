// general_equalizer engine: a switchable 3 / 7 / 11-band graphic EQ with low / high cut, bypass and presets,
// on the Web Audio API. No React in here; the React components only read and drive an instance of this.
//
//   source(s) -> input -> low cut (high-pass) -> high cut (low-pass) -> low shelf -> peaking bands -> high shelf -> [limiter] -> destination
//   Bypass:      source(s) -> input -> [limiter] -> destination (settings are kept)
//   The limiter (off by default) catches peaks that boosts push over 0 dBFS, which would otherwise clip (distort).

export const RANGES = [6, 12, 18];   // selectable +/- dB slider range
export const MAX_RANGE = 18;
export const STEP = 0.1;             // dB resolution (sliders, typed values, presets)

// Cut filters (12 dB/oct Butterworth). At the "off" end of each knob the filter sits outside the audible band.
export const LOW_CUT = { min: 20, max: 1000, off: 20 };        // high-pass, Hz ("Off" at 20)
export const HIGH_CUT = { min: 1000, max: 20000, off: 20000 }; // low-pass, Hz ("Off" at 20k)
// Web Audio reads Q on lowpass/highpass filters in dB (resonance), not as a plain number: a Butterworth
// (Q = 1/sqrt 2, -3 dB at the cutoff, no bump) is 20*log10(1/sqrt 2) = -3.01 dB.
const BUTTERWORTH_Q_DB = 20 * Math.log10(Math.SQRT1_2);

// Limiter: a DynamicsCompressor set up as a fast, hard-knee limiter under full scale. Web Audio compressors add automatic
// make-up gain (spec: 0.6 x the gain reduction at 0 dBFS), which would make everything louder when the limiter is on;
// a fixed trim after it takes that back out, so quiet passages sound the same with the limiter on or off.
// Measured (Chrome, 1 kHz, +18 dB boost): peaks stay under 0 dBFS; a -20 dBFS signal stays at -20 dBFS.
export const LIMITER = { threshold: -2, knee: 0, ratio: 20, attack: 0.002, release: 0.15 };
const LIMITER_TRIM_DB = -0.6 * -LIMITER.threshold * (1 - 1 / LIMITER.ratio);

/** Round to 0.1 dB and clamp to +/-limit, without float noise like 1.3000000000000003. */
const clampTo = (v, limit) => Math.round(Math.max(-limit, Math.min(limit, Number(v) || 0)) * 10) / 10;
const clampHz = (v, { min, max }) => Math.round(Math.max(min, Math.min(max, Number(v) || 0)));

// Peaking-band Q from the octave spacing of its neighbours: Q = 1 / (2 sinh(ln2/2 * bw)).
// Wider spacing -> lower Q, so adjacent bands overlap about the same amount in every mode.
// (Web Audio ignores Q on shelf filters, so only the peaking bands carry one.)
const qFor = (bwOctaves) => +(1 / (2 * Math.sinh((Math.LN2 / 2) * bwOctaves))).toFixed(2);
const label = (f) => (f >= 1000 ? `${f / 1000}k` : `${f}`);

/** Low shelf, peaking bands, high shelf. Each peaking band's Q comes from the average octave gap to its two neighbours. */
function bandsFor(mode, freqs) {
  const gap = freqs.map((f, i) => (i === 0 ? 0 : Math.log2(f / freqs[i - 1])));
  return freqs.map((f, i) => {
    const b = { id: `${mode}:f${f}`, label: label(f), freq: f };
    if (i === 0) return { ...b, type: "lowshelf" };
    if (i === freqs.length - 1) return { ...b, type: "highshelf" };
    return { ...b, type: "peaking", q: qFor((gap[i] + gap[i + 1]) / 2) };
  });
}

// The top band is an 8 kHz shelf in every mode (12-16 kHz shelves were barely audible).
// Band ids are per mode ("3:f8000" vs "7:f8000"), so each mode keeps its own gains.
export const MODES = Object.freeze({
  3: bandsFor(3, [120, 1000, 8000]),                                            // ~3 octaves apart; mid Q 0.4
  7: bandsFor(7, [64, 160, 400, 1000, 2000, 4000, 8000]),                       // 1 kHz is the centre band; Q 1.05-1.41
  11: bandsFor(11, [32, 63, 125, 250, 500, 1000, 1500, 2300, 3500, 5300, 8000]), // ISO octaves below 1k, x1.52 above
});
export const MODE_LIST = [3, 7, 11];
const ALL_IDS = MODE_LIST.flatMap((m) => MODES[m]).map((b) => b.id);

/** Built-in presets: dB per band, low -> high, for each mode. */
export const BUILT_IN_PRESETS = Object.freeze([
  { id: "b-flat", name: "Flat", values: { 3: [0, 0, 0], 7: [0, 0, 0, 0, 0, 0, 0], 11: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] } },
  { id: "b-bass", name: "Bass boost", values: { 3: [8, 0, -1], 7: [8, 6, 3, 0, 0, 0, 0], 11: [8, 7, 5.5, 3.5, 1.5, 0, 0, 0, 0, 0, -0.5] } },
  { id: "b-vocal", name: "Vocal / presence", values: { 3: [-2, 4, 2], 7: [-3, -2, 0, 3, 4, 3, 1], 11: [-3, -3, -2, -1, 0.5, 2.5, 3.5, 3.5, 3, 2, 1] } },
  { id: "b-bright", name: "Bright", values: { 3: [-1, 0, 7], 7: [-1, 0, 0, 0, 2, 5, 7], 11: [-1, -1, -0.5, 0, 0, 0, 1.5, 3, 4.5, 6, 7] } },
  { id: "b-loud", name: "Loudness", values: { 3: [6, -2, 5], 7: [7, 4, 0, -2, -1, 3, 6], 11: [7, 6, 4, 1.5, -1, -2, -1.5, 0.5, 3, 4.5, 6] } },
  { id: "b-warm", name: "Warm", values: { 3: [3, 1, -4], 7: [4, 3, 2, 0, -1, -3, -5], 11: [4, 4, 3, 2.5, 1.5, 0, -1, -2, -3, -4, -5] } },
]);

// A media element can only ever get ONE MediaElementAudioSourceNode (per AudioContext; creating a second throws),
// so sources are cached per context + element and reused by every instance that attaches it.
const elementSources = new WeakMap();   // AudioContext -> WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>
function mediaSource(ctx, el) {
  let byEl = elementSources.get(ctx);
  if (!byEl) elementSources.set(ctx, (byEl = new WeakMap()));
  let src = byEl.get(el);
  if (!src) byEl.set(el, (src = ctx.createMediaElementSource(el)));
  return src;
}

function defaultStorage() {
  try { return typeof window !== "undefined" && window.localStorage ? window.localStorage : null; } catch { return null; }
}

/**
 * Create an equalizer. Every instance is independent (its own filters, settings and saved keys).
 * @param {object} [options]
 * @param {AudioContext} [options.audioContext]  use this context (default: one is created on first attach)
 * @param {AudioNode} [options.destination]       where the EQ outputs (default: audioContext.destination)
 * @param {{getItem(k:string):string|null, setItem(k:string,v:string):void}|null} [options.storage]
 *        where settings are saved (default: localStorage; null = don't save)
 * @param {string} [options.storageKey="geq"]     prefix for the saved keys
 * @param {3|7|11} [options.defaultMode=3]
 * @param {6|12|18} [options.defaultRange=12]
 * @param {Array} [options.presets]                built-in presets (default: BUILT_IN_PRESETS)
 * @param {number} [options.maxUserPresets=30]
 * @param {boolean} [options.defaultLimiter=false]  limiter on when nothing is saved yet
 */
export function createEqualizer(options = {}) {
  const {
    audioContext = null, destination = null, storageKey = "geq",
    defaultMode = 3, defaultRange = 12, presets = BUILT_IN_PRESETS, maxUserPresets = 30, defaultLimiter = false,
  } = options;
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  const k = (name) => `${storageKey}:${name}`;
  const read = (name) => { try { return JSON.parse(storage?.getItem(k(name)) ?? "null"); } catch { return null; } };
  const write = (name, v) => { try { storage?.setItem(k(name), JSON.stringify(v)); } catch { /* full / private mode */ } };
  const validMode = (m) => (MODE_LIST.includes(m) ? m : MODE_LIST.includes(defaultMode) ? defaultMode : 3);
  const validRange = (r) => (RANGES.includes(r) ? r : RANGES.includes(defaultRange) ? defaultRange : 12);
  const validPreset = (p) => p && typeof p.name === "string" && MODE_LIST.includes(p.mode) && Array.isArray(p.values);

  // ---- settings (saved) ----
  let mode = validMode(read("mode"));
  let range = validRange(read("range"));
  let bypass = read("bypass") === true;
  let limiter = typeof read("limiter") === "boolean" ? read("limiter") : !!defaultLimiter;
  const savedCuts = read("cuts") || {};
  let cuts = { low: clampHz(savedCuts.low ?? LOW_CUT.off, LOW_CUT), high: clampHz(savedCuts.high ?? HIGH_CUT.off, HIGH_CUT) };
  const savedGains = read("gains") || {};
  // Stored gains keep up to +/-18 dB; what is heard (and shown) is clamped to the current range,
  // so narrowing the range and widening it again gives the old settings back.
  let gains = Object.fromEntries(ALL_IDS.map((id) => [id, Number.isFinite(savedGains[id]) ? clampTo(savedGains[id], MAX_RANGE) : 0]));
  let userPresets = (Array.isArray(read("presets")) ? read("presets") : []).filter(validPreset);

  const clampDb = (v) => clampTo(v, range);
  const heard = (id) => clampTo(gains[id], range);

  // ---- change notifications (React reads getState() through subscribe) ----
  const listeners = new Set();
  let snapshot = null;
  const emit = () => { snapshot = null; listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); };

  // ---- audio graph ----
  let ctx = audioContext, ownCtx = false, input = null, lowCut = null, highCut = null, filters = null, limNode = null, limTrim = null;
  const sources = new Map();   // source node -> { el?, onPlay? }

  const out = () => destination || ctx.destination;
  const tail = () => (limiter && limNode ? limNode : out());   // where the EQ (or the bypass) ends up
  function route() {   // input -> chain, or straight to the output when bypassed; chain end -> limiter or output
    if (!input) return;
    try { input.disconnect(); } catch { /* not connected */ }
    input.connect(bypass ? tail() : lowCut);
    const last = filters?.[filters.length - 1];
    if (last) { try { last.disconnect(); } catch { /* ok */ } last.connect(tail()); }
  }
  function build() {
    [lowCut, highCut, ...(filters || [])].forEach((f) => { try { f?.disconnect(); } catch { /* ok */ } });
    lowCut = ctx.createBiquadFilter(); lowCut.type = "highpass"; lowCut.frequency.value = cuts.low; lowCut.Q.value = BUTTERWORTH_Q_DB;
    highCut = ctx.createBiquadFilter(); highCut.type = "lowpass"; highCut.frequency.value = cuts.high; highCut.Q.value = BUTTERWORTH_Q_DB;
    filters = MODES[mode].map((b) => {
      const f = ctx.createBiquadFilter();
      f.type = b.type; f.frequency.value = b.freq; f.gain.value = heard(b.id);
      if (b.q) f.Q.value = b.q;
      return f;
    });
    [lowCut, highCut, ...filters].reduce((a, b) => (a.connect(b), b));
    route();
  }
  function ensure() {
    if (input) return ctx;
    if (!ctx) {
      const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
      if (!AC) throw new Error("general_equalizer: Web Audio API is not available");
      ctx = new AC(); ownCtx = true;
    }
    input = ctx.createGain();
    if (ctx.createDynamicsCompressor) {
      limNode = ctx.createDynamicsCompressor();
      for (const [k2, v] of Object.entries(LIMITER)) limNode[k2].value = v;
      limTrim = ctx.createGain();
      limTrim.gain.value = 10 ** (LIMITER_TRIM_DB / 20);
      limNode.connect(limTrim).connect(out());
    }
    build();
    return ctx;
  }
  const resume = () => { if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {}); };

  const eq = {
    /** Route a media element (<audio>/<video>) through the EQ. Returns a function that detaches it again. */
    attach(el) {
      ensure();
      const src = mediaSource(ctx, el);
      if (sources.has(src)) return () => eq.detach(el);
      try { src.disconnect(); } catch { /* fresh */ }   // e.g. it was playing straight to the speakers after a detach
      src.connect(input);
      const onPlay = resume;
      el.addEventListener("play", onPlay);
      sources.set(src, { el, onPlay });
      if (!el.paused) resume();
      return () => eq.detach(el);
    },
    /** Route any Web Audio node through the EQ (for apps with their own graph). Returns a function that disconnects it. */
    connectSource(node) {
      ensure();
      if (!sources.has(node)) { node.connect(input); sources.set(node, {}); }
      return () => eq.detach(node);
    },
    /** Take one element / node out of the EQ, or all of them when called with no argument.
     *  A detached media element keeps playing, straight to the speakers. */
    detach(target) {
      for (const [src, info] of [...sources]) {
        if (target !== undefined && target !== src && target !== info.el) continue;
        try { src.disconnect(input); } catch { /* gone */ }
        if (info.el) {
          info.el.removeEventListener("play", info.onPlay);
          try { src.connect(ctx.destination); } catch { /* context closed */ }
        }
        sources.delete(src);
      }
    },
    /** The AudioContext in use (null until the first attach / connectSource). */
    get audioContext() { return ctx; },
    /** The node sources connect into (null until the first attach / connectSource). */
    get input() { return input; },

    getState() {
      if (!snapshot) {
        snapshot = Object.freeze({
          mode, range, bypass, limiter,
          bands: MODES[mode],
          gains: Object.freeze(Object.fromEntries(ALL_IDS.map((id) => [id, heard(id)]))),
          values: Object.freeze(MODES[mode].map((b) => heard(b.id))),
          cuts: Object.freeze({ ...cuts }),
          presets,
          userPresets: Object.freeze(userPresets.slice()),
        });
      }
      return snapshot;
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    clampDb,
    setMode(m) {
      const next = validMode(m);
      if (next === mode) return;
      mode = next; write("mode", mode);
      if (input) build();
      emit();
    },
    setGain(id, value) {
      if (!(id in gains)) return;
      gains = { ...gains, [id]: clampDb(value) };
      const i = MODES[mode].findIndex((b) => b.id === id);
      if (filters && i >= 0) filters[i].gain.value = heard(id);
      write("gains", gains);
      emit();
    },
    /** Apply dB values (low -> high) to the current mode's bands. */
    applyValues(values) {
      MODES[mode].forEach((b, i) => {
        gains = { ...gains, [b.id]: clampDb(values?.[i]) };
        if (filters) filters[i].gain.value = heard(b.id);
      });
      write("gains", gains);
      emit();
    },
    getValues: () => MODES[mode].map((b) => heard(b.id)),
    setRange(r) {
      if (!RANGES.includes(r) || r === range) return;
      range = r; write("range", range);
      if (filters) MODES[mode].forEach((b, i) => { filters[i].gain.value = heard(b.id); });
      emit();
    },
    /** Bypass: the whole EQ (cuts + bands) drops out of the signal; settings are kept. */
    setBypass(on) {
      bypass = !!on; write("bypass", bypass);
      route();
      emit();
    },
    /** Limiter on / off: stops boosted peaks from clipping. Works with bypass too. */
    setLimiter(on) {
      limiter = !!on; write("limiter", limiter);
      route();
      emit();
    },
    /** which = "low" (high-pass) | "high" (low-pass), in Hz. */
    setCut(which, hz) {
      if (which !== "low" && which !== "high") return;
      const spec = which === "low" ? LOW_CUT : HIGH_CUT;
      cuts = { ...cuts, [which]: clampHz(hz, spec) };
      write("cuts", cuts);
      const node = which === "low" ? lowCut : highCut;
      if (node) node.frequency.setTargetAtTime(cuts[which], ctx.currentTime, 0.015);   // smooth while turning a knob
      emit();
    },
    /** Flat bands (current mode) and both cuts off. Range and bypass stay as they are. */
    reset() {
      eq.applyValues(MODES[mode].map(() => 0));
      eq.setCut("low", LOW_CUT.off);
      eq.setCut("high", HIGH_CUT.off);
    },

    /** Apply a built-in or user preset by id (built-ins carry values for every mode; user presets for their own). */
    applyPreset(id) {
      const b = presets.find((p) => p.id === id);
      const u = userPresets.find((p) => p.id === id);
      const values = b ? b.values[mode] : u && u.mode === mode ? u.values : null;
      if (values) eq.applyValues(values);
      return !!values;
    },
    /** Save the current mode's values as a user preset (same name + mode overwrites). Returns the new preset. */
    savePreset(name) {
      const clean = String(name ?? "").trim().slice(0, 30);
      if (!clean) return null;
      const preset = { id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: clean, mode, values: eq.getValues() };
      userPresets = [...userPresets.filter((p) => !(p.mode === mode && p.name.toLowerCase() === clean.toLowerCase())), preset].slice(-maxUserPresets);
      write("presets", userPresets);
      emit();
      return preset;
    },
    /** Save the current values into an existing user preset of the current mode (same id and name). Returns it, or null. */
    updatePreset(id) {
      const old = userPresets.find((p) => p.id === id);
      if (!old || old.mode !== mode) return null;
      const preset = { ...old, values: eq.getValues() };
      userPresets = userPresets.map((p) => (p.id === id ? preset : p));
      write("presets", userPresets);
      emit();
      return preset;
    },
    deletePreset(id) {
      userPresets = userPresets.filter((p) => p.id !== id);
      write("presets", userPresets);
      emit();
    },

    /** Detach everything and drop the filters (and close the AudioContext if the EQ created it). */
    dispose() {
      eq.detach();
      [input, lowCut, highCut, limNode, limTrim, ...(filters || [])].forEach((n) => { try { n?.disconnect(); } catch { /* ok */ } });
      input = lowCut = highCut = filters = limNode = limTrim = null;
      if (ownCtx) { ctx.close?.().catch(() => {}); ctx = null; ownCtx = false; }
    },
  };
  return eq;
}
