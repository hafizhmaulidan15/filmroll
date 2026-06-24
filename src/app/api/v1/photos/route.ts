import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getVisitorToken } from "@/lib/visitor";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const rollId = searchParams.get("rollId");

    const where: Record<string, unknown> = {
      roll: { visitorId: visitor.id },
    };
    if (status) where.status = status;
    if (rollId) where.rollId = rollId;

    const photos = await prisma.photo.findMany({
      where: where as any,
      include: { roll: { select: { title: true, filmStock: true } } },
      orderBy: { capturedAt: "desc" },
    });

    return successResponse(
      photos.map((p) => ({
        id: p.id,
        rollId: p.rollId,
        status: p.status,
        storagePath: p.storagePath,
        thumbnailPath: p.thumbnailPath,
        caption: p.caption,
        width: p.width,
        height: p.height,
        fileSize: p.fileSize,
        mimeType: p.mimeType,
        capturedAt: p.capturedAt.toISOString(),
        archivedAt: p.archivedAt?.toISOString() ?? null,
        roll: p.roll,
      }))
    );
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to fetch photos", 500);
  }
}
