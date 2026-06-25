"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faCameraRotate, faImages, faBars, faCircle } from "@fortawesome/free-solid-svg-icons";
import type { FilmStockType, AspectRatioEnum } from "@/types";
import { loadLUT, applyLUT, stockNameToLUTPath, clearLUTCache, type LUT3D } from "@/lib/lut";

const RATIOS: { value: AspectRatioEnum; label: string }[] = [
  { value: "SQUARE", label: "1:1" },
  { value: "PORTRAIT", label: "3:4" },
  { value: "STORY", label: "9:16" },
];

function cssFilter(s: FilmStockType): string {
  const c = 0.9 + (s.contrastLevel / 100) * 0.4;
  const sat = 0.6 + (s.saturationLevel / 100) * 0.8;
  const b = 1.0 - s.fadeAmount / 200;
  const h = s.temperatureShift * 0.6;
  return `contrast(${c}) saturate(${sat}) brightness(${b}) hue-rotate(${h}deg)`;
}

function buildLUT(contrast: number, fade: number): Uint8Array {
  const lut = new Uint8Array(256);
  const c = (contrast - 50) / 50;
  const f = fade / 250;
  for (let i = 0; i < 256; i++) {
    let v = i / 255;
    if (c > 0) {
      v = v < 0.5 ? Math.pow(v * 2, 1 + c * 0.6) / 2 : 1 - Math.pow((1 - v) * 2, 1 + c * 0.6) / 2;
    } else if (c < 0) {
      v = v * (1 + c * 0.4) - c * 0.2;
    }
    v = v * (1 - f) + f;
    lut[i] = Math.max(0, Math.min(255, Math.round(v * 255)));
  }
  return lut;
}

