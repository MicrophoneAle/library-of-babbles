import { create } from "zustand";

const DOWNLOAD_WEIGHT = 0.92;

type LobbyLoadState = {
  isLoading: boolean;
  progress: number;
  totalBytes: number | null;
  begin: (url: string) => void;
  reportProgress: (event: ProgressEvent) => void;
  finish: () => void;
  cancel: () => void;
};

export const useLobbyLoadStore = create<LobbyLoadState>((set, get) => ({
  isLoading: false,
  progress: 0,
  totalBytes: null,
  begin: (url) => {
    set({ isLoading: true, progress: 0, totalBytes: null });
    void fetch(url, { method: "HEAD" })
      .then((response) => {
        const length = response.headers.get("Content-Length");
        if (!length) {
          return;
        }
        const totalBytes = Number.parseInt(length, 10);
        if (Number.isFinite(totalBytes) && totalBytes > 0) {
          set({ totalBytes });
        }
      })
      .catch(() => {
        // Progress still works when the loader reports a computable total.
      });
  },
  reportProgress: (event) => {
    const { totalBytes } = get();
    const total =
      event.lengthComputable && event.total > 0 ? event.total : totalBytes;
    if (!total || event.loaded <= 0) {
      return;
    }
    const downloadProgress = Math.min(1, event.loaded / total);
    set({
      progress: Math.max(get().progress, downloadProgress * DOWNLOAD_WEIGHT * 100),
    });
  },
  finish: () => {
    set({ progress: 100, isLoading: false, totalBytes: null });
  },
  cancel: () => {
    set({ isLoading: false, progress: 0, totalBytes: null });
  },
}));
