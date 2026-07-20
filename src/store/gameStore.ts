import { Vector3 } from "three";
import { create } from "zustand";

export type MoveSpeedMode = "slow" | "medium" | "fast";

interface GameState {
  currentRoom: string;
  spawnPoint: Vector3;
  spawnYaw: number;
  floorSurfaceY: number;
  moveSpeedMode: MoveSpeedMode;
  setSpawnPoint: (point: Vector3, yaw?: number) => void;
  setFloorSurfaceY: (y: number) => void;
  setMoveSpeedMode: (mode: MoveSpeedMode) => void;
  /** C → slow (toggle back to medium). V → fast (toggle back to medium). */
  cycleMoveSpeedFromKey: (key: "slow" | "fast") => void;
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
  cycleMoveSpeedFromKey: (key) => {
    const current = get().moveSpeedMode;
    if (key === "slow") {
      set({ moveSpeedMode: current === "slow" ? "medium" : "slow" });
      return;
    }
    set({ moveSpeedMode: current === "fast" ? "medium" : "fast" });
  },
}));