function applyFX(ctx: CanvasRenderingContext2D, w: number, h: number, s: FilmStockType, lut?: LUT3D | null) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const len = d.length;

  const sat = 0.5 + (s.saturationLevel / 100) * 1.0;
  const warm = s.temperatureShift * 0.5;
  const grain = (s.grainStrength / 100) * 15;

  for (let i = 0; i < len; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];

    if (lut) {
      [r, g, b] = applyLUT(lut, r, g, b);
    } else {
      const lut1d = buildLUT(s.contrastLevel, s.fadeAmount);
      r = lut1d[r]; g = lut1d[g]; b = lut1d[b];
    }

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * sat;
    g = gray + (g - gray) * sat;
    b = gray + (b - gray) * sat;
    r += warm * 0.6; g += warm * 0.1; b -= warm * 0.7;
    if (grain > 0) { const n = (Math.random() - 0.5) * grain; r += n; g += n; b += n; }

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
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [stocks, setStocks] = useState<FilmStockType[]>([]);
  const [stock, setStock] = useState<FilmStockType | null>(null);
  const [ratio, setRatio] = useState<AspectRatioEnum>("PORTRAIT");
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [rollId, setRollId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lutRef = useRef<LUT3D | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    setRollId(localStorage.getItem("activeRollId"));
    fetch("/api/v1/film-stocks").then(r => r.json()).then(res => {
      if (res.success && res.data.length) {
        setStocks(res.data);
        setStock(res.data[0]);
        loadLUT(stockNameToLUTPath(res.data[0].name)).then(l => { lutRef.current = l; });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const el = video.current;
    if (!el) return;

    let timeout: ReturnType<typeof setTimeout>;

    const onReady = () => { if (mountedRef.current) { setReady(true); clearTimeout(timeout); } };

    el.addEventListener("playing", onReady);
    el.addEventListener("loadeddata", onReady);
    el.addEventListener("canplay", onReady);

    const startCam = async () => {
      setReady(false);
      setErr("");
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!mountedRef.current) { s.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = s;
        el.srcObject = s;
        timeout = setTimeout(() => {
          if (mountedRef.current && !el.srcObject) setErr("Camera timeout.");
        }, 8000);
      } catch (e: any) {
        if (!mountedRef.current) return;
        if (e?.name === "NotAllowedError") setErr("Camera access denied.");
        else if (e?.name === "NotFoundError" || e?.name === "DevicesNotFoundError") setErr("No camera found.");
        else setErr("Camera unavailable: " + (e?.message || ""));
      }
    };

    startCam();

    return () => {
      clearTimeout(timeout);
      el.removeEventListener("playing", onReady);
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("canplay", onReady);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  const capture = async () => {
    const v = video.current, c = canvas.current;
    if (!v || !c || !stock || busy) return;
    setBusy(true);
    const ctx = c.getContext("2d");
    if (!ctx) { setBusy(false); return; }

    const maxDim = 1200;
    let sw = v.videoWidth || 1280, sh = v.videoHeight || 720;
    if (sw > maxDim || sh > maxDim) {
      const scale = sw > sh ? maxDim / sw : maxDim / sh;
      sw = Math.round(sw * scale);
      sh = Math.round(sh * scale);
    }
    c.width = sw; c.height = sh;
    ctx.drawImage(v, 0, 0, sw, sh);
    applyFX(ctx, sw, sh, stock, lutRef.current);

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
    }, "image/jpeg", 0.6);
  };

  return (
    <div className="h-dvh bg-black text-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0 z-10">
        <button onClick={() => router.push("/")} className="text-xs text-white/40"><FontAwesomeIcon icon={faXmark} size="lg" /></button>
        <div className="flex gap-2 items-center">
          <button onClick={() => setOpen(true)} className="bg-white/10 rounded-full px-3 py-1 text-[10px] font-mono">{stock?.name ?? "Film"}</button>
          {rollId && <button onClick={() => router.push(`/rolls/temp/${rollId}`)} className="bg-white/10 rounded-full px-3 py-1 text-[10px]">Roll</button>}
          <button onClick={() => setFacing(f => f === "environment" ? "user" : "environment")} className="text-xs text-white/40"><FontAwesomeIcon icon={faCameraRotate} /></button>
        </div>
      </div>

      {err && (
        <div className="mx-4 mb-1 bg-red-900/50 rounded-xl p-3 z-10">
          <p className="text-xs text-red-200">{err}</p>
          <button onClick={() => setFacing(f => f)} className="text-xs text-red-300 underline mt-1">Retry</button>
        </div>
      )}

      <div className="flex-1 flex items-start justify-center pt-2 min-h-0 px-2">
        <div className="relative w-full max-w-sm bg-black overflow-hidden shadow-2xl" style={{ aspectRatio: ratio === "SQUARE" ? "1/1" : ratio === "PORTRAIT" ? "3/4" : "9/16", maxHeight: "78vh" }}>
          <video
            ref={video}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: stock && ready ? cssFilter(stock) : "none" }}
          />
          <canvas ref={canvas} className="hidden" />

          {!ready && !err && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-[4px] border-white/20" />
            <div className="absolute -top-[1px] -left-[1px] w-8 h-8 border-t-[3px] border-l-[3px] border-white/40" />
            <div className="absolute -top-[1px] -right-[1px] w-8 h-8 border-t-[3px] border-r-[3px] border-white/40" />
            <div className="absolute -bottom-[1px] -left-[1px] w-8 h-8 border-b-[3px] border-l-[3px] border-white/40" />
            <div className="absolute -bottom-[1px] -right-[1px] w-8 h-8 border-b-[3px] border-r-[3px] border-white/40" />
          </div>

          {stock && ready && (
            <div className="absolute bottom-2 left-2 right-2 flex justify-between pointer-events-none">
              <span className="bg-black/60 text-[8px] px-2 py-0.5 rounded font-mono tracking-wider">{stock.name.toUpperCase()}</span>
              <span className="bg-black/60 text-[8px] px-2 py-0.5 rounded font-mono">{stock.brand} {stock.iso}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-10 py-3 shrink-0 z-10">
        <button onClick={() => router.push("/archive")} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-sm"><FontAwesomeIcon icon={faImages} /></button>
        <button onClick={capture} disabled={!ready || busy} className="w-14 h-14 rounded-full border-[3px] border-white/30 bg-white/5 active:scale-90 transition-transform disabled:opacity-30 relative">
          {busy && <span className="absolute inset-0.5 rounded-full border border-white animate-ping" />}
        </button>
        <button onClick={() => rollId ? router.push(`/rolls/temp/${rollId}`) : router.push("/rolls")} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-sm"><FontAwesomeIcon icon={faBars} /></button>
      </div>

      <div className="flex justify-center gap-1 pb-3 shrink-0 z-10">
        {RATIOS.map(r => (
          <button key={r.value} onClick={() => setRatio(r.value)}
            className={`px-5 py-2 rounded-lg text-xs transition-all ${ratio === r.value ? "bg-primary text-black font-semibold" : "bg-white/5 text-white/40"}`}>
            {r.label}
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg mx-auto max-h-[55vh] rounded-t-2xl bg-zinc-900 overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-zinc-500 mb-3">{stocks.length} presets</p>
            <div className="space-y-1">
              {stocks.map(s => {
                const isSel = stock?.id === s.id;
                return (
                  <button key={s.id} onClick={() => { setStock(s); setOpen(false); loadLUT(stockNameToLUTPath(s.name)).then(l => { lutRef.current = l; }); }}
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
