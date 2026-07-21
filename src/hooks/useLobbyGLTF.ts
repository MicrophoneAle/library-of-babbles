import { suspend } from "suspend-react";
import { DRACOLoader, GLTFLoader, MeshoptDecoder } from "three-stdlib";
import type { GLTF } from "three-stdlib";

import {
  concatResponseBody,
  resolveAssetByteLength,
  useLobbyLoadStore,
} from "../store/lobbyLoadStore";

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

function parseLobbyGltf(data: ArrayBuffer): Promise<GLTF> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    configureLobbyLoader(loader);
    loader.parse(
      data,
      "",
      (gltf) => {
        resolve(gltf);
      },
      reject,
    );
  });
}

async function loadLobbyGltf(url: string): Promise<GLTF> {
  const store = useLobbyLoadStore.getState();
  store.begin();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url}: HTTP ${response.status}`);
  }

  const totalBytes = await resolveAssetByteLength(url, response);
  if (totalBytes > 0) {
    store.setTotalBytes(totalBytes);
  }

  const data = await concatResponseBody(response);
  store.setParsing();
  return parseLobbyGltf(data);
}

export function useLobbyGLTF(url: string) {
  return suspend(loadLobbyGltf, [url]);
}
