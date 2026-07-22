import type { Vector3 } from "three";

/** On-screen size of the prompt badge (CSS px + drei distanceFactor). */
export type InteractPromptDimensions = {
  /** Font size for the key glyph and label text. */
  fontSize: number;
  /** Width/height of the key badge square. */
  keySize: number;
  /** Horizontal padding inside the prompt pill. */
  paddingX: number;
  /** Vertical padding inside the prompt pill. */
  paddingY: number;
  /** Gap between the key badge and the label. */
  gap: number;
  /**
   * drei `Html` distanceFactor — higher = larger on screen.
   * Keeps apparent size roughly stable as the camera moves.
   */
  distanceFactor: number;
};

/** Optional color overrides for the prompt pill. */
export type InteractPromptColors = {
  background: string;
  border: string;
  keyBackground: string;
  keyBorder: string;
  text: string;
};

/**
 * Reusable world interact prompt definition.
 * Place one near any asset by pairing this with a world position.
 */
export type InteractPromptDefinition = {
  /** Unique id — used for focus / popup routing. */
  id: string;
  /** `KeyboardEvent.code`, e.g. `"KeyF"`. */
  interactKey: string;
  /** Character shown on the key badge, e.g. `"F"`. */
  interactKeyLabel: string;
  /** Text beside the key, e.g. `"Interact"`. */
  label: string;
  /** Show prompt when the camera is within this many meters of the anchor. */
  interactDistance: number;
  /**
   * How much the player must look toward the anchor (camera forward · toAnchor).
   * Closer to 1 = must look more directly at it.
   */
  facingDotThreshold: number;
  /** Extra world-space height above the anchor point. */
  worldLift: number;
  dimensions: InteractPromptDimensions;
  colors: InteractPromptColors;
};

/** A prompt definition bound to a world position. */
export type InteractPromptPlacement = InteractPromptDefinition & {
  position: Vector3;
};

export const DEFAULT_INTERACT_PROMPT_DIMENSIONS: InteractPromptDimensions = {
  fontSize: 12,
  keySize: 22,
  paddingX: 8,
  paddingY: 4,
  gap: 6,
  distanceFactor: 1.8,
};

export const DEFAULT_INTERACT_PROMPT_COLORS: InteractPromptColors = {
  background: "#fffbeb", // amber-50
  border: "#fde68a", // amber-200
  keyBackground: "#ffffff",
  keyBorder: "#fcd34d", // amber-300
  text: "#292524", // stone-800
};

export function createInteractPrompt(
  partial: Omit<InteractPromptDefinition, "dimensions" | "colors"> & {
    dimensions?: Partial<InteractPromptDimensions>;
    colors?: Partial<InteractPromptColors>;
  },
): InteractPromptDefinition {
  return {
    ...partial,
    dimensions: {
      ...DEFAULT_INTERACT_PROMPT_DIMENSIONS,
      ...partial.dimensions,
    },
    colors: {
      ...DEFAULT_INTERACT_PROMPT_COLORS,
      ...partial.colors,
    },
  };
}
