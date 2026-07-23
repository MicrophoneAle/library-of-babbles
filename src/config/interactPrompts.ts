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

const doorPromptDefaults = {
  interactKey: "KeyF" as const,
  interactKeyLabel: "F",
  label: "Area under construction",
  interactDistance: 4,
  facingDotThreshold: 0.25,
  worldLift: 0.05,
  dimensions: {
    distanceFactor: 2.2,
  },
};

/** Ground-floor (−Z) entrance doors. */
export const BACK_DOOR_INTERACT_PROMPT = createInteractPrompt({
  id: "lobby-door-back",
  ...doorPromptDefaults,
});

/** Mezzanine (+Z) entrance doors. */
export const FRONT_DOOR_INTERACT_PROMPT = createInteractPrompt({
  id: "lobby-door-front",
  ...doorPromptDefaults,
});

export const UNDER_CONSTRUCTION_PROMPT_IDS = new Set([
  BACK_DOOR_INTERACT_PROMPT.id,
  FRONT_DOOR_INTERACT_PROMPT.id,
]);
