import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Group, Vector3 } from "three";

import { useGameStore } from "../../store/gameStore";

const INTERACT_DISTANCE = 2.75;
const FACING_DOT_THRESHOLD = 0.35;
/** World-space lift above the lectern top anchor. */
const PROMPT_WORLD_LIFT = 0.55;
/**
 * drei Html distanceFactor — keeps on-screen size roughly constant.
 * Higher = larger prompt.
 */
const PROMPT_DISTANCE_FACTOR = 5.5;

const lecternWorld = new Vector3();
const toLectern = new Vector3();
const forward = new Vector3();

/** Visibility + range checks only. */
export function LecternInteractTracker() {
  const lecternInteractPoint = useGameStore((state) => state.lecternInteractPoint);
  const lecternPopupOpen = useGameStore((state) => state.lecternPopupOpen);
  const setLecternPrompt = useGameStore((state) => state.setLecternPrompt);
  const { camera } = useThree();

  useFrame(() => {
    if (!lecternInteractPoint || lecternPopupOpen) {
      setLecternPrompt({ visible: false, screenX: 0, screenY: 0, facingYaw: 0 });
      return;
    }

    lecternWorld.copy(lecternInteractPoint);
    toLectern.subVectors(lecternWorld, camera.position);
    const distance = toLectern.length();
    if (distance > INTERACT_DISTANCE || distance < 0.001) {
      setLecternPrompt({ visible: false, screenX: 0, screenY: 0, facingYaw: 0 });
      return;
    }

    camera.getWorldDirection(forward);
    toLectern.normalize();
    if (forward.dot(toLectern) < FACING_DOT_THRESHOLD) {
      setLecternPrompt({ visible: false, screenX: 0, screenY: 0, facingYaw: 0 });
      return;
    }

    setLecternPrompt({ visible: true, screenX: 0, screenY: 0, facingYaw: 0 });
  });

  return null;
}

/**
 * World-anchored prompt that yaws on Y to lookAt the camera (true billboard).
 * Size is stabilized with distanceFactor so it doesn't blow up when close.
 */
export function LecternInteractPrompt() {
  const groupRef = useRef<Group>(null);
  const lecternInteractPoint = useGameStore((state) => state.lecternInteractPoint);
  const lecternPrompt = useGameStore((state) => state.lecternPrompt);
  const lecternPopupOpen = useGameStore((state) => state.lecternPopupOpen);
  const { camera } = useThree();

  useFrame(() => {
    const group = groupRef.current;
    if (!group || !lecternInteractPoint) {
      return;
    }

    group.position.set(
      lecternInteractPoint.x,
      lecternInteractPoint.y + PROMPT_WORLD_LIFT,
      lecternInteractPoint.z,
    );

    // Y-axis billboard: face the camera horizontally, stay upright.
    // lookAt aims local -Z at the target; Html content faces +Z, so flip 180°.
    group.lookAt(camera.position.x, group.position.y, camera.position.z);
    group.rotateY(Math.PI);
  });

  if (!lecternInteractPoint || !lecternPrompt.visible || lecternPopupOpen) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <Html
        transform
        center
        distanceFactor={PROMPT_DISTANCE_FACTOR}
        style={{ pointerEvents: "none" }}
        zIndexRange={[30, 0]}
      >
        <div
          className="flex items-center gap-1.5 whitespace-nowrap rounded border border-amber-200 bg-amber-50 px-2 py-1 shadow-md"
          style={{ fontSize: 12, lineHeight: 1 }}
        >
          <div
            className="flex shrink-0 items-center justify-center rounded border border-amber-300 bg-white font-semibold text-stone-800"
            style={{ width: 22, height: 22, fontSize: 12 }}
          >
            F
          </div>
          <span className="font-medium text-stone-800" style={{ fontSize: 12 }}>
            Interact
          </span>
        </div>
      </Html>
    </group>
  );
}

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
