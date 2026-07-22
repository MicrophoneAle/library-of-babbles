import { createInteractPrompt } from "../types/interactPrompt";

/** Lobby lectern — introduction / welcome interactable. */
export const LECTERN_INTERACT_PROMPT = createInteractPrompt({
  id: "lobby-lectern",
  interactKey: "KeyF",
  interactKeyLabel: "F",
  label: "Interact",
  interactDistance: 2.75,
  facingDotThreshold: 0.35,
  worldLift: 0.19,
  dimensions: {
    distanceFactor: 1.8,
  },
});

/** Lobby reception desk — front counter interactable. */
export const RECEPTION_DESK_INTERACT_PROMPT = createInteractPrompt({
  id: "lobby-reception-desk",
  interactKey: "KeyF",
  interactKeyLabel: "F",
  label: "Interact",
  interactDistance: 3.5,
  facingDotThreshold: 0.3,
  worldLift: 0.19,
  dimensions: {
    distanceFactor: 2.0,
  },
});
