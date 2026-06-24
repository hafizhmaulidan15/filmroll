"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { FilmStockType, AspectRatioEnum } from "@/types";

const RATIO_OPTIONS: { value: AspectRatioEnum; label: string }[] = [
  { value: "SQUARE", label: "1:1" },
  { value: "PORTRAIT", label: "3:4" },
  { value: "STORY", label: "9:16" },
];

export default function CameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [filmStocks, setFilmStocks] = useState<FilmStockType[]>([]);
  const [selectedFilm, setSelectedFilm] = useState<FilmStockType | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioEnum>("PORTRAIT");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    fetch("/api/v1/film-stocks")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setFilmStocks(res.data);
          setSelectedFilm(res.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setIsCameraReady(true);
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, [facing, stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  const toggleFacing = () => {
    setFacing((f) => (f === "environment" ? "user" : "environment"));
  };

  const [justCaptured, setJustCaptured] = useState(false);

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedFilm) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      let rollId = localStorage.getItem("activeRollId");
      if (!rollId) {
        try {
          const token = localStorage.getItem("visitorToken");
          if (!token) return;

          const rollRes = await fetch("/api/v1/rolls", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-visitor-token": token,
            },
            body: JSON.stringify({
              filmStockId: selectedFilm.id,
              aspectRatio,
            }),
          });
          const rollData = await rollRes.json();
          if (rollData.success) {
            rollId = rollData.data.id;
            localStorage.setItem("activeRollId", rollId!);
          }
        } catch {
          return;
        }
      }

      const token = localStorage.getItem("visitorToken");
      if (!token || !rollId) return;

      const formData = new FormData();
      formData.append("image", file);
      formData.append("rollId", rollId);

      await fetch("/api/v1/photos/upload", {
        method: "POST",
        headers: { "x-visitor-token": token },
        body: formData,
      });

      setJustCaptured(true);
      setTimeout(() => setJustCaptured(false), 1500);
    }, "image/jpeg");
  };

  const [activeRollId, setActiveRollId] = useState<string | null>(null);

  useEffect(() => {
    setActiveRollId(localStorage.getItem("activeRollId"));
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-muted-foreground"
        >
          ← Back
        </button>

        <button
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className="rounded-full bg-card px-3 py-1 text-xs font-medium"
        >
          {selectedFilm?.name ?? "Select Film"}
        </button>

        <div className="flex gap-2">
          {activeRollId && (
            <button
              onClick={() => router.push(`/rolls/temp/${activeRollId}`)}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              Review
            </button>
          )}
          <button onClick={toggleFacing} className="text-sm text-muted-foreground">
            Flip
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
          {error}
          <button onClick={startCamera} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden mx-4 rounded-xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            !isCameraReady ? "opacity-0" : "opacity-100"
          }`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {!isCameraReady && !error && (
          <div className="absolute text-white text-sm">Starting camera...</div>
        )}

        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/rolls")}
              className="h-10 w-10 rounded-full bg-white/20 text-white text-xs backdrop-blur"
            >
              ☰
            </button>
            <button
              onClick={capture}
              disabled={!isCameraReady}
              className={`relative h-16 w-16 rounded-full border-4 border-white backdrop-blur transition-transform active:scale-95 disabled:opacity-50 ${justCaptured ? "bg-primary scale-110" : "bg-white/10"}`}
            >
              {justCaptured && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-ping" />
              )}
            </button>
            <button
              onClick={() => router.push("/archive")}
              className="h-10 w-10 rounded-full bg-white/20 text-white text-xs backdrop-blur"
            >
              ▥
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 px-4 py-4">
        {RATIO_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setAspectRatio(opt.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              aspectRatio === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setIsPickerOpen(false)}>
          <div
            className="w-full max-w-lg mx-auto max-h-96 overflow-y-auto rounded-t-2xl bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-sm font-medium">Choose Film Stock</h3>
            <div className="space-y-2">
              {filmStocks.map((stock) => (
                <button
                  key={stock.id}
                  onClick={() => {
                    setSelectedFilm(stock);
                    setIsPickerOpen(false);
                  }}
                  className={`w-full rounded-xl p-3 text-left transition-colors ${
                    selectedFilm?.id === stock.id
                      ? "bg-primary/10 border border-primary"
                      : "bg-card"
                  }`}
                >
                  <div className="text-sm font-medium">{stock.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {stock.brand} · ISO {stock.iso}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
