import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const filmStocks = await prisma.filmStock.findMany({
      where: { isActive: true },
      orderBy: { brand: "asc" },
    });

    return successResponse(
      filmStocks.map((s: { id: string; name: string; brand: string; iso: number; grainStrength: number; contrastLevel: number; saturationLevel: number; fadeAmount: number; temperatureShift: number }) => ({
        id: s.id,
        name: s.name,
        brand: s.brand,
        iso: s.iso,
        grainStrength: s.grainStrength,
        contrastLevel: s.contrastLevel,
        saturationLevel: s.saturationLevel,
        fadeAmount: s.fadeAmount,
        temperatureShift: s.temperatureShift,
      }))
    );
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to fetch film stocks", 500);
  }
}
