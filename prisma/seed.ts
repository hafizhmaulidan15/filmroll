import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const filmStocks = [
  { name: "Kodak Gold 200", brand: "Kodak", iso: 200, grainStrength: 20, contrastLevel: 40, saturationLevel: 70, fadeAmount: 10, temperatureShift: 5 },
  { name: "Kodak Portra 400", brand: "Kodak", iso: 400, grainStrength: 25, contrastLevel: 35, saturationLevel: 60, fadeAmount: 5, temperatureShift: 0 },
  { name: "Kodak Tri-X 400", brand: "Kodak", iso: 400, grainStrength: 60, contrastLevel: 70, saturationLevel: 10, fadeAmount: 15, temperatureShift: -5 },
  { name: "Kodak Ektar 100", brand: "Kodak", iso: 100, grainStrength: 10, contrastLevel: 50, saturationLevel: 80, fadeAmount: 5, temperatureShift: 10 },
  { name: "Kodak Ultramax 400", brand: "Kodak", iso: 400, grainStrength: 30, contrastLevel: 45, saturationLevel: 65, fadeAmount: 8, temperatureShift: 3 },
  { name: "Fujifilm Superia X-TRA 400", brand: "Fujifilm", iso: 400, grainStrength: 25, contrastLevel: 40, saturationLevel: 65, fadeAmount: 10, temperatureShift: -3 },
  { name: "Fujifilm Pro 400H", brand: "Fujifilm", iso: 400, grainStrength: 20, contrastLevel: 35, saturationLevel: 55, fadeAmount: 8, temperatureShift: -5 },
  { name: "Fujifilm Velvia 50", brand: "Fujifilm", iso: 50, grainStrength: 5, contrastLevel: 65, saturationLevel: 90, fadeAmount: 3, temperatureShift: -2 },
  { name: "Fujifilm Neopan 100 Acros", brand: "Fujifilm", iso: 100, grainStrength: 15, contrastLevel: 55, saturationLevel: 5, fadeAmount: 10, temperatureShift: -5 },
  { name: "Ilford HP5 Plus", brand: "Ilford", iso: 400, grainStrength: 55, contrastLevel: 65, saturationLevel: 5, fadeAmount: 20, temperatureShift: -10 },
  { name: "Ilford Delta 100", brand: "Ilford", iso: 100, grainStrength: 20, contrastLevel: 55, saturationLevel: 5, fadeAmount: 15, temperatureShift: -8 },
  { name: "Ilford XP2 Super", brand: "Ilford", iso: 400, grainStrength: 35, contrastLevel: 50, saturationLevel: 5, fadeAmount: 15, temperatureShift: -5 },
  { name: "AgfaPhoto Vista Plus 200", brand: "Agfa", iso: 200, grainStrength: 30, contrastLevel: 45, saturationLevel: 60, fadeAmount: 12, temperatureShift: 0 },
  { name: "AgfaPhoto APX 400", brand: "Agfa", iso: 400, grainStrength: 50, contrastLevel: 60, saturationLevel: 5, fadeAmount: 18, temperatureShift: -8 },
  { name: "Lomography Color Negative 400", brand: "Lomography", iso: 400, grainStrength: 40, contrastLevel: 50, saturationLevel: 75, fadeAmount: 20, temperatureShift: 8 },
  { name: "Lomography Lomochrome Purple", brand: "Lomography", iso: 400, grainStrength: 45, contrastLevel: 55, saturationLevel: 85, fadeAmount: 25, temperatureShift: 15 },
  { name: "Lomography Lomochrome Metropolis", brand: "Lomography", iso: 400, grainStrength: 40, contrastLevel: 60, saturationLevel: 30, fadeAmount: 20, temperatureShift: -10 },
  { name: "Lomography Lomochrome Turquoise", brand: "Lomography", iso: 400, grainStrength: 45, contrastLevel: 55, saturationLevel: 80, fadeAmount: 25, temperatureShift: -15 },
  { name: "CineStill 800T", brand: "CineStill", iso: 800, grainStrength: 35, contrastLevel: 55, saturationLevel: 65, fadeAmount: 15, temperatureShift: -10 },
  { name: "CineStill 50D", brand: "CineStill", iso: 50, grainStrength: 10, contrastLevel: 50, saturationLevel: 70, fadeAmount: 8, temperatureShift: 0 },
  { name: "Bergger Pancro 400", brand: "Bergger", iso: 400, grainStrength: 45, contrastLevel: 60, saturationLevel: 5, fadeAmount: 15, temperatureShift: -5 },
  { name: "Rollei Retro 400S", brand: "Rollei", iso: 400, grainStrength: 40, contrastLevel: 55, saturationLevel: 5, fadeAmount: 12, temperatureShift: -8 },
  { name: "Rollei Infrared 400", brand: "Rollei", iso: 400, grainStrength: 50, contrastLevel: 70, saturationLevel: 5, fadeAmount: 20, temperatureShift: -10 },
  { name: "Washi Film S 50", brand: "Washi", iso: 50, grainStrength: 15, contrastLevel: 50, saturationLevel: 60, fadeAmount: 10, temperatureShift: 5 },
  { name: "Kodak T-MAX 100", brand: "Kodak", iso: 100, grainStrength: 10, contrastLevel: 60, saturationLevel: 5, fadeAmount: 10, temperatureShift: -5 },
  { name: "Kodak T-MAX 400", brand: "Kodak", iso: 400, grainStrength: 30, contrastLevel: 65, saturationLevel: 5, fadeAmount: 12, temperatureShift: -5 },
  { name: "Kodak Ektachrome E100", brand: "Kodak", iso: 100, grainStrength: 5, contrastLevel: 55, saturationLevel: 85, fadeAmount: 3, temperatureShift: 0 },
  { name: "Fujifilm Provia 100F", brand: "Fujifilm", iso: 100, grainStrength: 5, contrastLevel: 50, saturationLevel: 75, fadeAmount: 3, temperatureShift: 0 },
  { name: "Fujifilm Astia 100F", brand: "Fujifilm", iso: 100, grainStrength: 8, contrastLevel: 40, saturationLevel: 55, fadeAmount: 5, temperatureShift: 0 },
  { name: "Fujifilm Sensia 100", brand: "Fujifilm", iso: 100, grainStrength: 10, contrastLevel: 45, saturationLevel: 70, fadeAmount: 5, temperatureShift: 0 },
  { name: "Fujicolor C200", brand: "Fujifilm", iso: 200, grainStrength: 25, contrastLevel: 40, saturationLevel: 60, fadeAmount: 10, temperatureShift: -2 },
  { name: "Fujicolor 100", brand: "Fujifilm", iso: 100, grainStrength: 20, contrastLevel: 38, saturationLevel: 58, fadeAmount: 8, temperatureShift: -2 },
  { name: "Kodak ColorPlus 200", brand: "Kodak", iso: 200, grainStrength: 30, contrastLevel: 42, saturationLevel: 62, fadeAmount: 10, temperatureShift: 3 },
  { name: "Kodak Professional Ektachrome E100VS", brand: "Kodak", iso: 100, grainStrength: 5, contrastLevel: 60, saturationLevel: 90, fadeAmount: 3, temperatureShift: 5 },
  { name: "ADOX CHS 100 II", brand: "ADOX", iso: 100, grainStrength: 25, contrastLevel: 50, saturationLevel: 5, fadeAmount: 15, temperatureShift: -5 },
  { name: "ADOX CMS 20 II", brand: "ADOX", iso: 20, grainStrength: 5, contrastLevel: 70, saturationLevel: 5, fadeAmount: 10, temperatureShift: -5 },
  { name: "ADOX SCALA 50", brand: "ADOX", iso: 50, grainStrength: 15, contrastLevel: 60, saturationLevel: 5, fadeAmount: 12, temperatureShift: -3 },
  { name: "Foma Fomapan 100", brand: "Foma", iso: 100, grainStrength: 35, contrastLevel: 50, saturationLevel: 5, fadeAmount: 18, temperatureShift: -8 },
  { name: "Foma Fomapan 200", brand: "Foma", iso: 200, grainStrength: 40, contrastLevel: 55, saturationLevel: 5, fadeAmount: 20, temperatureShift: -8 },
  { name: "Foma Fomapan 400", brand: "Foma", iso: 400, grainStrength: 50, contrastLevel: 60, saturationLevel: 5, fadeAmount: 22, temperatureShift: -10 },
  { name: "Kentmere 100", brand: "Kentmere", iso: 100, grainStrength: 30, contrastLevel: 50, saturationLevel: 5, fadeAmount: 15, temperatureShift: -5 },
  { name: "Kentmere 400", brand: "Kentmere", iso: 400, grainStrength: 45, contrastLevel: 60, saturationLevel: 5, fadeAmount: 18, temperatureShift: -8 },
  { name: "Shanghai GP3 100", brand: "Shanghai", iso: 100, grainStrength: 40, contrastLevel: 50, saturationLevel: 5, fadeAmount: 20, temperatureShift: -5 },
  { name: "Shanghai GP3 400", brand: "Shanghai", iso: 400, grainStrength: 55, contrastLevel: 60, saturationLevel: 5, fadeAmount: 25, temperatureShift: -8 },
  { name: "Maco IR 820c", brand: "Maco", iso: 100, grainStrength: 35, contrastLevel: 65, saturationLevel: 5, fadeAmount: 25, temperatureShift: -10 },
  { name: "ORWO UN54", brand: "ORWO", iso: 100, grainStrength: 30, contrastLevel: 50, saturationLevel: 5, fadeAmount: 18, temperatureShift: -5 },
  { name: "ORWO N74", brand: "ORWO", iso: 400, grainStrength: 50, contrastLevel: 60, saturationLevel: 5, fadeAmount: 22, temperatureShift: -8 },
  { name: "Kodak Aerochrome II", brand: "Kodak", iso: 400, grainStrength: 40, contrastLevel: 60, saturationLevel: 90, fadeAmount: 20, temperatureShift: 20 },
  { name: "Lomography Earl Grey B&W 100", brand: "Lomography", iso: 100, grainStrength: 30, contrastLevel: 55, saturationLevel: 5, fadeAmount: 15, temperatureShift: -5 },
  { name: "Lomography Lady Grey B&W 400", brand: "Lomography", iso: 400, grainStrength: 45, contrastLevel: 60, saturationLevel: 5, fadeAmount: 20, temperatureShift: -8 },
];

async function seed() {
  try {
    const count = await prisma.filmStock.count();
    if (count > 0) {
      console.log(`Film stocks already seeded: ${count}`);
      return;
    }
    for (const stock of filmStocks) {
      await prisma.filmStock.create({ data: stock });
    }
    console.log(`Seeded ${filmStocks.length} film stocks`);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
