import { useLoader } from "@react-three/fiber";
import { DRACOLoader, GLTFLoader, MeshoptDecoder } from "three-stdlib";

import { useLobbyLoadStore } from "./lobbyLoadStore";

let dracoLoader: DRACOLoader | null = null;

function configureLobbyLoader(loader: GLTFLoader) {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.5/",
    );
  }
  loader.setDRACOLoader(dracoLoader);
  loader.setMeshoptDecoder(
    typeof MeshoptDecoder === "function" ? MeshoptDecoder() : MeshoptDecoder,
  );
}

export function useLobbyGLTF(url: string) {
  const state = useLobbyLoadStore.getState();
  if (!state.isLoading) {
    state.begin(url);
  }

  return useLoader(
    GLTFLoader,
    url,
    configureLobbyLoader,
    (event) => useLobbyLoadStore.getState().reportProgress(event),
  );
}
