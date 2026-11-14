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
            <option value="default">Default</option>
            <option value="light">Light</option>
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
  body { margin: 0; background: #0d0f13; color: #e8eaee; font-family: system-ui, sans-serif; }
  .demo { max-width: 920px; margin: 0 auto; padding: 24px 16px; }
  .demo-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 12px 0; }
  .demo-row audio { max-width: 100%; }
  .demo-panel { margin-top: 20px; padding: 20px; border-radius: 6px; background: var(--geq-bg, #14161b); }
  [data-theme="light"] { --geq-bg: #ffffff; --geq-text: #1d2330; --geq-muted: #5c6577; --geq-accent: #1c64f2; --geq-accent-text: #fff;
    --geq-thumb: #1d2330; --geq-thumb-active: #1c64f2; --geq-track: rgba(0,0,0,.18); --geq-surface: rgba(0,0,0,.06);
    --geq-surface-hover: rgba(0,0,0,.12); --geq-glow: rgba(28,100,242,.45); }
  [data-theme="light"] .demo-panel { color: #1d2330; }
`;
document.head.appendChild(Object.assign(document.createElement("style"), { textContent: css }));
createRoot(document.getElementById("root")).render(<StrictMode><Demo /></StrictMode>);
