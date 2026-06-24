"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PhotoType } from "@/types";

export default function ArchiveDetailPage() {
  const { photoId } = useParams<{ photoId: string }>();
  const router = useRouter();
  const [photo, setPhoto] = useState<PhotoType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("visitorToken");
    if (!token) { router.push("/"); return; }

    fetch(`/api/v1/photos/${photoId}`, {
      headers: { "x-visitor-token": token },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setPhoto(res.data);
          setCaption(res.data.caption || "");
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [photoId, router]);

  const saveCaption = async () => {
    const token = localStorage.getItem("visitorToken");
    if (!token || !photo) return;
    setIsSaving(true);
    await fetch(`/api/v1/photos/${photo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-visitor-token": token },
      body: JSON.stringify({ caption }),
    });
    setIsSaving(false);
  };

  const deletePhoto = async () => {
    const token = localStorage.getItem("visitorToken");
    if (!token || !photo) return;
    setIsDeleting(true);
    await fetch(`/api/v1/photos/${photo.id}`, {
      method: "DELETE", headers: { "x-visitor-token": token },
    });
    router.push("/archive");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Photo not found</p>
          <button onClick={() => router.push("/archive")} className="mt-2 text-xs text-primary underline">Back to archive</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => router.push("/archive")} className="text-sm text-white/70">← Archive</button>
        <h1 className="text-sm font-medium">Photo</h1>
        <div className="w-12" />
      </div>

      <div className="bg-zinc-900 mx-3 rounded-2xl overflow-hidden">
        <img
          src={`/${photo.storagePath}`}
          alt={photo.caption || ""}
          className="w-full object-contain max-h-[60vh]"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            const fb = (e.target as HTMLImageElement).nextElementSibling;
            if (fb) fb.classList.remove("hidden");
          }}
        />
        <div className="hidden text-sm text-zinc-500 text-center py-10">Image not available</div>
      </div>

      <div className="px-4 py-3 space-y-1 text-xs text-zinc-500">
        {photo.status && <p>Status: {photo.status}</p>}
        <p>Captured: {new Date(photo.capturedAt).toLocaleString()}</p>
        {photo.archivedAt && <p>Archived: {new Date(photo.archivedAt).toLocaleString()}</p>}
        {photo.width && photo.height && <p>{photo.width} × {photo.height}</p>}
      </div>

      <div className="px-4 py-3">
        <label className="mb-2 block text-xs text-zinc-400">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full rounded-xl bg-zinc-800 border border-zinc-700 p-3 text-sm text-white outline-none focus:border-primary resize-none"
          placeholder="Add a caption..."
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">{caption.length}/500</span>
          <button onClick={saveCaption} disabled={isSaving} className="rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="px-4 pt-2 pb-8">
        <button onClick={deletePhoto} disabled={isDeleting} className="w-full rounded-full border border-red-800 py-3 text-xs font-medium text-red-400 disabled:opacity-50">
          {isDeleting ? "Deleting..." : "Delete Photo"}
        </button>
      </div>
    </div>
  );
}
