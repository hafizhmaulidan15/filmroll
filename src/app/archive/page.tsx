"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImages } from "@fortawesome/free-solid-svg-icons";
import type { PhotoType } from "@/types";

export default function ArchivePage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<(PhotoType & { filmStockName?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("visitorToken");
    if (!token) { setIsLoading(false); return; }

    fetch("/api/v1/photos?status=ARCHIVED", {
      headers: { "x-visitor-token": token },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPhotos(res.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Loading archive...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="mb-6 text-xl font-light">Archive</h1>

      {photos.length === 0 ? (
        <div className="mt-20 text-center">
          <div className="mb-3 text-4xl text-muted-foreground"><FontAwesomeIcon icon={faImages} /></div>
          <p className="text-sm text-muted-foreground">No archived photos yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Capture and save photos to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => router.push(`/archive/${photo.id}`)}
              className="aspect-square rounded-xl bg-zinc-800 overflow-hidden relative group"
            >
              <img
                src={`/${photo.storagePath}`}
                alt={photo.caption || ""}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const fallback = (e.target as HTMLImageElement).nextElementSibling;
                  if (fallback) fallback.classList.remove("hidden");
                }}
              />
              <div className="hidden text-xs text-zinc-500 flex items-center justify-center w-full h-full bg-zinc-800">
                No image
              </div>
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-[10px] text-white truncate">{photo.caption}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
