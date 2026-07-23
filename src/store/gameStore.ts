import { Vector3 } from "three";
import { create } from "zustand";

export type MoveSpeedMode = "slow" | "medium" | "fast" | "sprint";

const SPEED_ORDER: MoveSpeedMode[] = ["slow", "medium", "fast", "sprint"];

interface GameState {
  currentRoom: string;
  spawnPoint: Vector3;
  spawnYaw: number;
  floorSurfaceY: number;
  moveSpeedMode: MoveSpeedMode;
  /** World anchor for the lobby lectern interact prompt. */
  lecternInteractPoint: Vector3 | null;
  /** World anchor for the reception desk front interact prompt. */
  receptionDeskInteractPoint: Vector3 | null;
  /** World anchors for entrance door prompts (−Z back, +Z front). */
  backDoorInteractPoint: Vector3 | null;
  frontDoorInteractPoint: Vector3 | null;
  setSpawnPoint: (point: Vector3, yaw?: number) => void;
  setFloorSurfaceY: (y: number) => void;
  setMoveSpeedMode: (mode: MoveSpeedMode) => void;
  setLecternInteractPoint: (point: Vector3 | null) => void;
  setReceptionDeskInteractPoint: (point: Vector3 | null) => void;
  setBackDoorInteractPoint: (point: Vector3 | null) => void;
  setFrontDoorInteractPoint: (point: Vector3 | null) => void;
  /** C → one step slower. V → one step faster. */
  adjustMoveSpeed: (direction: "slower" | "faster") => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentRoom: "lobby",
  spawnPoint: new Vector3(0, 0, 0),
  spawnYaw: 0,
  floorSurfaceY: 0,
  moveSpeedMode: "fast",
  lecternInteractPoint: null,
  receptionDeskInteractPoint: null,
  backDoorInteractPoint: null,
  frontDoorInteractPoint: null,
  setSpawnPoint: (point, yaw = 0) =>
    set({ spawnPoint: point.clone(), spawnYaw: yaw }),
  setFloorSurfaceY: (y) => set({ floorSurfaceY: y }),
  setMoveSpeedMode: (mode) => set({ moveSpeedMode: mode }),
  setLecternInteractPoint: (point) =>
    set({ lecternInteractPoint: point ? point.clone() : null }),
  setReceptionDeskInteractPoint: (point) =>
    set({ receptionDeskInteractPoint: point ? point.clone() : null }),
  setBackDoorInteractPoint: (point) =>
    set({ backDoorInteractPoint: point ? point.clone() : null }),
  setFrontDoorInteractPoint: (point) =>
    set({ frontDoorInteractPoint: point ? point.clone() : null }),
  adjustMoveSpeed: (direction) => {
    const current = get().moveSpeedMode;
    const index = SPEED_ORDER.indexOf(current);
    const nextIndex =
      direction === "slower"
        ? Math.max(0, index - 1)
        : Math.min(SPEED_ORDER.length - 1, index + 1);
    set({ moveSpeedMode: SPEED_ORDER[nextIndex] });
  },
}));
