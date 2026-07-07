import { Vector3 } from "three";
import { create } from "zustand";

interface GameState {
  currentRoom: string;
  spawnPoint: Vector3;
  spawnYaw: number;
  floorSurfaceY: number;
  setSpawnPoint: (point: Vector3, yaw?: number) => void;
  setFloorSurfaceY: (y: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentRoom: "lobby",
  spawnPoint: new Vector3(0, 0, 0),
  spawnYaw: 0,
  floorSurfaceY: 0,
  setSpawnPoint: (point, yaw = 0) =>
    set({ spawnPoint: point.clone(), spawnYaw: yaw }),
  setFloorSurfaceY: (y) => set({ floorSurfaceY: y }),
}));
