"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

type ContactSheetData = {
  id: string;
  imagePath: string;
  generatedAt: string;
  roll: {
    title?: string | null;
    aspectRatio: string;
    status: string;
    filmStock: { name: string; brand: string; iso: number };
    photos: {
      id: string;
      caption?: string | null;
      storagePath: string;
      capturedAt: string;
    }[];
  };
};

export default function ContactSheetPage() {
  const { rollId } = useParams<{ rollId: string }>();
  const router = useRouter();
  const [data, setData] = useState<ContactSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchSheet = async () => {
    const token = localStorage.getItem("visitorToken");
    if (!token) return;

    const res = await fetch(`/api/v1/contact-sheets/${rollId}`, {
      headers: { "x-visitor-token": token },
    });
    const json = await res.json();
    if (json.success) {
      const rollRes = await fetch(`/api/v1/rolls/${rollId}`, {
        headers: { "x-visitor-token": token },
      });
      const rollJson = await rollRes.json();
      setData({ ...json.data, roll: rollJson.data });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSheet();
  }, [rollId]);

  const generateSheet = async () => {
    const token = localStorage.getItem("visitorToken");
    if (!token) return;

    setIsGenerating(true);
    await fetch("/api/v1/contact-sheets/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-visitor-token": token },
      body: JSON.stringify({ rollId }),
    });
    await fetchSheet();
    setIsGenerating(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <button onClick={() => router.push(`/rolls/${rollId}`)} className="mb-4 text-sm text-muted-foreground">
        ← Back to Roll
      </button>

      <h1 className="mb-1 text-xl font-light">Contact Sheet</h1>

      {data?.roll && (
        <p className="mb-6 text-xs text-muted-foreground">
          {data.roll.filmStock.brand} {data.roll.filmStock.name} · {data.roll.photos?.length ?? 0} photos
          {data.roll.title && ` · ${data.roll.title}`}
        </p>
      )}

      {!data ? (
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            Contact sheet not yet generated.
          </p>
          <button
            onClick={generateSheet}
            disabled={isGenerating}
            className="mt-4 rounded-full bg-primary px-6 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate Contact Sheet"}
          </button>
        </div>
      ) : (
        <>
          {data.imagePath && (
            <div className="mb-6 rounded-xl bg-card p-3 text-center">
              <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                {data.imagePath}
              </div>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium">Photos</h2>
            <span className="text-[10px] text-muted-foreground">
              Generated {new Date(data.generatedAt).toLocaleDateString()}
            </span>
          </div>

          {data.roll?.photos && data.roll.photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {data.roll.photos.map((photo, i) => (
                <div key={photo.id} className="aspect-square rounded-lg bg-card overflow-hidden">
                  <div className="flex h-full items-center justify-center bg-muted p-1 text-[8px] text-muted-foreground text-center">
                    {i + 1}
                    {photo.caption && <div className="truncate">{photo.caption}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">No photos in this roll.</p>
          )}
        </>
      )}
    </div>
  );
}
