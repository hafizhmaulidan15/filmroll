"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { FilmStockType, AspectRatioEnum } from "@/types";

const RATIO_OPTIONS: { value: AspectRatioEnum; label: string; icon: string }[] = [
  { value: "SQUARE", label: "1:1", icon: "▣" },
  { value: "PORTRAIT", label: "3:4", icon: "▯" },
  { value: "STORY", label: "9:16", icon: "▮" },
];

const RATIO_STYLES: Record<AspectRatioEnum, string> = {
  SQUARE: "aspect-square",
  PORTRAIT: "aspect-[3/4]",
  STORY: "aspect-[9/16]",
};

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
  const [activeRollId, setActiveRollId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    setActiveRollId(localStorage.getItem("activeRollId"));
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

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      stopCamera();
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
  }, [facing, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facing, startCamera, stopCamera]);

  const toggleFacing = () => setFacing((f) => (f === "environment" ? "user" : "environment"));

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedFilm || isCapturing) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });

      const token = localStorage.getItem("visitorToken");
      if (!token) { setIsCapturing(false); return; }

      let rollId = localStorage.getItem("activeRollId");
      if (!rollId) {
        try {
          const rollRes = await fetch("/api/v1/rolls", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-visitor-token": token },
            body: JSON.stringify({ filmStockId: selectedFilm.id, aspectRatio }),
          });
          const rollData = await rollRes.json();
          if (rollData.success) {
            rollId = rollData.data.id as string;
            localStorage.setItem("activeRollId", rollId);
            setActiveRollId(rollId);
          }
        } catch {
          setIsCapturing(false);
          return;
        }
      }

      if (!rollId) { setIsCapturing(false); return; }

      const formData = new FormData();
      formData.append("image", file);
      formData.append("rollId", rollId);

      await fetch("/api/v1/photos/upload", {
        method: "POST",
        headers: { "x-visitor-token": token },
        body: formData,
      });

      setIsCapturing(false);
      router.push(`/rolls/temp/${rollId}`);
    }, "image/jpeg");
  };

  const filmFilter = selectedFilm
    ? `contrast(${1 + (selectedFilm.contrastLevel - 50) / 100}) saturate(${1 + (selectedFilm.saturationLevel - 50) / 100}) brightness(${1 - selectedFilm.fadeAmount / 200}) sepia(${Math.abs(selectedFilm.temperatureShift) / 100}) hue-rotate(${selectedFilm.temperatureShift}deg)`
    : "none";

  return (
    <div className="relative flex min-h-screen flex-col bg-black text-white">
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <button onClick={() => router.push("/")} className="text-sm text-white/70">
          ← Back
        </button>
        <button onClick={() => setIsPickerOpen(true)} className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium backdrop-blur">
          {selectedFilm?.name ?? "Select Film"}
        </button>
        <div className="flex gap-2">
          {activeRollId && (
            <button onClick={() => router.push(`/rolls/temp/${activeRollId}`)} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur">
              Review
            </button>
          )}
          <button onClick={toggleFacing} className="text-sm text-white/70">Flip</button>
        </div>
      </div>

      {error && (
        <div className="relative z-10 mx-4 mb-2 rounded-lg bg-red-900/80 p-3 text-xs text-red-200">
          {error}
          <button onClick={startCamera} className="ml-2 underline">Retry</button>
        </div>
      )}

      <div className="relative flex-1 flex items-center justify-center mx-3">
        <div className={`relative ${RATIO_STYLES[aspectRatio]} w-full max-h-[75vh] overflow-hidden rounded-2xl bg-black`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${isCameraReady ? "opacity-100" : "opacity-0"}`}
            style={{ filter: isCameraReady ? filmFilter : "none" }}
          />
          <canvas ref={canvasRef} className="hidden" />
          {!isCameraReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/50">
              Starting camera...
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-4 px-4 py-5">
        <button onClick={() => router.push("/archive")} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg backdrop-blur">
          ▥
        </button>
        <button
          onClick={capture}
          disabled={!isCameraReady || isCapturing}
          className="relative h-18 w-18 rounded-full border-[4px] border-white bg-white/10 backdrop-blur transition-transform active:scale-90 disabled:opacity-40"
        >
          {isCapturing && <span className="absolute inset-0 rounded-full bg-white/30 animate-pulse" />}
        </button>
        <button onClick={() => activeRollId ? router.push(`/rolls/temp/${activeRollId}`) : router.push("/rolls")} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg backdrop-blur">
          ☰
        </button>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-3 px-4 pb-6">
        {RATIO_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setAspectRatio(opt.value)}
            className={`flex flex-col items-center gap-1 rounded-2xl px-6 py-3 text-xs font-medium transition-all min-w-[72px] ${
              aspectRatio === opt.value
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                : "bg-white/10 text-white/70 backdrop-blur"
            }`}
          >
            <span className="text-lg">{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setIsPickerOpen(false)}>
          <div className="w-full max-w-lg mx-auto max-h-[70vh] overflow-y-auto rounded-t-2xl bg-zinc-900 p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-sm font-medium text-white">Choose Film Stock</h3>
            <div className="space-y-2">
              {filmStocks.map((stock) => (
                <button
                  key={stock.id}
                  onClick={() => { setSelectedFilm(stock); setIsPickerOpen(false); }}
                  className={`w-full rounded-xl p-4 text-left transition-colors ${
                    selectedFilm?.id === stock.id ? "bg-primary/20 border border-primary" : "bg-zinc-800"
                  }`}
                >
                  <div className="text-sm font-medium text-white">{stock.name}</div>
                  <div className="text-xs text-zinc-400">{stock.brand} · ISO {stock.iso}</div>
                  <div className="mt-1 flex gap-2 text-[10px] text-zinc-500">
                    <span>Grain {stock.grainStrength}%</span>
                    <span>Contrast {stock.contrastLevel}%</span>
                    <span>Fade {stock.fadeAmount}%</span>
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
