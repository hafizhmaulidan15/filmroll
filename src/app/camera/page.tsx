"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { FilmStockType, AspectRatioEnum } from "@/types";

const RATIO_OPTIONS: { value: AspectRatioEnum; label: string }[] = [
  { value: "SQUARE", label: "1:1" },
  { value: "PORTRAIT", label: "3:4" },
  { value: "STORY", label: "9:16" },
];

const RATIO_STYLES: Record<AspectRatioEnum, string> = {
  SQUARE: "aspect-square max-w-[80vw]",
  PORTRAIT: "aspect-[3/4] max-w-[70vw]",
  STORY: "aspect-[9/16] max-w-[50vw]",
};

function applyFilmFilter(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stock: FilmStockType
) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const contrast = (stock.contrastLevel - 50) / 50;
  const saturate = (stock.saturationLevel - 50) / 50;
  const fade = stock.fadeAmount / 100;
  const tempShift = stock.temperatureShift;
  const grain = stock.grainStrength / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Contrast
    if (contrast !== 0) {
      r = 128 + (r - 128) * (1 + contrast);
      g = 128 + (g - 128) * (1 + contrast);
      b = 128 + (b - 128) * (1 + contrast);
    }

    // Saturation
    if (saturate !== 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * (1 + saturate);
      g = gray + (g - gray) * (1 + saturate);
      b = gray + (b - gray) * (1 + saturate);
    }

    // Temperature shift
    if (tempShift !== 0) {
      r += tempShift * 1.5;
      b -= tempShift * 1.5;
    }

    // Fade (reduce contrast towards gray)
    if (fade > 0) {
      r = r + (128 - r) * fade * 0.5;
      g = g + (128 - g) * fade * 0.5;
      b = b + (128 - b) * fade * 0.5;
    }

    // Grain
    if (grain > 0) {
      const noise = (Math.random() - 0.5) * grain * 60;
      r += noise;
      g += noise;
      b += noise;
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imageData, 0, 0);
}

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
  const [captureFlash, setCaptureFlash] = useState(false);

  useEffect(() => {
    setActiveRollId(localStorage.getItem("activeRollId"));
    fetch("/api/v1/film-stocks")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setFilmStocks(res.data);
          setSelectedFilm(res.data[Math.floor(res.data.length / 2)]);
        }
      })
      .catch(() => {});
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setIsCameraReady(false);
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      stopCamera();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setIsCameraReady(true);
    } catch (err) {
      const msg = (err as Error).message || "";
      if (msg.includes("NotAllowed") || msg.includes("Permission")) {
        setError("Camera permission denied. Allow camera access in your browser settings.");
      } else if (msg.includes("NotFound")) {
        setError("No camera found on this device.");
      } else {
        setError("Could not start camera. Try using a different device.");
      }
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
    setCaptureFlash(true);
    setTimeout(() => setCaptureFlash(false), 300);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setIsCapturing(false); return; }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    applyFilmFilter(ctx, canvas.width, canvas.height, selectedFilm);

    canvas.toBlob(async (blob) => {
      if (!blob) { setIsCapturing(false); return; }

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
          if (rollData.success && rollData.data.id) {
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
      formData.append("image", blob, `capture-${Date.now()}.jpg`);
      formData.append("rollId", rollId);

      await fetch("/api/v1/photos/upload", {
        method: "POST",
        headers: { "x-visitor-token": token },
        body: formData,
      });

      setIsCapturing(false);
      router.push(`/rolls/temp/${rollId}`);
    }, "image/jpeg", 0.92);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-950 text-white">
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3">
        <button onClick={() => router.push("/")} className="text-sm text-white/60">← Back</button>
        <button
          onClick={() => setIsPickerOpen(true)}
          className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur border border-white/10"
        >
          {selectedFilm?.name ?? "Select Film"}
        </button>
        <div className="flex gap-2">
          {activeRollId && (
            <button
              onClick={() => router.push(`/rolls/temp/${activeRollId}`)}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur"
            >
              Review
            </button>
          )}
          <button onClick={toggleFacing} className="text-sm text-white/60">⟳</button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="relative z-20 mx-4 mb-2 rounded-xl bg-red-900/60 p-4 text-xs text-red-200 backdrop-blur">
          <p>{error}</p>
          <button onClick={startCamera} className="mt-2 underline">Try again</button>
        </div>
      )}

      {/* Camera viewfinder */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4">
        <div className={`relative ${RATIO_STYLES[aspectRatio]} w-full overflow-hidden`}>
          {/* Disposable camera frame */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute inset-0 border-[6px] border-white/20 rounded-2xl" />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/40 rounded-tl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/40 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/40 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/40 rounded-br" />

            {/* Film stock info overlay */}
            {selectedFilm && isCameraReady && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="bg-black/50 backdrop-blur rounded-full px-3 py-1">
                  <span className="text-[10px] text-white/80 font-mono">{selectedFilm.name}</span>
                </div>
                <div className="bg-black/50 backdrop-blur rounded-full px-3 py-1">
                  <span className="text-[10px] text-white/80 font-mono">ISO {selectedFilm.iso}</span>
                </div>
              </div>
            )}
          </div>

          {/* Video */}
          <div className="w-full h-full bg-black rounded-2xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraReady ? "opacity-100" : "opacity-0"}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {!isCameraReady && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-white/40">Starting camera...</p>
                </div>
              </div>
            )}
          </div>

          {/* Capture flash */}
          {captureFlash && (
            <div className="absolute inset-0 bg-white z-20 animate-ping rounded-2xl" />
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="relative z-20 flex items-center justify-center gap-6 px-4 py-5">
        <button
          onClick={() => activeRollId ? router.push(`/rolls/temp/${activeRollId}`) : router.push("/rolls")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/60 backdrop-blur border border-white/10"
        >
          ▣
        </button>

        <button
          onClick={capture}
          disabled={!isCameraReady || isCapturing}
          className="relative h-20 w-20 rounded-full bg-white/5 border-[4px] border-white/40 backdrop-blur transition-transform active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isCapturing && (
            <span className="absolute inset-0 rounded-full border-2 border-white animate-ping" />
          )}
        </button>

        <button
          onClick={() => router.push("/archive")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/60 backdrop-blur border border-white/10"
        >
          ▥
        </button>
      </div>

      {/* Aspect ratio selector */}
      <div className="relative z-20 flex items-center justify-center gap-2 px-4 pb-6">
        {RATIO_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setAspectRatio(opt.value)}
            className={`px-6 py-2.5 rounded-xl text-xs font-medium transition-all min-w-[70px] ${
              aspectRatio === opt.value
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                : "bg-white/5 text-white/50 border border-white/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Film picker modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setIsPickerOpen(false)}>
          <div
            className="w-full max-w-lg mx-auto max-h-[65vh] overflow-y-auto rounded-t-2xl bg-zinc-900 p-4 border-t border-zinc-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-sm font-medium text-white">Choose Film Stock</h3>
            <p className="mb-4 text-[10px] text-zinc-500">{filmStocks.length} presets available</p>
            <div className="space-y-2">
              {filmStocks.map((stock) => (
                <button
                  key={stock.id}
                  onClick={() => { setSelectedFilm(stock); setIsPickerOpen(false); }}
                  className={`w-full rounded-xl p-4 text-left transition-all ${
                    selectedFilm?.id === stock.id
                      ? "bg-primary/15 border border-primary/50 shadow-lg shadow-primary/5"
                      : "bg-zinc-800/50 border border-transparent hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{stock.name}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{stock.brand} · ISO {stock.iso}</div>
                    </div>
                    {selectedFilm?.id === stock.id && (
                      <span className="text-primary text-lg">●</span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-3 text-[10px] text-zinc-500">
                    <span className={`${stock.contrastLevel > 60 ? "text-zinc-300" : ""}`}>
                      Contrast {(stock.contrastLevel / 10).toFixed(0)}/10
                    </span>
                    <span className={`${stock.saturationLevel > 60 ? "text-zinc-300" : ""}`}>
                      Color {(stock.saturationLevel / 10).toFixed(0)}/10
                    </span>
                    <span className={`${stock.grainStrength > 40 ? "text-zinc-300" : ""}`}>
                      Grain {(stock.grainStrength / 10).toFixed(0)}/10
                    </span>
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
