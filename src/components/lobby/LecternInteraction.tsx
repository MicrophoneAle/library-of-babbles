import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Vector3 } from "three";

import { useGameStore } from "../../store/gameStore";

const INTERACT_DISTANCE = 2.75;
const FACING_DOT_THRESHOLD = 0.45;

const lecternWorld = new Vector3();
const toLectern = new Vector3();
const forward = new Vector3();

export function LecternInteractTracker() {
  const lecternInteractPoint = useGameStore((state) => state.lecternInteractPoint);
  const lecternPopupOpen = useGameStore((state) => state.lecternPopupOpen);
  const setLecternPromptVisible = useGameStore(
    (state) => state.setLecternPromptVisible,
  );

  useFrame(({ camera }) => {
    if (!lecternInteractPoint || lecternPopupOpen) {
      setLecternPromptVisible(false);
      return;
    }

    lecternWorld.copy(lecternInteractPoint);
    toLectern.subVectors(lecternWorld, camera.position);
    const distance = toLectern.length();
    if (distance > INTERACT_DISTANCE) {
      setLecternPromptVisible(false);
      return;
    }

    camera.getWorldDirection(forward);
    toLectern.normalize();
    if (forward.dot(toLectern) < FACING_DOT_THRESHOLD) {
      setLecternPromptVisible(false);
      return;
    }

    setLecternPromptVisible(true);
  });

  return null;
}

/** World-anchored prompt — stays fixed above the lectern in screen space. */
export function LecternInteractPrompt() {
  const lecternInteractPoint = useGameStore((state) => state.lecternInteractPoint);
  const lecternPromptVisible = useGameStore((state) => state.lecternPromptVisible);
  const lecternPopupOpen = useGameStore((state) => state.lecternPopupOpen);

  if (!lecternInteractPoint || !lecternPromptVisible || lecternPopupOpen) {
    return null;
  }

  return (
    <Html
      position={[
        lecternInteractPoint.x,
        lecternInteractPoint.y,
        lecternInteractPoint.z,
      ]}
      center
      distanceFactor={6}
      zIndexRange={[30, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div
        className="flex items-center gap-2 whitespace-nowrap rounded border border-amber-200 bg-amber-50 px-3 py-1.5 shadow-lg"
        style={{ transform: "translateY(calc(-100% - 12px))" }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded border border-amber-300 bg-white text-sm font-semibold text-stone-800">
          F
        </div>
        <span className="text-sm font-medium text-stone-800">Interact</span>
      </div>
    </Html>
  );
}

export function LecternInteractionUI() {
  const lecternPromptVisible = useGameStore((state) => state.lecternPromptVisible);
  const lecternPopupOpen = useGameStore((state) => state.lecternPopupOpen);
  const openLecternPopup = useGameStore((state) => state.openLecternPopup);
  const closeLecternPopup = useGameStore((state) => state.closeLecternPopup);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }
      if (event.code === "KeyF" && lecternPromptVisible && !lecternPopupOpen) {
        openLecternPopup();
      }
      if (event.code === "Escape" && lecternPopupOpen) {
        closeLecternPopup();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lecternPromptVisible, lecternPopupOpen, openLecternPopup, closeLecternPopup]);

  if (!lecternPopupOpen) {
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
            onClick={closeLecternPopup}
            className="rounded border border-white/35 bg-black/40 px-4 py-1.5 text-sm font-medium text-white/90 transition hover:bg-black/60"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
