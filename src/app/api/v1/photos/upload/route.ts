import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getVisitorToken } from "@/lib/visitor";
import { saveFile } from "@/lib/storage";

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

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const rollId = formData.get("rollId") as string | null;

    if (!file) {
      return errorResponse("VALIDATION_ERROR", "Image file is required");
    }

    if (!rollId) {
      return errorResponse("VALIDATION_ERROR", "rollId is required");
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return errorResponse("INVALID_FILE_TYPE", "Only JPEG and WebP are allowed");
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse("FILE_TOO_LARGE", "File size exceeds 10MB limit");
    }

    const roll = await prisma.roll.findFirst({
      where: { id: rollId, visitorId: visitor.id, deletedAt: null },
    });
    if (!roll) {
      return errorResponse("INVALID_ROLL", "Roll not found or access denied", 404);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { storagePath, fileSize } = await saveFile(buffer, file.type, rollId);

    const photo = await prisma.photo.create({
      data: {
        rollId,
        status: "TEMP",
        storagePath,
        mimeType: file.type,
        fileSize,
      },
    });

    await prisma.roll.update({
      where: { id: rollId },
      data: { capturedCount: { increment: 1 } },
    });

    return successResponse(
      { photoId: photo.id, status: photo.status },
      201
    );
  } catch {
    return errorResponse("UPLOAD_FAILED", "Failed to upload photo", 500);
  }
}
