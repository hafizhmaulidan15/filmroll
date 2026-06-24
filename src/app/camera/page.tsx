"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { FilmStockType, AspectRatioEnum } from "@/types";

const RATIOS: { value: AspectRatioEnum; label: string }[] = [
  { value: "SQUARE", label: "1:1" },
  { value: "PORTRAIT", label: "3:4" },
  { value: "STORY", label: "9:16" },
];

function getFilter(stock: FilmStockType): string {
  const c = 1 + (stock.contrastLevel - 50) / 60;
  const s = 1 + (stock.saturationLevel - 50) / 60;
  const b = 1 - stock.fadeAmount / 150;
  return `contrast(${c}) saturate(${s}) brightness(${b})`;
}

function applyFilter(ctx: CanvasRenderingContext2D, w: number, h: number, stock: FilmStockType) {
  const d = ctx.getImageData(0, 0, w, h);
  const px = d.data;
  const c = (stock.contrastLevel - 50) / 60;
  const s = (stock.saturationLevel - 50) / 60;
  const f = stock.fadeAmount / 120;
  const g = stock.grainStrength / 80;
  const t = stock.temperatureShift;

  for (let i = 0; i < px.length; i += 4) {
    let r = px[i], g_ = px[i + 1], b = px[i + 2];

    if (c !== 0) { r = 128 + (r - 128) * (1 + c); g_ = 128 + (g_ - 128) * (1 + c); b = 128 + (b - 128) * (1 + c); }
    if (s !== 0) { const gr = 0.299 * r + 0.587 * g_ + 0.114 * b; r = gr + (r - gr) * (1 + s); g_ = gr + (g_ - gr) * (1 + s); b = gr + (b - gr) * (1 + s); }
    if (t !== 0) { r += t; b -= t; }
    if (f > 0) { r += (128 - r) * f; g_ += (128 - g_) * f; b += (128 - b) * f; }
    if (g > 0) { const n = (Math.random() - 0.5) * g * 50; r += n; g_ += n; b += n; }

    px[i] = Math.max(0, Math.min(255, r));
    px[i + 1] = Math.max(0, Math.min(255, g_));
    px[i + 2] = Math.max(0, Math.min(255, b));
  }
  ctx.putImageData(d, 0, 0);
}

