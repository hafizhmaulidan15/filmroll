"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faCameraRotate, faImages, faBars, faCircle } from "@fortawesome/free-solid-svg-icons";
import type { FilmStockType, AspectRatioEnum } from "@/types";

type Ratios = Record<AspectRatioEnum, string>;

const RATIOS: { value: AspectRatioEnum; label: string }[] = [
  { value: "SQUARE", label: "1:1" },
  { value: "PORTRAIT", label: "3:4" },
  { value: "STORY", label: "9:16" },
];

function cssFilter(s: FilmStockType): string {
  const c = 0.85 + (s.contrastLevel / 100) * 0.5;
  const sat = 0.5 + (s.saturationLevel / 100) * 1.0;
  const b = 1.0 - s.fadeAmount / 150;
  const hue = s.temperatureShift * 0.8;
  return `contrast(${c}) saturate(${sat}) brightness(${b}) hue-rotate(${hue}deg)`;
}

function applyFX(ctx: CanvasRenderingContext2D, w: number, h: number, s: FilmStockType) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  const cVal = 0.85 + (s.contrastLevel / 100) * 0.5;
  const satVal = 0.5 + (s.saturationLevel / 100) * 1.0;
  const fadeVal = s.fadeAmount / 200;
  const grainVal = (s.grainStrength / 100) * 20;
  const tempVal = s.temperatureShift * 0.6;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];

    r = 128 + (r - 128) * cVal;
    g = 128 + (g - 128) * cVal;
    b = 128 + (b - 128) * cVal;

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * satVal;
    g = gray + (g - gray) * satVal;
    b = gray + (b - gray) * satVal;

    r += tempVal; b -= tempVal;

    r += (128 - r) * fadeVal;
    g += (128 - g) * fadeVal;
    b += (128 - b) * fadeVal;

    const noise = (Math.random() - 0.5) * grainVal;
    r += noise; g += noise; b += noise;

    d[i] = Math.max(0, Math.min(255, Math.round(r)));
    d[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    d[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }

  ctx.putImageData(img, 0, 0);
}

