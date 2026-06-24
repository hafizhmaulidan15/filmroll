import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getVisitorToken } from "@/lib/visitor";

export async function PATCH(
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
    });
    if (!roll) {
      return errorResponse("ROLL_NOT_FOUND", "Roll not found", 404);
    }

    if (roll.status === "FINISHED") {
      return errorResponse("VALIDATION_ERROR", "Roll is already finished");
    }

    const updated = await prisma.roll.update({
      where: { id: rollId },
      data: { status: "FINISHED" },
    });

    return successResponse({ status: updated.status });
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to finish roll", 500);
  }
}