export default function CameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [stocks, setStocks] = useState<FilmStockType[]>([]);
  const [stock, setStock] = useState<FilmStockType | null>(null);
  const [ratio, setRatio] = useState<AspectRatioEnum>("PORTRAIT");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [rollId, setRollId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRollId(localStorage.getItem("activeRollId"));
    fetch("/api/v1/film-stocks").then(r => r.json()).then(res => {
      if (res.success && res.data.length) { setStocks(res.data); setStock(res.data[10]); }
    }).catch(() => {});
  }, []);

  const start = async () => {
    stop();
    try {
      setError("");
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: 1280, height: 720 },
        audio: false,
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch (e: any) {
      if (e?.name === "NotAllowedError") setError("Camera blocked. Allow access in browser settings.");
      else if (e?.name === "NotFoundError") setError("No camera found.");
      else setError("Camera unavailable.");
    }
  };

  const stop = () => {
    setReady(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => { start(); return stop; }, [facing]);

  const capture = async () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || !stock || busy) return;
    setBusy(true);
    const ctx = c.getContext("2d");
    if (!ctx) { setBusy(false); return; }
    c.width = v.videoWidth; c.height = v.videoHeight;
    ctx.drawImage(v, 0, 0);
    applyFilter(ctx, c.width, c.height, stock);

    c.toBlob(async (blob) => {
      if (!blob) { setBusy(false); return; }
      const token = localStorage.getItem("visitorToken");
      if (!token) { setBusy(false); return; }

      let rid = localStorage.getItem("activeRollId");
      if (!rid) {
        const r = await fetch("/api/v1/rolls", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-visitor-token": token },
          body: JSON.stringify({ filmStockId: stock.id, aspectRatio: ratio }),
        });
        const d = await r.json();
        if (d.success) { rid = d.data.id as string; localStorage.setItem("activeRollId", rid!); setRollId(rid); }
        else { setBusy(false); return; }
      }

      const fd = new FormData();
      fd.append("image", blob, `photo-${Date.now()}.jpg`);
      fd.append("rollId", rid);
      await fetch("/api/v1/photos/upload", {
        method: "POST", headers: { "x-visitor-token": token }, body: fd,
      });
      setBusy(false);
      router.push(`/rolls/temp/${rid}`);
    }, "image/jpeg", 0.9);
  };

  return (
    <div className="h-dvh bg-black flex flex-col text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0 z-10">
        <button onClick={() => router.push("/")} className="text-xs text-white/50">✕</button>
        <button onClick={() => setOpen(true)} className="bg-white/10 rounded-full px-3 py-1 text-xs">{stock?.name ?? "Film"}</button>
        <div className="flex gap-2">
          {rollId && <button onClick={() => router.push(`/rolls/temp/${rollId}`)} className="bg-white/10 rounded-full px-3 py-1 text-xs">Roll</button>}
          <button onClick={() => setFacing(f => f === "environment" ? "user" : "environment")} className="text-xs text-white/50">⟳</button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="mx-4 mb-1 bg-red-900/60 rounded-xl p-3 text-xs text-red-200 z-10"><p>{error}</p><button onClick={start} className="underline mt-1">Retry</button></div>}

      {/* Viewfinder */}
      <div className="flex-1 flex items-center justify-center px-3 min-h-0">
        <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden bg-black shadow-2xl shadow-black/50">
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: stock && ready ? getFilter(stock) : "none" }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Frame */}
          <div className="absolute inset-0 pointer-events-none border-[5px] border-white/15 rounded-2xl" />
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white/30 rounded-tl" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white/30 rounded-tr" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white/30 rounded-bl" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white/30 rounded-br" />

          {stock && ready && (
            <div className="absolute bottom-2 left-2 right-2 flex justify-between pointer-events-none">
              <span className="bg-black/50 text-[9px] px-2 py-0.5 rounded-full font-mono">{stock.name}</span>
              <span className="bg-black/50 text-[9px] px-2 py-0.5 rounded-full font-mono">ISO {stock.iso}</span>
            </div>
          )}
        </div>
      </div>

      {/* Shutter */}
      <div className="flex items-center justify-center gap-8 py-4 shrink-0 z-10">
        <button onClick={() => router.push("/archive")} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm text-white/40">▥</button>
        <button onClick={capture} disabled={!ready || busy} className="w-16 h-16 rounded-full border-[3px] border-white/30 bg-white/5 active:scale-90 transition-transform disabled:opacity-30 relative">
          {busy && <span className="absolute inset-1 rounded-full border border-white animate-ping" />}
        </button>
        <button onClick={() => rollId ? router.push(`/rolls/temp/${rollId}`) : router.push("/rolls")} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm text-white/40">☰</button>
      </div>

      {/* Ratios */}
      <div className="flex justify-center gap-1 pb-4 shrink-0 z-10">
        {RATIOS.map(r => (
          <button key={r.value} onClick={() => setRatio(r.value)} className={`px-4 py-2 rounded-lg text-xs transition-all ${ratio === r.value ? "bg-primary text-black font-medium" : "bg-white/5 text-white/40"}`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Film picker */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg mx-auto max-h-[60vh] rounded-t-2xl bg-zinc-900 overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-zinc-500 mb-3">{stocks.length} film stocks</p>
            <div className="space-y-1">
              {stocks.map(s => (
                <button key={s.id} onClick={() => { setStock(s); setOpen(false); }} className={`w-full rounded-xl p-3 text-left ${stock?.id === s.id ? "bg-primary/10 border border-primary/30" : "bg-zinc-800/50"}`}>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-zinc-500">{s.brand} ISO {s.iso}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
