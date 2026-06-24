import { create } from "zustand";
import type { FilmStockType, AspectRatioEnum } from "@/types";

export type UploadItem = {
  id: string;
  file: File;
  preview: string;
  status: "PENDING" | "UPLOADING" | "SUCCESS" | "FAILED";
  photoId?: string;
  error?: string;
};

type CameraState = {
  isCameraReady: boolean;
  cameraFacing: "user" | "environment";
  selectedFilmStock: FilmStockType | null;
  selectedAspectRatio: AspectRatioEnum;
  activeRollId: string | null;
  uploadQueue: UploadItem[];

  setCameraReady: (ready: boolean) => void;
  toggleCameraFacing: () => void;
  selectFilmStock: (stock: FilmStockType) => void;
  selectAspectRatio: (ratio: AspectRatioEnum) => void;
  setActiveRollId: (id: string | null) => void;
  addToQueue: (item: UploadItem) => void;
  updateUploadStatus: (id: string, status: UploadItem["status"], photoId?: string, error?: string) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  reset: () => void;
};

export const useCameraStore = create<CameraState>((set) => ({
  isCameraReady: false,
  cameraFacing: "environment",
  selectedFilmStock: null,
  selectedAspectRatio: "PORTRAIT",
  activeRollId: null,
  uploadQueue: [],

  setCameraReady: (ready) => set({ isCameraReady: ready }),
  toggleCameraFacing: () =>
    set((state) => ({
      cameraFacing: state.cameraFacing === "environment" ? "user" : "environment",
    })),
  selectFilmStock: (stock) => set({ selectedFilmStock: stock }),
  selectAspectRatio: (ratio) => set({ selectedAspectRatio: ratio }),
  setActiveRollId: (id) => set({ activeRollId: id }),
  addToQueue: (item) =>
    set((state) => ({ uploadQueue: [...state.uploadQueue, item] })),
  updateUploadStatus: (id, status, photoId, error) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.id === id ? { ...item, status, photoId, error } : item
      ),
    })),
  removeFromQueue: (id) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.filter((item) => item.id !== id),
    })),
  clearQueue: () => set({ uploadQueue: [] }),
  reset: () =>
    set({
      isCameraReady: false,
      cameraFacing: "environment",
      selectedFilmStock: null,
      selectedAspectRatio: "PORTRAIT",
      activeRollId: null,
      uploadQueue: [],
    }),
}));
