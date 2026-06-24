import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getVisitorToken } from "@/lib/visitor";
import { v4 as uuidv4 } from "uuid";

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

    const shareToken = uuidv4().replace(/-/g, "").substring(0, 16);
    const shareRoll = await prisma.shareRoll.create({
      data: { rollId, shareToken },
    });

    return successResponse(
      {
        id: shareRoll.id,
        shareToken: shareRoll.shareToken,
        shareUrl: `/share/${shareRoll.shareToken}`,
      },
      201
    );
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to create share roll", 500);
  }
}
