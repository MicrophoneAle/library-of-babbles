import { motion } from "framer-motion";
import { useEffect } from "react";

import { LECTERN_INTERACT_PROMPT } from "../../config/interactPrompts";
import { useInteractStore } from "../../store/interactStore";

/** Lectern welcome popup — opened by {@link LECTERN_INTERACT_PROMPT}. */
export function LecternPopup() {
  const popupId = useInteractStore((state) => state.popupId);
  const closePopup = useInteractStore((state) => state.closePopup);
  const open = popupId === LECTERN_INTERACT_PROMPT.id;

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
        aria-labelledby="lectern-popup-title"
      >
        <p className="text-[10px] uppercase tracking-[0.22em] text-amber-50/80">
          Grand Lectern
        </p>
        <h2
          id="lectern-popup-title"
          className="mt-2 text-xl font-semibold text-amber-50"
        >
          Welcome, traveler.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-50/90">
          This is my personal corner of the infinite stacks: a place for
          projects, thoughts, and a living record of books I have read, I am
          reading, and I hope to read next.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-amber-50/90">
          Expect craftsmanship, curiosity, and eventually an AI librarian that
          helps uncover your next favorite shelf.
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
