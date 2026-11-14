import { useEffect, useRef } from "react";

const SWEEP = 270;                 // degrees of travel, from -135 (min) to +135 (max)
const R = 22, C = 28;              // arc radius and centre in a 56x56 box

/** Point on the knob's arc for a 0..1 position. */
const pt = (t, r = R) => {
  const a = ((-SWEEP / 2 + t * SWEEP) - 90) * (Math.PI / 180);
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};
const arc = (t0, t1) => {
  if (t1 - t0 < 0.002) return "";
  const [x0, y0] = pt(t0), [x1, y1] = pt(t1);
  return `M ${x0} ${y0} A ${R} ${R} 0 ${(t1 - t0) * SWEEP > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};

export const fmtHz = (hz) => (hz < 1000 ? `${Math.round(hz)} Hz` : `${(hz / 1000).toFixed(hz < 10000 ? 1 : 0)}k`);

/**
 * Rotary knob on a log (frequency) scale. Drag up/down to turn (Shift = fine), mouse wheel, arrow keys
 * (Shift = bigger steps), Home/End; double-click returns it to `off`. The lit arc shows how far it is from `off`.
 */
export default function Knob({ label, value, min, max, off, onChange, offText = "Off", format = fmtHz }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const toT = (v) => Math.log(v / min) / Math.log(max / min);
  const fromT = (t) => min * Math.pow(max / min, Math.max(0, Math.min(1, t)));
  const t = toT(value);
  const offT = toT(off ?? min);
  const nudge = (dt) => onChange(fromT(toT(value) + dt));

  // Wheel needs a non-passive listener so the page doesn't scroll while turning the knob.
  useEffect(() => {
    const el = ref.current;
    const onWheel = (e) => { e.preventDefault(); nudge((e.deltaY < 0 ? 1 : -1) * (e.shiftKey ? 0.005 : 0.02)); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { y: e.clientY, t };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dt = (drag.current.y - e.clientY) / (e.shiftKey ? 720 : 180);   // 180px = full sweep
    onChange(fromT(drag.current.t + dt));
  };
  const onPointerUp = () => { drag.current = null; };
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const map = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: 0.1, PageDown: -0.1 };
    if (e.key in map) { e.preventDefault(); nudge(map[e.key]); }
    else if (e.key === "Home") { e.preventDefault(); onChange(min); }
    else if (e.key === "End") { e.preventDefault(); onChange(max); }
  };

  const isOff = off != null && Math.abs(value - off) < 0.5;
  const text = isOff ? offText : format(value);
  const [ix, iy] = pt(t, R - 9);
  const [ox, oy] = pt(t, R - 1);
  return (
    <div className={`geq-knob${isOff ? "" : " is-on"}`}>
      <div ref={ref} className="geq-knob-dial" role="slider" tabIndex={0} aria-label={label}
        aria-valuemin={min} aria-valuemax={max} aria-valuenow={Math.round(value)} aria-valuetext={text}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown} onDoubleClick={() => off != null && onChange(off)}
        title={`${label}: drag, scroll or use the arrow keys${off != null ? "; double-click = off" : ""}`}>
        <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
          <circle cx={C} cy={C} r={R - 5} className="geq-knob-cap" />
          <path d={arc(0, 1)} className="geq-knob-track" />
          <path d={offT <= t ? arc(offT, t) : arc(t, offT)} className="geq-knob-value" />
          <line x1={ix} y1={iy} x2={ox} y2={oy} className="geq-knob-pointer" />
        </svg>
      </div>
      <span className="geq-knob-label">{label}</span>
      <span className="geq-knob-text">{text}</span>
    </div>
  );
}
