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
    const { rollId } = body;

    if (!rollId) {
      return errorResponse("VALIDATION_ERROR", "rollId is required");
    }

    const roll = await prisma.roll.findFirst({
      where: { id: rollId, visitorId: visitor.id, deletedAt: null },
    });
    if (!roll) {
      return errorResponse("ROLL_NOT_FOUND", "Roll not found", 404);
    }

    if (roll.status !== "FINISHED") {
      return errorResponse("VALIDATION_ERROR", "Roll must be FINISHED to generate contact sheet");
    }

    const existing = await prisma.contactSheet.findUnique({
      where: { rollId },
    });
    if (existing) {
      return successResponse({
        id: existing.id,
        imagePath: existing.imagePath,
        generatedAt: existing.generatedAt.toISOString(),
      });
    }

    const contactSheet = await prisma.contactSheet.create({
      data: {
        rollId,
        imagePath: `contact-sheets/${rollId}.jpg`,
      },
    });

    return successResponse(
      {
        id: contactSheet.id,
        imagePath: contactSheet.imagePath,
        generatedAt: contactSheet.generatedAt.toISOString(),
      },
      201
    );
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to generate contact sheet", 500);
  }
}
