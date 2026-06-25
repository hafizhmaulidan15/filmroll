import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const filmStocks = [
  { name: "Fujifilm Velvia 50", brand: "Fujifilm", iso: 50, grainStrength: 5, contrastLevel: 70, saturationLevel: 95, fadeAmount: 3, temperatureShift: -10 },
  { name: "Kodak Portra 400", brand: "Kodak", iso: 400, grainStrength: 20, contrastLevel: 30, saturationLevel: 60, fadeAmount: 8, temperatureShift: 10 },
  { name: "Kodak Tri-X 400", brand: "Kodak", iso: 400, grainStrength: 70, contrastLevel: 85, saturationLevel: 0, fadeAmount: 15, temperatureShift: 0 },
  { name: "Kodak Ektar 100", brand: "Kodak", iso: 100, grainStrength: 8, contrastLevel: 55, saturationLevel: 85, fadeAmount: 3, temperatureShift: 15 },
  { name: "Fujifilm Provia 100F", brand: "Fujifilm", iso: 100, grainStrength: 5, contrastLevel: 50, saturationLevel: 75, fadeAmount: 3, temperatureShift: -5 },
  { name: "Fujifilm Superia 400", brand: "Fujifilm", iso: 400, grainStrength: 30, contrastLevel: 35, saturationLevel: 65, fadeAmount: 10, temperatureShift: -8 },
  { name: "Ilford HP5 Plus", brand: "Ilford", iso: 400, grainStrength: 60, contrastLevel: 70, saturationLevel: 0, fadeAmount: 20, temperatureShift: -5 },
  { name: "Kodak Ektachrome E100", brand: "Kodak", iso: 100, grainStrength: 3, contrastLevel: 60, saturationLevel: 90, fadeAmount: 2, temperatureShift: -5 },
  { name: "Ilford Delta 100", brand: "Ilford", iso: 100, grainStrength: 15, contrastLevel: 75, saturationLevel: 0, fadeAmount: 10, temperatureShift: 0 },
  { name: "Kodak T-MAX 3200", brand: "Kodak", iso: 3200, grainStrength: 90, contrastLevel: 80, saturationLevel: 0, fadeAmount: 22, temperatureShift: -3 },
  { name: "Fujifilm Astia 100F", brand: "Fujifilm", iso: 100, grainStrength: 10, contrastLevel: 35, saturationLevel: 45, fadeAmount: 5, temperatureShift: 0 },
  { name: "Fujifilm Pro 400H", brand: "Fujifilm", iso: 400, grainStrength: 15, contrastLevel: 25, saturationLevel: 50, fadeAmount: 12, temperatureShift: 8 },
  { name: "Kodak Gold 200", brand: "Kodak", iso: 200, grainStrength: 25, contrastLevel: 40, saturationLevel: 75, fadeAmount: 12, temperatureShift: 12 },
  { name: "AgfaPhoto Vista Plus 200", brand: "Agfa", iso: 200, grainStrength: 35, contrastLevel: 45, saturationLevel: 70, fadeAmount: 15, temperatureShift: 8 },
];

async function seed() {
  try {
    const count = await prisma.filmStock.count();
    if (count === filmStocks.length) {
      console.log(`Film stocks already seeded: ${count}`);
      return;
    }
    if (count > 0) {
      await prisma.$executeRawUnsafe(`TRUNCATE "FilmStock" CASCADE`);
      console.log("Reset film stocks");
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
