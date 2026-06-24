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
    if (!token) {
      router.push("/");
      return;
    }

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
      method: "DELETE",
      headers: { "x-visitor-token": token },
    });
    router.push("/archive");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Photo not found</p>
          <button onClick={() => router.push("/archive")} className="mt-2 text-xs text-primary underline">
            Back to archive
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <button onClick={() => router.push("/archive")} className="mb-4 text-sm text-muted-foreground">
        ← Back to Archive
      </button>

      <div className="mb-4 aspect-[3/4] rounded-xl bg-card flex items-center justify-center text-xs text-muted-foreground overflow-hidden">
        <div className="text-center p-4">
          <div className="text-lg mb-1">◻</div>
          <div className="break-all">{photo.storagePath}</div>
        </div>
      </div>

      <div className="mb-4 space-y-1 text-xs text-muted-foreground">
        <p>Status: {photo.status}</p>
        <p>Captured: {new Date(photo.capturedAt).toLocaleString()}</p>
        {photo.archivedAt && <p>Archived: {new Date(photo.archivedAt).toLocaleString()}</p>}
        {photo.width && photo.height && <p>{photo.width} × {photo.height}</p>}
        {photo.mimeType && <p>{photo.mimeType}</p>}
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs text-muted-foreground">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:border-primary resize-none"
          placeholder="Add a caption..."
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{caption.length}/500</span>
          <button
            onClick={saveCaption}
            disabled={isSaving}
            className="rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <button
          onClick={deletePhoto}
          disabled={isDeleting}
          className="w-full rounded-full border border-destructive/30 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete Photo"}
        </button>
      </div>
    </div>
  );
}
