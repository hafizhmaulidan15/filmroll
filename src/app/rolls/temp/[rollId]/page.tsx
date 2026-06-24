"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PhotoType, FilmStockType } from "@/types";
import { getFilmCSSFilter } from "@/lib/film-filter";

export default function TempRollPage() {
  const { rollId } = useParams<{ rollId: string }>();
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoType[]>([]);
  const [filmStock, setFilmStock] = useState<FilmStockType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [archiving, setArchiving] = useState<Set<string>>(new Set());

  const fetchPhotos = useCallback(async () => {
    const token = localStorage.getItem("visitorToken");
    if (!token) return [];

    const res = await fetch(`/api/v1/photos?rollId=${rollId}&status=TEMP`, {
      headers: { "x-visitor-token": token },
    });
    const data = await res.json();
    return data.success ? data.data : [];
  }, [rollId]);

  useEffect(() => {
    const token = localStorage.getItem("visitorToken");
    if (!token) { router.push("/"); return; }

    const load = async () => {
      const rollRes = await fetch(`/api/v1/rolls/${rollId}`, {
        headers: { "x-visitor-token": token },
      });
      const rollData = await rollRes.json();
      if (rollData.success && rollData.data.filmStock) {
        setFilmStock(rollData.data.filmStock);
      }
      const p = await fetchPhotos();
      setPhotos(p);
      setIsLoading(false);
    };
    load();
  }, [rollId, router, fetchPhotos]);

  const archivePhoto = async (photoId: string) => {
    setArchiving((prev) => new Set(prev).add(photoId));
    const token = localStorage.getItem("visitorToken");
    await fetch(`/api/v1/photos/${photoId}/archive`, {
      method: "POST", headers: { "x-visitor-token": token! },
    });
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setArchiving((prev) => { const n = new Set(prev); n.delete(photoId); return n; });
  };

  const deletePhoto = async (photoId: string) => {
    const token = localStorage.getItem("visitorToken");
    await fetch(`/api/v1/photos/${photoId}`, {
      method: "DELETE", headers: { "x-visitor-token": token! },
    });
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const archiveAll = async () => {
    for (const photo of photos) {
      setArchiving((prev) => new Set(prev).add(photo.id));
      const token = localStorage.getItem("visitorToken");
      await fetch(`/api/v1/photos/${photo.id}/archive`, {
        method: "POST", headers: { "x-visitor-token": token! },
      });
      setArchiving((prev) => { const n = new Set(prev); n.delete(photo.id); return n; });
    }
    setPhotos([]);
  };

  const filmFilter = filmStock ? getFilmCSSFilter(filmStock) : "none";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => router.push("/camera")} className="text-sm text-white/70">← Back</button>
        <h1 className="text-sm font-medium">Review Roll</h1>
        <div className="w-12" />
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {filmStock?.name ?? "Film"} · {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </p>
          {photos.length > 0 && (
            <button
              onClick={archiveAll}
              className="rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground"
            >
              Save All ({photos.length})
            </button>
          )}
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="mt-20 text-center px-4">
          <div className="mb-3 text-4xl text-zinc-600">○</div>
          <p className="text-sm text-zinc-400">All photos saved or deleted.</p>
          <button
            onClick={() => { localStorage.removeItem("activeRollId"); router.push("/camera"); }}
            className="mt-4 inline-block rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground"
          >
            Start New Roll
          </button>
        </div>
      ) : (
        <div className="space-y-4 px-4 pb-24">
          {photos.map((photo) => (
            <div key={photo.id} className="rounded-2xl bg-zinc-900 overflow-hidden border border-zinc-800">
              <div className="bg-zinc-800 flex items-center justify-center overflow-hidden" style={{ minHeight: 200 }}>
                <img
                  src={`/${photo.storagePath}`}
                  alt=""
                  className="w-full object-cover"
                  style={{ filter: filmFilter }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <div className="hidden text-xs text-zinc-500 p-4">Image not available</div>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-xs text-zinc-500">
                  {new Date(photo.capturedAt).toLocaleTimeString()}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => archivePhoto(photo.id)}
                    disabled={archiving.has(photo.id)}
                    className="rounded-full bg-primary/20 px-5 py-2 text-xs font-medium text-primary disabled:opacity-50"
                  >
                    {archiving.has(photo.id) ? "..." : "Save"}
                  </button>
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="rounded-full bg-red-900/30 px-5 py-2 text-xs font-medium text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
