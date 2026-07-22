import { createInteractPrompt } from "../types/interactPrompt";

/** Lobby lectern — introduction / welcome interactable. */
export const LECTERN_INTERACT_PROMPT = createInteractPrompt({
  id: "lobby-lectern",
  interactKey: "KeyF",
  interactKeyLabel: "F",
  label: "Interact",
  interactDistance: 2.75,
  facingDotThreshold: 0.35,
  worldLift: 0.55,
  dimensions: {
    distanceFactor: 1.8,
  },
});
