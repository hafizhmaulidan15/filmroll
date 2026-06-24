import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getVisitorToken } from "@/lib/visitor";

export async function POST(request: Request) {
  try {
    const token = await getVisitorToken();
    if (!token) {
      return errorResponse("UNAUTHORIZED", "Visitor token required", 401);
    }

    const visitor = await prisma.visitor.findUnique({
      where: { visitorToken: token },
    });
    if (!visitor) {
      return errorResponse("UNAUTHORIZED", "Invalid visitor", 401);
    }

    const body = await request.json();
    const { filmStockId, aspectRatio, title } = body;

    if (!filmStockId) {
      return errorResponse("VALIDATION_ERROR", "filmStockId is required");
    }

    const validRatios = ["SQUARE", "PORTRAIT", "STORY"];
    if (!validRatios.includes(aspectRatio)) {
      return errorResponse("VALIDATION_ERROR", "Invalid aspect ratio");
    }

    const filmStock = await prisma.filmStock.findUnique({
      where: { id: filmStockId },
    });
    if (!filmStock) {
      return errorResponse("NOT_FOUND", "Film stock not found", 404);
    }

    const roll = await prisma.roll.create({
      data: {
        visitorId: visitor.id,
        filmStockId,
        aspectRatio,
        title: title || null,
      },
      include: { filmStock: true },
    });

    return successResponse(
      {
        id: roll.id,
        filmStockId: roll.filmStockId,
        aspectRatio: roll.aspectRatio,
        title: roll.title,
        status: roll.status,
        exposureLimit: roll.exposureLimit,
        capturedCount: roll.capturedCount,
        createdAt: roll.createdAt.toISOString(),
        filmStock: {
          id: roll.filmStock.id,
          name: roll.filmStock.name,
          brand: roll.filmStock.brand,
          iso: roll.filmStock.iso,
          grainStrength: roll.filmStock.grainStrength,
          contrastLevel: roll.filmStock.contrastLevel,
          saturationLevel: roll.filmStock.saturationLevel,
          fadeAmount: roll.filmStock.fadeAmount,
          temperatureShift: roll.filmStock.temperatureShift,
        },
      },
      201
    );
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to create roll", 500);
  }
}

export async function GET() {
  try {
    const token = await getVisitorToken();
    if (!token) {
      return errorResponse("UNAUTHORIZED", "Visitor token required", 401);
    }

    const visitor = await prisma.visitor.findUnique({
      where: { visitorToken: token },
    });
    if (!visitor) {
      return errorResponse("UNAUTHORIZED", "Invalid visitor", 401);
    }

    const rolls = await prisma.roll.findMany({
      where: { visitorId: visitor.id, deletedAt: null },
      include: { filmStock: true, _count: { select: { photos: true } } },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(
      rolls.map((r) => ({
        id: r.id,
        title: r.title,
        aspectRatio: r.aspectRatio,
        status: r.status,
        exposureLimit: r.exposureLimit,
        capturedCount: r._count.photos,
        createdAt: r.createdAt.toISOString(),
        filmStock: {
          id: r.filmStock.id,
          name: r.filmStock.name,
          brand: r.filmStock.brand,
          iso: r.filmStock.iso,
        },
      }))
    );
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to fetch rolls", 500);
  }
}
