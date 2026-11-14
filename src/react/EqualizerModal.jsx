import { useEffect } from "react";
import { createPortal } from "react-dom";
import Equalizer from "./Equalizer.jsx";
import { useEqualizer } from "./useEqualizer.js";

/**
 * <Equalizer> in a dialog, rendered into <body> (so a transformed / backdrop-filtered parent can't trap it).
 * Closes on Escape, a click on the backdrop, or Done. Takes every <Equalizer> prop as well.
 */
export default function EqualizerModal({ eq, open = true, onClose, title = "Equalizer", ...props }) {
  const { bands } = useEqualizer(eq);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="geq-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`geq-dialog${bands.length > 7 ? " geq-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title || "Equalizer"}>
        <Equalizer eq={eq} title={title} onDone={onClose} {...props} />
      </div>
    </div>,
    document.body
  );
}
