"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PhotoType, RollType } from "@/types";

export default function TempRollPage() {
  const { rollId } = useParams<{ rollId: string }>();
  const router = useRouter();
  const [roll, setRoll] = useState<RollType | null>(null);
  const [photos, setPhotos] = useState<PhotoType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [archiving, setArchiving] = useState<Set<string>>(new Set());

  const fetchPhotos = useCallback(async () => {
    const token = localStorage.getItem("visitorToken");
    if (!token) return;

    const res = await fetch(`/api/v1/photos?rollId=${rollId}&status=TEMP`, {
      headers: { "x-visitor-token": token },
    });
    const data = await res.json();
    if (data.success) {
      setPhotos(data.data);
    }
  }, [rollId]);

  useEffect(() => {
    const token = localStorage.getItem("visitorToken");
    if (!token) {
      router.push("/");
      return;
    }

    const load = async () => {
      const rollRes = await fetch(`/api/v1/rolls/${rollId}`, {
        headers: { "x-visitor-token": token },
      });
      const rollData = await rollRes.json();
      if (rollData.success) {
        setRoll(rollData.data);
      }
      await fetchPhotos();
      setIsLoading(false);
    };
    load();
  }, [rollId, router, fetchPhotos]);

  const archivePhoto = async (photoId: string) => {
    setArchiving((prev) => new Set(prev).add(photoId));
    const token = localStorage.getItem("visitorToken");

    await fetch(`/api/v1/photos/${photoId}/archive`, {
      method: "POST",
      headers: { "x-visitor-token": token! },
    });

    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setArchiving((prev) => {
      const next = new Set(prev);
      next.delete(photoId);
      return next;
    });
  };

  const deletePhoto = async (photoId: string) => {
    const token = localStorage.getItem("visitorToken");

    await fetch(`/api/v1/photos/${photoId}`, {
      method: "DELETE",
      headers: { "x-visitor-token": token! },
    });

    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const archiveAll = async () => {
    for (const photo of photos) {
      await archivePhoto(photo.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!roll) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Roll not found</p>
          <button onClick={() => router.push("/camera")} className="mt-2 text-xs text-primary underline">
            Back to camera
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <button onClick={() => router.push("/camera")} className="mb-3 text-sm text-muted-foreground">
          ← Back to Camera
        </button>
        <h1 className="text-xl font-light">Review Roll</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {roll.filmStock?.name ?? "Unknown Film"} · {photos.length} photos remaining
        </p>
      </div>

      {photos.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="mb-3 text-4xl text-muted-foreground">○</div>
          <p className="text-sm text-muted-foreground">No photos to review.</p>
          <p className="mt-1 text-xs text-muted-foreground">All photos have been archived or deleted.</p>
          <button
            onClick={() => {
              localStorage.removeItem("activeRollId");
              router.push("/camera");
            }}
            className="mt-4 inline-block rounded-full bg-primary px-6 py-2 text-xs font-medium text-primary-foreground"
          >
            Start New Roll
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            <button
              onClick={archiveAll}
              className="flex-1 rounded-full bg-primary py-2 text-xs font-medium text-primary-foreground"
            >
              Archive All ({photos.length})
            </button>
          </div>

          <div className="space-y-4">
            {photos.map((photo) => (
              <div key={photo.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="aspect-[3/4] bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  {photo.storagePath}
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(photo.capturedAt).toLocaleTimeString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => archivePhoto(photo.id)}
                      disabled={archiving.has(photo.id)}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary disabled:opacity-50"
                    >
                      {archiving.has(photo.id) ? "..." : "Save"}
                    </button>
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
