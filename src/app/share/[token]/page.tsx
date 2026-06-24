"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

type SharedRoll = {
  shareToken: string;
  createdAt: string;
  roll: {
    id: string;
    title?: string | null;
    aspectRatio: string;
    filmStock: { name: string; brand: string; iso: number };
    photos: {
      id: string;
      storagePath: string;
      thumbnailPath?: string | null;
      caption?: string | null;
      width?: number | null;
      height?: number | null;
      capturedAt: string;
    }[];
  };
};

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedRoll | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/v1/share/${token}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(res.error?.message || "Share link not found");
        setIsLoading(false);
      })
      .catch(() => { setError("Failed to load shared roll"); setIsLoading(false); });
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-sm text-zinc-400 animate-pulse">Loading shared roll...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="text-center">
          <div className="mb-4 text-5xl text-zinc-700">◻</div>
          <p className="text-sm text-zinc-400">{error || "This share link is not available."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-12">
      <div className="px-4 py-6 text-center border-b border-zinc-800">
        <h1 className="text-xl font-light">{data.roll.title || "Shared Roll"}</h1>
        <p className="mt-1 text-xs text-zinc-500">
          {data.roll.filmStock.brand} {data.roll.filmStock.name} · ISO {data.roll.filmStock.iso} · {data.roll.photos.length} photos
        </p>
      </div>

      {data.roll.photos.length === 0 ? (
        <div className="mt-16 text-center text-sm text-zinc-500">No photos in this shared roll.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {data.roll.photos.map((photo, i) => (
            <div key={photo.id} className="aspect-square rounded-xl bg-zinc-800 overflow-hidden relative">
              <img
                src={`/${photo.storagePath}`}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const fb = (e.target as HTMLImageElement).nextElementSibling;
                  if (fb) fb.classList.remove("hidden");
                }}
              />
              <div className="hidden text-[10px] text-zinc-500 flex items-center justify-center w-full h-full bg-zinc-800">
                Photo {i + 1}
              </div>
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-[10px] text-white truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
