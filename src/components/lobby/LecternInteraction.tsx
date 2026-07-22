import { useFrame, useThree } from "@react-three/fiber";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Vector3 } from "three";

import { useGameStore } from "../../store/gameStore";

const INTERACT_DISTANCE = 2.75;
const FACING_DOT_THRESHOLD = 0.35;
/** Fixed screen pixels above the projected lectern-top point. */
const PROMPT_OFFSET_Y = 20;

/** Locked CSS pixel size — never scales with distance. */
const PROMPT_FONT_PX = 12;
const KEY_SIZE_PX = 22;

const lecternWorld = new Vector3();
const toLectern = new Vector3();
const forward = new Vector3();
const projected = new Vector3();

/**
 * Projects the lectern TOP into screen pixels. A fixed pixel offset places the
 * prompt above it, so the label doesn't drift down when you walk closer.
 */
export function LecternInteractTracker() {
  const lecternInteractPoint = useGameStore((state) => state.lecternInteractPoint);
  const lecternPopupOpen = useGameStore((state) => state.lecternPopupOpen);
  const setLecternPrompt = useGameStore((state) => state.setLecternPrompt);
  const { camera, gl } = useThree();

  useFrame(() => {
    if (!lecternInteractPoint || lecternPopupOpen) {
      setLecternPrompt({ visible: false, screenX: 0, screenY: 0 });
      return;
    }

    lecternWorld.copy(lecternInteractPoint);
    toLectern.subVectors(lecternWorld, camera.position);
    const distance = toLectern.length();
    if (distance > INTERACT_DISTANCE || distance < 0.001) {
      setLecternPrompt({ visible: false, screenX: 0, screenY: 0 });
      return;
    }

    camera.getWorldDirection(forward);
    toLectern.normalize();
    if (forward.dot(toLectern) < FACING_DOT_THRESHOLD) {
      setLecternPrompt({ visible: false, screenX: 0, screenY: 0 });
      return;
    }

    projected.copy(lecternWorld).project(camera);
    if (projected.z > 1 || projected.z < -1) {
      setLecternPrompt({ visible: false, screenX: 0, screenY: 0 });
      return;
    }

    const rect = gl.domElement.getBoundingClientRect();
    const screenX = (projected.x * 0.5 + 0.5) * rect.width;
    const screenY = (-projected.y * 0.5 + 0.5) * rect.height;

    setLecternPrompt({
      visible: true,
      screenX,
      screenY,
    });
  });

  return null;
}

/** Fixed-size DOM overlay locked above the lectern; F key spins in place. */
export function LecternInteractionUI() {
  const lecternPrompt = useGameStore((state) => state.lecternPrompt);
  const lecternPopupOpen = useGameStore((state) => state.lecternPopupOpen);
  const openLecternPopup = useGameStore((state) => state.openLecternPopup);
  const closeLecternPopup = useGameStore((state) => state.closeLecternPopup);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }
      if (event.code === "KeyF" && lecternPrompt.visible && !lecternPopupOpen) {
        openLecternPopup();
      }
      if (event.code === "Escape" && lecternPopupOpen) {
        closeLecternPopup();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lecternPrompt.visible, lecternPopupOpen, openLecternPopup, closeLecternPopup]);

  return (
    <>
      {lecternPrompt.visible && !lecternPopupOpen ? (
        <div
          className="pointer-events-none absolute z-30"
          style={{
            left: lecternPrompt.screenX,
            top: lecternPrompt.screenY - PROMPT_OFFSET_Y,
            transform: "translate(-50%, -100%)",
            width: "max-content",
          }}
        >
          <div
            className="flex items-center gap-1.5 whitespace-nowrap rounded border border-amber-200 bg-amber-50 shadow-md"
            style={{
              padding: "4px 8px",
              fontSize: PROMPT_FONT_PX,
              lineHeight: 1,
            }}
          >
            <motion.div
              className="flex shrink-0 items-center justify-center rounded border border-amber-300 bg-white font-semibold text-stone-800"
              style={{
                width: KEY_SIZE_PX,
                height: KEY_SIZE_PX,
                fontSize: PROMPT_FONT_PX,
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 4,
                ease: "linear",
                repeat: Infinity,
              }}
            >
              F
            </motion.div>
            <span
              className="font-medium text-stone-800"
              style={{ fontSize: PROMPT_FONT_PX }}
            >
              Interact
            </span>
          </div>
        </div>
      ) : null}

      {lecternPopupOpen ? (
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
      ) : null}
    </>
  );
}
