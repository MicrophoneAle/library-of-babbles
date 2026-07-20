import { Vector3 } from "three";
import { create } from "zustand";

export type MoveSpeedMode = "slow" | "medium" | "fast";

const SPEED_ORDER: MoveSpeedMode[] = ["slow", "medium", "fast"];

interface GameState {
  currentRoom: string;
  spawnPoint: Vector3;
  spawnYaw: number;
  floorSurfaceY: number;
  moveSpeedMode: MoveSpeedMode;
  setSpawnPoint: (point: Vector3, yaw?: number) => void;
  setFloorSurfaceY: (y: number) => void;
  setMoveSpeedMode: (mode: MoveSpeedMode) => void;
  /** C → one step slower. V → one step faster. */
  adjustMoveSpeed: (direction: "slower" | "faster") => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentRoom: "lobby",
  spawnPoint: new Vector3(0, 0, 0),
  spawnYaw: 0,
  floorSurfaceY: 0,
  moveSpeedMode: "medium",
  setSpawnPoint: (point, yaw = 0) =>
    set({ spawnPoint: point.clone(), spawnYaw: yaw }),
  setFloorSurfaceY: (y) => set({ floorSurfaceY: y }),
  setMoveSpeedMode: (mode) => set({ moveSpeedMode: mode }),
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
