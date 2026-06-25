import fs from "fs/promises";
import path from "path";

const BASE = "https://raw.githubusercontent.com/YahiaAngelo/Film-Luts/main/luts";
const OUT_DIR = path.join(process.cwd(), "public", "luts");

const lutMap: Record<string, string> = {
  "fujifilm-velvia-50": "colorslide/fuji_velvia_50.cube",
  "kodak-portra-400": "negative_new/kodak_portra_400.cube",
  "kodak-tri-x-400": "bw/kodak_tri-x_400.cube",
  "kodak-ektar-100": "negative_color/kodak_ektar_100.cube",
  "fujifilm-provia-100f": "colorslide/fuji_provia_100f.cube",
  "fujifilm-superia-400": "negative_old/fuji_superia_400.cube",
  "ilford-hp5-plus": "bw/ilford_hp_5_plus_400.cube",
  "ilford-delta-100": "bw/ilford_delta_100.cube",
  "fujifilm-astia-100f": "colorslide/fuji_astia_100f.cube",
  "agfaphoto-vista-plus-200": "negative_color/agfa_vista_200.cube",
  "kodak-t-max-3200": "bw/kodak_t-max_3200.cube",
  "fujifilm-pro-400h": "negative_new/fuji_400h.cube",
  "kodak-gold-200": "negative_color/kodak_elite_color_200.cube",
  "kodak-ektachrome-e100": "colorslide/kodak_e-100_gx_ektachrome_100.cube",
  "lomochrome-purple": "negative_new/lomography_lomochrome_purple.cube",
  "lomochrome-metropolis": "negative_new/lomography_lomochrome_metropolis.cube",
  "lomochrome-turquoise": "negative_new/lomography_lomochrome_turquoise.cube",
  "cinestill-800t": "colorslide/kodak_ektachrome_800t.cube",
  "cinestill-50d": "colorslide/kodak_ektachrome_50d.cube",
  "kodak-aerochrome": "negative_new/kodak_aerochrome_ii.cube",
};

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  let ok = 0, fail = 0;
  for (const [name, src] of Object.entries(lutMap)) {
    const url = `${BASE}/${src}`;
    const out = path.join(OUT_DIR, `${name}.cube`);
    try {
      const res = await fetch(url);
      if (!res.ok) { console.log(`  FAIL ${name} (${res.status})`); fail++; continue; }
      const text = await res.text();
      await fs.writeFile(out, text, "utf-8");
      console.log(`  OK   ${name}.cube`);
      ok++;
    } catch (e: any) {
      console.log(`  FAIL ${name}: ${e?.message || e}`);
      fail++;
    }
  }
  console.log(`\nDone: ${ok} downloaded, ${fail} failed`);
}

main();
