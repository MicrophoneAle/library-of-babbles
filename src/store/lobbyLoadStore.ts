import type { GLTFLoader } from "three-stdlib";
import { create } from "zustand";

type LobbyLoadState = {
  progress: number;
  reset: () => void;
  setProgress: (progress: number) => void;
};

export const useLobbyLoadStore = create<LobbyLoadState>((set) => ({
  progress: 0,
  reset: () => set({ progress: 0 }),
  setProgress: (progress) =>
    set((state) => ({
      progress: Math.max(state.progress, Math.min(100, progress)),
    })),
}));

/** Report byte-level download progress for the lobby GLB only. */
export function createLobbyLoaderExtension() {
  return (loader: GLTFLoader) => {
    const originalLoad = loader.load.bind(loader);
    loader.load = (url, onLoad, onProgress, onError) =>
      originalLoad(
        url,
        (gltf) => {
          useLobbyLoadStore.getState().setProgress(100);
          onLoad(gltf);
        },
        (event) => {
          if (event.lengthComputable && event.total > 0) {
            useLobbyLoadStore
              .getState()
              .setProgress((event.loaded / event.total) * 100);
          }
          onProgress?.(event);
        },
        onError,
      );
  };
}
