import { Vector3 } from "three";
import { create } from "zustand";

interface GameState {
  currentRoom: string;
  spawnPoint: Vector3;
  floorSurfaceY: number;
  setSpawnPoint: (point: Vector3) => void;
  setFloorSurfaceY: (y: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentRoom: "lobby",
  spawnPoint: new Vector3(0, 0, 0),
  floorSurfaceY: 0,
  setSpawnPoint: (point) => set({ spawnPoint: point.clone() }),
  setFloorSurfaceY: (y) => set({ floorSurfaceY: y }),
}));
