import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getVisitorToken } from "@/lib/visitor";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const shareRoll = await prisma.shareRoll.findFirst({
      where: { id, roll: { visitorId: visitor.id } },
    });
    if (!shareRoll) {
      return errorResponse("SHARE_NOT_FOUND", "Share roll not found", 404);
    }

    const updated = await prisma.shareRoll.update({
      where: { id },
      data: { isActive: false },
    });

    return successResponse({ id: updated.id, isActive: updated.isActive });
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to disable share roll", 500);
  }
}
