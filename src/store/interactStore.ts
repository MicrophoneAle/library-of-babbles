import { create } from "zustand";

type InteractFocusState = {
  /** Prompt currently in range and closest to the camera. */
  focusedId: string | null;
  focusedDistance: number;
  /** Open popup id, if any. */
  popupId: string | null;
  /**
   * Claim focus if this prompt is closer than the current focus
   * (or nothing is focused). Call every frame while eligible.
   */
  claimFocus: (id: string, distance: number) => void;
  /** Drop focus when out of range / looking away. */
  releaseFocus: (id: string) => void;
  openPopup: (id: string) => void;
  closePopup: () => void;
};

export const useInteractStore = create<InteractFocusState>((set, get) => ({
  focusedId: null,
  focusedDistance: Number.POSITIVE_INFINITY,
  popupId: null,
  claimFocus: (id, distance) => {
    const { focusedId, focusedDistance, popupId } = get();
    if (popupId) {
      return;
    }
    if (focusedId === null || focusedId === id || distance < focusedDistance) {
      set({ focusedId: id, focusedDistance: distance });
    }
  },
  releaseFocus: (id) => {
    const { focusedId } = get();
    if (focusedId === id) {
      set({
        focusedId: null,
        focusedDistance: Number.POSITIVE_INFINITY,
      });
    }
  },
  openPopup: (id) => {
    document.exitPointerLock();
    set({
      popupId: id,
      focusedId: null,
      focusedDistance: Number.POSITIVE_INFINITY,
    });
  },
  closePopup: () => set({ popupId: null }),
}));
