import { create } from "zustand";
import type { VisitorType } from "@/types";

type VisitorState = {
  visitor: VisitorType | null;
  isLoading: boolean;
  setVisitor: (visitor: VisitorType) => void;
  clearVisitor: () => void;
  setLoading: (loading: boolean) => void;
};

export const useVisitorStore = create<VisitorState>((set) => ({
  visitor: null,
  isLoading: true,
  setVisitor: (visitor) => set({ visitor, isLoading: false }),
  clearVisitor: () => set({ visitor: null }),
  setLoading: (isLoading) => set({ isLoading }),
}));
