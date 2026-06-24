import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getVisitorToken } from "@/lib/visitor";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
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

    const photo = await prisma.photo.findFirst({
      where: { id: photoId, roll: { visitorId: visitor.id } },
    });
    if (!photo) {
      return errorResponse("PHOTO_NOT_FOUND", "Photo not found", 404);
    }

    const updated = await prisma.photo.update({
      where: { id: photoId },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });

    return successResponse({ id: updated.id, status: updated.status });
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to archive photo", 500);
  }
}
