import { useId, useState } from "react";
import { HIGH_CUT, LOW_CUT, MODE_LIST, RANGES, STEP } from "../engine.js";
import Knob from "./Knob.jsx";
import { useEqualizer } from "./useEqualizer.js";

const fmtDb = (db) => `${db > 0 ? "+" : ""}${db.toFixed(1)}`;

/** Editable dB readout above each fader: type e.g. 1.3 or -1.5, Enter/blur applies; Up/Down = 0.1 dB, Shift+Up/Down = 1 dB. */
function DbReadout({ value, label, clampDb, onChange }) {
  const [draft, setDraft] = useState(null); // null = show the live value
  const commit = () => {
    if (draft !== null) {
      const n = parseFloat(draft.replace(",", "."));
      if (Number.isFinite(n)) onChange(clampDb(n));
      setDraft(null);
    }
  };
  const onKey = (e) => {
    if (e.key === "Enter") { commit(); e.currentTarget.blur(); }
    else if (e.key === "Escape") { e.stopPropagation(); setDraft(null); e.currentTarget.blur(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const step = (e.shiftKey ? 1 : STEP) * (e.key === "ArrowUp" ? 1 : -1);
      setDraft(null);
      onChange(clampDb(value + step));
    }
  };
  return (
    <input className="geq-db" type="text" inputMode="decimal" aria-label={`${label} Hz gain in dB`}
      value={draft ?? fmtDb(value)} onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.target.select()} onBlur={commit} onKeyDown={onKey} />
  );
}

/** Fill between the centre (0 dB) and the thumb, as a CSS gradient for the fader track. */
const fill = (db, range) => {
  const p = ((db + range) / (2 * range)) * 100;
  const [a, b] = p >= 50 ? [50, p] : [p, 50];
  return `linear-gradient(to right, var(--_track) ${a}%, var(--_accent) ${a}%, var(--_accent) ${b}%, var(--_track) ${b}%)`;
};

const defaultHelp = (bands, range) =>
  `${bands[0].label} Hz – ${bands[bands.length - 1].label.replace("k", " k")}Hz · ±${range} dB in 0.1 dB steps · ` +
  "type a value (e.g. 1.3) or use ↑/↓ · double-click a band or knob to reset it";

const Btn = ({ on, className = "", ...rest }) => (
  <button type="button" className={`geq-btn${on ? " is-on" : ""} ${className}`.trim()} {...rest} />
);

/**
 * The equalizer panel. Put it anywhere (sidebar, page, popover), or use <EqualizerModal> for a dialog.
 * @param {object} props
 * @param {ReturnType<import("../engine.js").createEqualizer>} props.eq
 * @param {string} [props.title="Equalizer"]   heading text; "" hides it
 * @param {string|false|((bands, range) => string)} [props.helpText]  text behind the "?" button; false hides the button
 * @param {boolean} [props.showPresets=true]
 * @param {boolean} [props.showCuts=true]
 * @param {boolean} [props.showModes=true]     3 / 7 / 11-band switch
 * @param {() => void} [props.onDone]          shows a Done button that calls this
 * @param {string} [props.className]
 */
