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
    filmStock: {
      name: string;
      brand: string;
      iso: number;
    };
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
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error?.message || "Share link not found");
        }
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to load shared roll");
        setIsLoading(false);
      });
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-3 text-4xl text-muted-foreground">◻</div>
          <p className="text-sm text-muted-foreground">
            {error || "This share link is not available."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-light">
          {data.roll.title || "Shared Roll"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {data.roll.filmStock.brand} {data.roll.filmStock.name} · ISO{" "}
          {data.roll.filmStock.iso} · {data.roll.photos.length} photos
        </p>
      </div>

      {data.roll.photos.length === 0 ? (
        <div className="mt-10 text-center text-sm text-muted-foreground">
          No photos in this shared roll.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.roll.photos.map((photo) => (
            <div
              key={photo.id}
              className="aspect-square rounded-xl bg-card overflow-hidden"
            >
              <div className="flex h-full items-center justify-center bg-muted p-2 text-center text-[10px] text-muted-foreground">
                {photo.caption || "Untitled"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
