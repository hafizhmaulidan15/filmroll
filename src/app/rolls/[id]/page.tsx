"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { RollType } from "@/types";
import { getFilmCSSFilter } from "@/lib/film-filter";

export default function RollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [roll, setRoll] = useState<RollType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("visitorToken");
    if (!token) { router.push("/"); return; }

    fetch(`/api/v1/rolls/${id}`, {
      headers: { "x-visitor-token": token },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setRoll(res.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [id, router]);

  const createShare = async () => {
    const token = localStorage.getItem("visitorToken");
    if (!token) return;
    setIsCreatingShare(true);
    const res = await fetch("/api/v1/share-rolls", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-visitor-token": token },
      body: JSON.stringify({ rollId: id }),
    });
    const data = await res.json();
    if (data.success) setShareUrl(`${window.location.origin}${data.data.shareUrl}`);
    setIsCreatingShare(false);
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finishRoll = async () => {
    const token = localStorage.getItem("visitorToken");
    if (!token) return;
    setIsFinishing(true);
    await fetch(`/api/v1/rolls/${id}/finish`, {
      method: "PATCH", headers: { "x-visitor-token": token },
    });
    setRoll((prev) => prev ? { ...prev, status: "FINISHED" as const } : null);
    setIsFinishing(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!roll) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Roll not found</p>
          <button onClick={() => router.push("/rolls")} className="mt-2 text-xs text-primary underline">Back to rolls</button>
        </div>
      </div>
    );
  }

  const filmFilter = roll.filmStock ? getFilmCSSFilter(roll.filmStock) : "none";

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => router.push("/rolls")} className="text-sm text-white/70">← Rolls</button>
        <div className="flex gap-2">
          {roll.status === "ACTIVE" && (
            <button onClick={finishRoll} disabled={isFinishing} className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur disabled:opacity-50">
              {isFinishing ? "..." : "Finish"}
            </button>
          )}
          <button onClick={() => setShowShareDialog(true)} className="rounded-full bg-primary/20 px-4 py-1.5 text-xs font-medium text-primary">
            Share
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        <h1 className="text-xl font-light">{roll.title || "Untitled Roll"}</h1>
        <p className="mt-1 text-xs text-zinc-500">
          {roll.filmStock?.name} · {roll.photos?.length ?? 0} photos · {roll.status}
          {roll.status === "ACTIVE" && roll.photos && (
            <> · {roll.photos.filter(p => p.status === "TEMP").length} to review</>
          )}
        </p>
        {roll.status === "ACTIVE" && (
          <button onClick={() => router.push(`/rolls/temp/${roll.id}`)} className="mt-3 rounded-full bg-primary px-6 py-2 text-xs font-medium text-primary-foreground">
            Review Temp Photos
          </button>
        )}
      </div>

      {(!roll.photos || roll.photos.length === 0) ? (
        <div className="mt-10 text-center text-sm text-zinc-500">No photos in this roll yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4">
          {roll.photos.map((photo) => (
            <div key={photo.id} className="aspect-square rounded-xl bg-zinc-800 overflow-hidden">
              <img
                src={`/${photo.storagePath}`}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: filmFilter }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const fb = (e.target as HTMLImageElement).nextElementSibling;
                  if (fb) fb.classList.remove("hidden");
                }}
              />
              <div className="hidden text-[10px] text-zinc-500 flex items-center justify-center w-full h-full bg-zinc-800">
                {photo.caption || "No image"}
              </div>
            </div>
          ))}
        </div>
      )}

      {showShareDialog && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setShowShareDialog(false)}>
          <div className="w-full max-w-lg mx-auto rounded-t-2xl bg-zinc-900 p-6 border-t border-zinc-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-sm font-medium text-white">Share Roll</h3>
            {!shareUrl ? (
              <button onClick={createShare} disabled={isCreatingShare} className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {isCreatingShare ? "Generating..." : "Generate Share Link"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 p-3">
                  <input readOnly value={shareUrl} className="flex-1 bg-transparent text-xs text-zinc-300 outline-none" />
                  <button onClick={copyUrl} className="rounded-full bg-primary px-4 py-1.5 text-[10px] font-medium text-primary-foreground whitespace-nowrap">
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500">Anyone with this link can view your archived photos.</p>
              </div>
            )}
            <button onClick={() => setShowShareDialog(false)} className="mt-4 w-full py-2 text-xs text-zinc-500">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