export default function CameraPage() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);

  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [stocks, setStocks] = useState<FilmStockType[]>([]);
  const [stock, setStock] = useState<FilmStockType | null>(null);
  const [ratio, setRatio] = useState<AspectRatioEnum>("PORTRAIT");
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [rollId, setRollId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRollId(localStorage.getItem("activeRollId"));
    fetch("/api/v1/film-stocks").then(r => r.json()).then(res => {
      if (res.success && res.data.length) {
        setStocks(res.data);
        setStock(res.data[10]);
      }
    }).catch(() => {});
  }, []);

  const start = async () => {
    stop();
    setErr("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: 1280, height: 720 },
        audio: false,
      });
      stream.current = s;
      if (video.current) {
        video.current.srcObject = s;
        video.current.onloadedmetadata = () => setReady(true);
      }
    } catch (e: any) {
      if (e?.name === "NotAllowedError") setErr("Camera access denied. Allow in browser settings.");
      else if (e?.name === "NotFoundError") setErr("No camera found.");
      else setErr("Camera unavailable.");
    }
  };

  const stop = () => {
    setReady(false);
    stream.current?.getTracks().forEach(t => t.stop());
    stream.current = null;
  };

  useEffect(() => { start(); return stop; }, [facing]);

  const capture = async () => {
    const v = video.current, c = canvas.current;
    if (!v || !c || !stock || busy) return;
    setBusy(true);
    const ctx = c.getContext("2d");
    if (!ctx) { setBusy(false); return; }
    c.width = v.videoWidth; c.height = v.videoHeight;
    ctx.drawImage(v, 0, 0);
    applyFX(ctx, c.width, c.height, stock);

    c.toBlob(async (blob) => {
      if (!blob) { setBusy(false); return; }
      const token = localStorage.getItem("visitorToken");
      if (!token) { setBusy(false); return; }

      let rid = localStorage.getItem("activeRollId");
      if (!rid) {
        try {
          const r = await fetch("/api/v1/rolls", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-visitor-token": token },
            body: JSON.stringify({ filmStockId: stock.id, aspectRatio: ratio }),
          });
          const d = await r.json();
            if (d.success && d.data.id) {
              const newId = d.data.id as string;
              localStorage.setItem("activeRollId", newId);
              setRollId(newId);
              rid = newId;
            } else { setBusy(false); return; }
        } catch { setBusy(false); return; }
      }

      const fd = new FormData();
      fd.append("image", blob, `p-${Date.now()}.jpg`);
      fd.append("rollId", rid!);
      await fetch("/api/v1/photos/upload", {
        method: "POST",
        headers: { "x-visitor-token": token },
        body: fd,
      });
      setBusy(false);
      router.push(`/rolls/temp/${rid!}`);
    }, "image/jpeg", 0.9);
  };

  return (
    <div className="h-dvh bg-black text-white flex flex-col overflow-hidden">
      {/* Minimal header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0 z-10">
        <button onClick={() => router.push("/")} className="text-xs text-white/40"><FontAwesomeIcon icon={faXmark} size="lg" /></button>
        <div className="flex gap-2 items-center">
          <button onClick={() => setOpen(true)} className="bg-white/10 rounded-full px-3 py-1 text-[10px] font-mono">{stock?.name ?? "Film"}</button>
          {rollId && <button onClick={() => router.push(`/rolls/temp/${rollId}`)} className="bg-white/10 rounded-full px-3 py-1 text-[10px]">Roll</button>}
          <button onClick={() => setFacing(f => f === "environment" ? "user" : "environment")} className="text-xs text-white/40"><FontAwesomeIcon icon={faCameraRotate} /></button>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="mx-4 mb-1 bg-red-900/50 rounded-xl p-3 z-10">
          <p className="text-xs text-red-200">{err}</p>
          <button onClick={start} className="text-xs text-red-300 underline mt-1">Retry</button>
        </div>
      )}

      {/* Viewfinder - pushed up */}
      <div className="flex-1 flex items-start justify-center pt-2 min-h-0 px-2">
        <div className="relative w-full max-w-sm bg-black overflow-hidden shadow-2xl" style={{ aspectRatio: ratio === "SQUARE" ? "1/1" : ratio === "PORTRAIT" ? "3/4" : "9/16", maxHeight: "78vh" }}>
          <video
            ref={video}
            autoPlay playsInline muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: stock && ready ? cssFilter(stock) : "none" }}
          />
          <canvas ref={canvas} className="hidden" />

          {!ready && !err && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Disposable camera frame */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-[4px] border-white/20" />
            <div className="absolute -top-[1px] -left-[1px] w-8 h-8 border-t-[3px] border-l-[3px] border-white/40" />
            <div className="absolute -top-[1px] -right-[1px] w-8 h-8 border-t-[3px] border-r-[3px] border-white/40" />
            <div className="absolute -bottom-[1px] -left-[1px] w-8 h-8 border-b-[3px] border-l-[3px] border-white/40" />
            <div className="absolute -bottom-[1px] -right-[1px] w-8 h-8 border-b-[3px] border-r-[3px] border-white/40" />
          </div>

          {/* Film info pill */}
          {stock && ready && (
            <div className="absolute bottom-2 left-2 right-2 flex justify-between pointer-events-none">
              <span className="bg-black/60 text-[8px] px-2 py-0.5 rounded font-mono tracking-wider">{stock.name.toUpperCase()}</span>
              <span className="bg-black/60 text-[8px] px-2 py-0.5 rounded font-mono">{stock.brand} {stock.iso}</span>
            </div>
          )}
        </div>
      </div>

      {/* Shutter row */}
      <div className="flex items-center justify-center gap-10 py-3 shrink-0 z-10">
        <button onClick={() => router.push("/archive")} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-sm"><FontAwesomeIcon icon={faImages} /></button>
        <button onClick={capture} disabled={!ready || busy} className="w-14 h-14 rounded-full border-[3px] border-white/30 bg-white/5 active:scale-90 transition-transform disabled:opacity-30 relative">
          {busy && <span className="absolute inset-0.5 rounded-full border border-white animate-ping" />}
        </button>
        <button onClick={() => rollId ? router.push(`/rolls/temp/${rollId}`) : router.push("/rolls")} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-sm"><FontAwesomeIcon icon={faBars} /></button>
      </div>

      {/* Ratio bar */}
      <div className="flex justify-center gap-1 pb-3 shrink-0 z-10">
        {RATIOS.map(r => (
          <button key={r.value} onClick={() => setRatio(r.value)}
            className={`px-5 py-2 rounded-lg text-xs transition-all ${ratio === r.value ? "bg-primary text-black font-semibold" : "bg-white/5 text-white/40"}`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Stock picker */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg mx-auto max-h-[55vh] rounded-t-2xl bg-zinc-900 overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-zinc-500 mb-3">{stocks.length} presets</p>
            <div className="space-y-1">
              {stocks.map(s => {
                const isSel = stock?.id === s.id;
                return (
                  <button key={s.id} onClick={() => { setStock(s); setOpen(false); }}
                    className={`w-full rounded-xl p-3 text-left transition-all ${isSel ? "bg-primary/10 border border-primary/30" : "bg-zinc-800/30 hover:bg-zinc-800"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{s.brand} · ISO {s.iso}</div>
                      </div>
                      {isSel && <span className="text-primary text-xs"><FontAwesomeIcon icon={faCircle} /></span>}
                    </div>
                    <div className="flex gap-3 mt-1.5 text-[9px] text-zinc-600">
                      <span>Contrast {s.contrastLevel}</span>
                      <span>Color {s.saturationLevel}</span>
                      <span>Grain {s.grainStrength}</span>
                      <span>Fade {s.fadeAmount}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
