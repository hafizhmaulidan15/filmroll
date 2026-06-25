"use client";

export type LUT3D = {
  size: number;
  data: Float32Array;
};

let lutCache = new Map<string, LUT3D>();

export function parseCubeFile(content: string): LUT3D {
  const lines = content.split("\n");
  let size = 0;
  const values: number[] = [];

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("#") || t.startsWith("TITLE") || t.startsWith("DOMAIN")) continue;
    if (t.startsWith("LUT_3D_SIZE")) {
      size = parseInt(t.split(/\s+/)[1], 10);
      continue;
    }
    const p = t.split(/\s+/).map(Number);
    if (p.length === 3 && !isNaN(p[0])) values.push(p[0], p[1], p[2]);
  }

  const lut: LUT3D = { size, data: new Float32Array(values) };
  return lut;
}

export async function loadLUT(path: string): Promise<LUT3D | null> {
  if (lutCache.has(path)) return lutCache.get(path)!;
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const text = await res.text();
    const lut = parseCubeFile(text);
    lutCache.set(path, lut);
    return lut;
  } catch {
    return null;
  }
}

export function clearLUTCache() {
  lutCache.clear();
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function applyLUT(lut: LUT3D, r: number, g: number, b: number): [number, number, number] {
  const s = lut.size;
  const last = s - 1;

  const rn = clamp(r / 255) * last;
  const gn = clamp(g / 255) * last;
  const bn = clamp(b / 255) * last;

  const ri = Math.floor(rn), gi = Math.floor(gn), bi = Math.floor(bn);
  const rf = rn - ri, gf = gn - gi, bf = bn - bi;
  const ri1 = Math.min(ri + 1, last), gi1 = Math.min(gi + 1, last), bi1 = Math.min(bi + 1, last);

  const idx = (r: number, g: number, b: number) => (r * s * s + g * s + b) * 3;
  const d = lut.data;

  const c000 = idx(ri, gi, bi), c100 = idx(ri1, gi, bi);
  const c010 = idx(ri, gi1, bi), c110 = idx(ri1, gi1, bi);
  const c001 = idx(ri, gi, bi1), c101 = idx(ri1, gi, bi1);
  const c011 = idx(ri, gi1, bi1), c111 = idx(ri1, gi1, bi1);

  const outR = lerp(lerp(lerp(d[c000], d[c100], rf), lerp(d[c010], d[c110], rf), gf), lerp(lerp(d[c001], d[c101], rf), lerp(d[c011], d[c111], rf), gf), bf);
  const outG = lerp(lerp(lerp(d[c000 + 1], d[c100 + 1], rf), lerp(d[c010 + 1], d[c110 + 1], rf), gf), lerp(lerp(d[c001 + 1], d[c101 + 1], rf), lerp(d[c011 + 1], d[c111 + 1], rf), gf), bf);
  const outB = lerp(lerp(lerp(d[c000 + 2], d[c100 + 2], rf), lerp(d[c010 + 2], d[c110 + 2], rf), gf), lerp(lerp(d[c001 + 2], d[c101 + 2], rf), lerp(d[c011 + 2], d[c111 + 2], rf), gf), bf);

  return [outR * 255, outG * 255, outB * 255];
}

export function stockNameToLUTPath(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `/luts/${slug}.cube`;
}
