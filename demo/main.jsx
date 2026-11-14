import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createEqualizer, Equalizer, EqualizerModal } from "../src/index.js";

// One instance for the page (module level, so React StrictMode's double mount doesn't create two).
const eq = createEqualizer({ storageKey: "geq-demo" });

function Demo() {
  const audio = useRef(null);
  const [src, setSrc] = useState(null);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("default");
  useEffect(() => { if (audio.current) eq.attach(audio.current); }, []);
  // Theme on <html>: the dialog is rendered into <body>, outside this component, and should match.
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (src) URL.revokeObjectURL(src);
    setSrc(URL.createObjectURL(f));
  };
  return (
    <main className="demo">
      <h1>general_equalizer</h1>
      <p>Pick any audio file from your computer (nothing is uploaded), press play, then move the faders.</p>
      <div className="demo-row">
        <input type="file" accept="audio/*" onChange={pick} aria-label="Audio file" />
        <audio ref={audio} src={src || undefined} controls />
      </div>
      <div className="demo-row">
        <button type="button" onClick={() => setOpen(true)}>Open as dialog</button>
        <label>Theme{" "}
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="default">Default (light grey)</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>
      <section className="demo-panel">
        <Equalizer eq={eq} />
      </section>
      <EqualizerModal eq={eq} open={open} onClose={() => setOpen(false)} />
    </main>
  );
}

const css = `
  body { margin: 0; background: #ffffff; color: #1f2937; font-family: system-ui, sans-serif; }
  .demo { max-width: 920px; margin: 0 auto; padding: 24px 16px; }
  .demo-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 12px 0; }
  .demo-row audio { max-width: 100%; }
  .demo-panel { margin-top: 20px; padding: 20px; border-radius: 6px; background: var(--geq-bg, #f3f4f6); }
  [data-theme="dark"] body { background: #111418; color: #e5e7eb; }
  [data-theme="dark"] { --geq-bg: #1f2329; --geq-text: #e5e7eb; --geq-muted: #9ca3af; --geq-accent: #d1d5db; --geq-accent-text: #111827;
    --geq-thumb: #e5e7eb; --geq-thumb-active: #ffffff; --geq-track: #4b5563; --geq-surface: #2d333b; --geq-surface-hover: #3a414b;
    --geq-glow: rgba(255, 255, 255, .25); --geq-overlay-bg: rgba(0, 0, 0, .6); }
`;
document.head.appendChild(Object.assign(document.createElement("style"), { textContent: css }));
createRoot(document.getElementById("root")).render(<StrictMode><Demo /></StrictMode>);
