import { motion } from "framer-motion";
import { useEffect } from "react";

import { UNDER_CONSTRUCTION_PROMPT_IDS } from "../../config/interactPrompts";
import { useInteractStore } from "../../store/interactStore";

/** Shared popup for sealed entrance doors. */
export function UnderConstructionPopup() {
  const popupId = useInteractStore((state) => state.popupId);
  const closePopup = useInteractStore((state) => state.closePopup);
  const open = popupId !== null && UNDER_CONSTRUCTION_PROMPT_IDS.has(popupId);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        closePopup();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closePopup]);

  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-6 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-w-md rounded-lg border border-[#dec39b]/45 bg-[#2a1c14]/95 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="under-construction-popup-title"
      >
        <p className="text-[10px] uppercase tracking-[0.22em] text-amber-50/80">
          Beyond these doors
        </p>
        <h2
          id="under-construction-popup-title"
          className="mt-2 text-xl font-semibold text-amber-50"
        >
          Area under construction
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-50/90">
          This wing of the library is still being built. Check back once the
          stacks are ready to explore.
        </p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <span className="text-xs text-white/45">Esc to close</span>
          <button
            type="button"
            onClick={closePopup}
            className="rounded border border-white/35 bg-black/40 px-4 py-1.5 text-sm font-medium text-white/90 transition hover:bg-black/60"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
