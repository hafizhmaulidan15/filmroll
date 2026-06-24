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
    });
    if (!roll) {
      return errorResponse("ROLL_NOT_FOUND", "Roll not found", 404);
    }

    const contactSheet = await prisma.contactSheet.findUnique({
      where: { rollId },
    });
    if (!contactSheet) {
      return errorResponse("CONTACT_SHEET_NOT_READY", "Contact sheet not yet generated", 404);
    }

    return successResponse({
      id: contactSheet.id,
      rollId: contactSheet.rollId,
      imagePath: contactSheet.imagePath,
      generatedAt: contactSheet.generatedAt.toISOString(),
    });
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to fetch contact sheet", 500);
  }
}
