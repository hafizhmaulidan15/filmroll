import type { FilmStockType, RollType, PhotoType, ShareRollType, ContactSheetType } from "@/types";

function getHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("visitorToken") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["x-visitor-token"] = token;
  return headers;
}

export const api = {
  visitor: {
    create: async () => {
      const res = await fetch("/api/v1/visitor", { method: "POST" });
      return res.json();
    },
    get: async () => {
      const res = await fetch("/api/v1/visitor", { headers: getHeaders() });
      return res.json();
    },
  },

  filmStocks: {
    list: async (): Promise<{ success: boolean; data: FilmStockType[] }> => {
      const res = await fetch("/api/v1/film-stocks");
      return res.json();
    },
  },

  rolls: {
    create: async (data: { filmStockId: string; aspectRatio: string; title?: string }) => {
      const res = await fetch("/api/v1/rolls", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return res.json();
    },
    list: async (): Promise<{ success: boolean; data: RollType[] }> => {
      const res = await fetch("/api/v1/rolls", { headers: getHeaders() });
      return res.json();
    },
    get: async (id: string): Promise<{ success: boolean; data: RollType }> => {
      const res = await fetch(`/api/v1/rolls/${id}`, { headers: getHeaders() });
      return res.json();
    },
    update: async (id: string, data: { title?: string }) => {
      const res = await fetch(`/api/v1/rolls/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return res.json();
    },
    finish: async (id: string) => {
      const res = await fetch(`/api/v1/rolls/${id}/finish`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      return res.json();
    },
  },

  photos: {
    list: async (params?: { status?: string; rollId?: string }): Promise<{ success: boolean; data: PhotoType[] }> => {
      const query = new URLSearchParams(params || {}).toString();
      const res = await fetch(`/api/v1/photos${query ? `?${query}` : ""}`, {
        headers: getHeaders(),
      });
      return res.json();
    },
    get: async (id: string): Promise<{ success: boolean; data: PhotoType }> => {
      const res = await fetch(`/api/v1/photos/${id}`, { headers: getHeaders() });
      return res.json();
    },
    upload: async (file: File, rollId: string) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("rollId", rollId);
      const token = localStorage.getItem("visitorToken");
      const res = await fetch("/api/v1/photos/upload", {
        method: "POST",
        headers: token ? { "x-visitor-token": token } : {},
        body: formData,
      });
      return res.json();
    },
    update: async (id: string, data: { caption?: string }) => {
      const res = await fetch(`/api/v1/photos/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`/api/v1/photos/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return res.status === 204;
    },
    archive: async (id: string) => {
      const res = await fetch(`/api/v1/photos/${id}/archive`, {
        method: "POST",
        headers: getHeaders(),
      });
      return res.json();
    },
  },

  shareRolls: {
    create: async (rollId: string): Promise<{ success: boolean; data: ShareRollType & { shareUrl: string } }> => {
      const res = await fetch("/api/v1/share-rolls", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ rollId }),
      });
      return res.json();
    },
    disable: async (id: string) => {
      const res = await fetch(`/api/v1/share-rolls/${id}/disable`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      return res.json();
    },
    getPublic: async (token: string) => {
      const res = await fetch(`/api/v1/share/${token}`);
      return res.json();
    },
  },

  contactSheets: {
    generate: async (rollId: string): Promise<{ success: boolean; data: ContactSheetType }> => {
      const res = await fetch("/api/v1/contact-sheets/generate", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ rollId }),
      });
      return res.json();
    },
    get: async (rollId: string): Promise<{ success: boolean; data: ContactSheetType }> => {
      const res = await fetch(`/api/v1/contact-sheets/${rollId}`, {
        headers: getHeaders(),
      });
      return res.json();
    },
  },
};
