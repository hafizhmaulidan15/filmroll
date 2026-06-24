import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getVisitorToken } from "@/lib/visitor";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ rollId: string }> }
) {
  try {
    const { rollId } = await params;
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

    const roll = await prisma.roll.findFirst({
      where: { id: rollId, visitorId: visitor.id, deletedAt: null },
      include: {
        filmStock: true,
        photos: { orderBy: { capturedAt: "asc" } },
      },
    });

    if (!roll) {
      return errorResponse("ROLL_NOT_FOUND", "Roll not found", 404);
    }

    return successResponse({
      id: roll.id,
      title: roll.title,
      aspectRatio: roll.aspectRatio,
      status: roll.status,
      exposureLimit: roll.exposureLimit,
      capturedCount: roll.capturedCount,
      createdAt: roll.createdAt.toISOString(),
      updatedAt: roll.updatedAt.toISOString(),
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
      photos: roll.photos.map((p) => ({
        id: p.id,
        status: p.status,
        storagePath: p.storagePath,
        thumbnailPath: p.thumbnailPath,
        caption: p.caption,
        width: p.width,
        height: p.height,
        mimeType: p.mimeType,
        capturedAt: p.capturedAt.toISOString(),
      })),
    });
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to fetch roll", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ rollId: string }> }
) {
  try {
    const { rollId } = await params;
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

    const roll = await prisma.roll.findFirst({
      where: { id: rollId, visitorId: visitor.id, deletedAt: null },
    });
    if (!roll) {
      return errorResponse("ROLL_NOT_FOUND", "Roll not found", 404);
    }

    const body = await request.json();
    const updateData: Record<string, string> = {};

    if (body.title !== undefined) {
      if (body.title && body.title.length > 100) {
        return errorResponse("VALIDATION_ERROR", "Title max 100 characters");
      }
      updateData.title = body.title;
    }

    const updated = await prisma.roll.update({
      where: { id: rollId },
      data: updateData,
    });

    return successResponse({ id: updated.id, title: updated.title });
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to update roll", 500);
  }
}
