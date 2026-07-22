import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Group, Vector3 } from "three";

import { useInteractStore } from "../../store/interactStore";
import type { InteractPromptDefinition } from "../../types/interactPrompt";

const anchorWorld = new Vector3();
const toAnchor = new Vector3();
const forward = new Vector3();

type WorldInteractPromptProps = {
  prompt: InteractPromptDefinition;
  /** World-space anchor (e.g. top of an asset). */
  position: Vector3 | null;
  /** When false, the prompt never shows (e.g. while a popup is open). */
  enabled?: boolean;
  onInteract?: () => void;
};

/**
 * Place near any asset: pass a prompt definition + world position.
 * Handles range, look-at facing, head-tracked billboard, and interact key.
 */
export function WorldInteractPrompt({
  prompt,
  position,
  enabled = true,
  onInteract,
}: WorldInteractPromptProps) {
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();
  const focusedId = useInteractStore((state) => state.focusedId);
  const popupId = useInteractStore((state) => state.popupId);
  const claimFocus = useInteractStore((state) => state.claimFocus);
  const releaseFocus = useInteractStore((state) => state.releaseFocus);
  const openPopup = useInteractStore((state) => state.openPopup);

  const isFocused = focusedId === prompt.id;
  const popupOpen = popupId !== null;

  useFrame(() => {
    const group = groupRef.current;

    if (!enabled || !position || popupOpen) {
      releaseFocus(prompt.id);
      return;
    }

    anchorWorld.copy(position);
    toAnchor.subVectors(anchorWorld, camera.position);
    const distance = toAnchor.length();

    if (distance > prompt.interactDistance || distance < 0.001) {
      releaseFocus(prompt.id);
      return;
    }

    camera.getWorldDirection(forward);
    toAnchor.normalize();
    if (forward.dot(toAnchor) < prompt.facingDotThreshold) {
      releaseFocus(prompt.id);
      return;
    }

    claimFocus(prompt.id, distance);

    if (!group) {
      return;
    }

    group.position.set(
      position.x,
      position.y + prompt.worldLift,
      position.z,
    );
    // Face the camera fully so the prompt pitches with the player's head.
    group.lookAt(camera.position);
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || popupOpen) {
        return;
      }
      if (event.code === prompt.interactKey && isFocused) {
        openPopup(prompt.id);
        onInteract?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prompt.interactKey, prompt.id, isFocused, popupOpen, openPopup, onInteract]);

  useEffect(() => {
    return () => {
      releaseFocus(prompt.id);
    };
  }, [prompt.id, releaseFocus]);

  if (!position || !isFocused || popupOpen || !enabled) {
    return null;
  }

  const { dimensions, colors } = prompt;

  return (
    <group ref={groupRef}>
      <Html
        transform
        center
        distanceFactor={dimensions.distanceFactor}
        style={{ pointerEvents: "none" }}
        zIndexRange={[30, 0]}
      >
        <div
          className="flex items-center whitespace-nowrap rounded shadow-md"
          style={{
            gap: dimensions.gap,
            padding: `${dimensions.paddingY}px ${dimensions.paddingX}px`,
            fontSize: dimensions.fontSize,
            lineHeight: 1,
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            color: colors.text,
          }}
        >
          <div
            className="flex shrink-0 items-center justify-center rounded font-semibold"
            style={{
              width: dimensions.keySize,
              height: dimensions.keySize,
              fontSize: dimensions.fontSize,
              backgroundColor: colors.keyBackground,
              border: `1px solid ${colors.keyBorder}`,
              color: colors.text,
            }}
          >
            {prompt.interactKeyLabel}
          </div>
          <span className="font-medium" style={{ fontSize: dimensions.fontSize }}>
            {prompt.label}
          </span>
        </div>
      </Html>
    </group>
  );
}
