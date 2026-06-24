import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getVisitorToken } from "@/lib/visitor";

export async function GET(
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

    return successResponse({
      id: photo.id,
      rollId: photo.rollId,
      status: photo.status,
      storagePath: photo.storagePath,
      thumbnailPath: photo.thumbnailPath,
      caption: photo.caption,
      width: photo.width,
      height: photo.height,
      fileSize: photo.fileSize,
      mimeType: photo.mimeType,
      capturedAt: photo.capturedAt.toISOString(),
      archivedAt: photo.archivedAt?.toISOString() ?? null,
    });
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to fetch photo", 500);
  }
}

export async function PATCH(
  request: Request,
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

    const body = await request.json();
    if (body.caption !== undefined && body.caption.length > 500) {
      return errorResponse("VALIDATION_ERROR", "Caption max 500 characters");
    }

    const updated = await prisma.photo.update({
      where: { id: photoId },
      data: { caption: body.caption },
    });

    return successResponse({ id: updated.id, caption: updated.caption });
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to update photo", 500);
  }
}

export async function DELETE(
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

    await prisma.photo.update({
      where: { id: photoId },
      data: { status: "DELETED", deletedAt: new Date() },
    });

    return new Response(null, { status: 204 });
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to delete photo", 500);
  }
}