export default function Equalizer({ eq, title = "Equalizer", helpText, showPresets = true, showCuts = true, showModes = true,
  onDone, className = "", ...rest }) {
  const st = useEqualizer(eq);
  const { mode, range, bypass, bands, gains, cuts } = st;
  const [help, setHelp] = useState(false);
  const [picked, setPicked] = useState("");
  const [name, setName] = useState("");
  const helpId = useId();
  const mine = st.userPresets.filter((p) => p.mode === mode);
  // A picked user preset stays picked while you edit, so it can be updated; a built-in one is let go on the first change.
  const mineOn = mine.find((p) => p.id === picked);
  const edited = !!mineOn && bands.some((b, i) => mineOn.values[i] !== gains[b.id]);
  const keepMine = (id) => (st.userPresets.some((p) => p.id === id) ? id : "");
  const helpBody = helpText === false ? null
    : typeof helpText === "function" ? helpText(bands, range)
    : helpText ?? defaultHelp(bands, range);

  const change = (id, v) => { eq.setGain(id, v); setPicked(keepMine); };
  const onPreset = (id) => { setPicked(id); if (id) eq.applyPreset(id); };
  const onSave = (e) => {
    e.preventDefault();
    const p = eq.savePreset(name);
    if (p) { setPicked(p.id); setName(""); }
  };

  return (
    <div className={`geq${bands.length > 7 ? " geq-dense" : ""}${bypass ? " is-bypassed" : ""} ${className}`.trim()} {...rest}>
      <div className="geq-head">
        {title ? <h2 className="geq-title">{title}</h2> : <span />}
        <div className="geq-head-tools">
          {showModes && (
            <div className="geq-group" role="group" aria-label="Number of bands">
              {MODE_LIST.map((m) => (
                <Btn key={m} on={mode === m} aria-pressed={mode === m} onClick={() => { eq.setMode(m); setPicked(""); }}>{m}-band</Btn>
              ))}
            </div>
          )}
          {helpBody != null && (
            <Btn on={help} className="geq-help-btn" aria-expanded={help} aria-controls={helpId} aria-label="Help" title="Help"
              onClick={() => setHelp((h) => !h)}>?</Btn>
          )}
        </div>
      </div>
      {help && helpBody != null && <p id={helpId} className="geq-help">{helpBody}</p>}

      {showPresets && (
        <div className="geq-presets">
          <select className="geq-input" value={picked} onChange={(e) => onPreset(e.target.value)} aria-label="Preset">
            <option value="">Preset…</option>
            <optgroup label="Built-in">
              {st.presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </optgroup>
            {mine.length > 0 && (
              <optgroup label="My presets">
                {mine.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </optgroup>
            )}
          </select>
          {mineOn && (<>
            <Btn on onClick={() => eq.updatePreset(picked)} disabled={!edited}
              title={edited ? `Save the current settings into "${mineOn.name}"` : "Change a band to update this preset"}>Update</Btn>
            <Btn onClick={() => { eq.deletePreset(picked); setPicked(""); }}>Delete</Btn>
          </>)}
          <form className="geq-save" onSubmit={onSave}>
            <input className="geq-input" value={name} maxLength={30} placeholder="Save as…"
              onChange={(e) => setName(e.target.value)} aria-label="Preset name" />
            <Btn type="submit" on disabled={!name.trim()}>Save</Btn>
          </form>
        </div>
      )}

      <div className="geq-main">
        {showCuts && <Knob label="Low cut" value={cuts.low} min={LOW_CUT.min} max={LOW_CUT.max} off={LOW_CUT.off} onChange={(hz) => eq.setCut("low", hz)} />}
        <div className="geq-bands">
          {bands.map((b) => (
            <div className="geq-band" key={b.id}>
              <DbReadout value={gains[b.id]} label={b.label} clampDb={eq.clampDb} onChange={(v) => change(b.id, v)} />
              <div className="geq-fader-box">
                <input type="range" className="geq-fader" min={-range} max={range} step={STEP}
                  value={gains[b.id]} style={{ "--geq-fill": fill(gains[b.id], range) }}
                  onChange={(e) => change(b.id, +e.target.value)} aria-label={`${b.label} Hz`}
                  onDoubleClick={() => change(b.id, 0)} />
              </div>
              <span className="geq-band-label">{b.label}</span>
            </div>
          ))}
        </div>
        {showCuts && <Knob label="High cut" value={cuts.high} min={HIGH_CUT.min} max={HIGH_CUT.max} off={HIGH_CUT.off} onChange={(hz) => eq.setCut("high", hz)} />}
      </div>

      <div className="geq-footer">
        <Btn on={bypass} className="geq-bypass" aria-pressed={bypass} onClick={() => eq.setBypass(!bypass)}
          title="Take the EQ out of the sound (settings are kept)">{bypass ? "Bypassed" : "Bypass"}</Btn>
        <div className="geq-group geq-range" role="group" aria-label="Fader range">
          {RANGES.map((r) => (
            <Btn key={r} on={range === r} aria-pressed={range === r} onClick={() => eq.setRange(r)}>±{r} dB</Btn>
          ))}
        </div>
        <div className="geq-done">
          <Btn onClick={() => { eq.reset(); setPicked(keepMine); }}>Reset</Btn>
          {onDone && <Btn on onClick={onDone}>Done</Btn>}
        </div>
      </div>
    </div>
  );
}
