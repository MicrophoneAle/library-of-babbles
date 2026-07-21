import { create } from "zustand";

const DOWNLOAD_WEIGHT = 0.92;
const FINISH_VISIBLE_MS = 900;

type LobbyLoadState = {
  isLoading: boolean;
  progress: number;
  totalBytes: number | null;
  begin: () => void;
  setTotalBytes: (totalBytes: number) => void;
  reportBytes: (loaded: number, total: number) => void;
  setParsing: () => void;
  finish: () => Promise<void>;
  cancel: () => void;
};

export const useLobbyLoadStore = create<LobbyLoadState>((set, get) => ({
  isLoading: false,
  progress: 0,
  totalBytes: null,
  begin: () => {
    set({ isLoading: true, progress: 0, totalBytes: null });
  },
  setTotalBytes: (totalBytes) => {
    set({ totalBytes });
  },
  reportBytes: (loaded, total) => {
    if (total <= 0 || loaded <= 0) {
      return;
    }
    const downloadProgress = Math.min(1, loaded / total);
    set({
      progress: Math.max(
        get().progress,
        downloadProgress * DOWNLOAD_WEIGHT * 100,
      ),
    });
  },
  setParsing: () => {
    set({ progress: Math.max(get().progress, 92) });
  },
  finish: async () => {
    set({ progress: 100 });
    await new Promise((resolve) => {
      window.setTimeout(resolve, FINISH_VISIBLE_MS);
    });
    set({ isLoading: false, totalBytes: null });
  },
  cancel: () => {
    set({ isLoading: false, progress: 0, totalBytes: null });
  },
}));

export function parseContentLength(header: string | null) {
  if (!header) {
    return 0;
  }
  const totalBytes = Number.parseInt(header, 10);
  return Number.isFinite(totalBytes) && totalBytes > 0 ? totalBytes : 0;
}

export async function concatResponseBody(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    return response.arrayBuffer();
  }

  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
    loaded += value.byteLength;
    const store = useLobbyLoadStore.getState();
    const total = store.totalBytes ?? 0;
    if (total > 0) {
      store.reportBytes(loaded, total);
    }
  }

  const buffer = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer.buffer;
}

export async function resolveAssetByteLength(url: string, response: Response) {
  const headTotal = parseContentLength(
    (await fetch(url, { method: "HEAD" }).catch(() => null))?.headers.get(
      "Content-Length",
    ) ?? null,
  );
  if (headTotal > 0) {
    return headTotal;
  }

  const responseTotal = parseContentLength(response.headers.get("Content-Length"));
  if (responseTotal > 0) {
    return responseTotal;
  }

  // Vercel/edge responses may omit Content-Length for streamed responses.
  // Keep a deterministic fallback for known heavy room assets.
  if (url.includes("room_lobby_textured_walls.glb")) {
    return 121_636_268;
  }
  if (url.includes("room_lobby.glb")) {
    return 42_382_604;
  }
  return 0;
}
