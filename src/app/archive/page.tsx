"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PhotoType } from "@/types";

export default function ArchivePage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("visitorToken");
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch("/api/v1/photos?status=ARCHIVED", {
      headers: { "x-visitor-token": token },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setPhotos(res.data);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading archive...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="mb-6 text-xl font-light">Archive</h1>

      {photos.length === 0 ? (
        <div className="mt-20 text-center">
          <div className="mb-3 text-4xl text-muted-foreground">▥</div>
          <p className="text-sm text-muted-foreground">
            No archived photos yet.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Capture and save photos to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => router.push(`/archive/${photo.id}`)}
              className="aspect-square rounded-xl bg-card overflow-hidden text-left"
            >
              <div className="flex h-full w-full items-center justify-center bg-muted p-2 text-xs text-muted-foreground">
                {photo.caption || "No caption"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
