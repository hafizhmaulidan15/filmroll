import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const shareRoll = await prisma.shareRoll.findUnique({
      where: { shareToken: token },
      include: {
        roll: {
          include: {
            filmStock: true,
            photos: {
              where: { status: "ARCHIVED" },
              orderBy: { capturedAt: "asc" },
            },
          },
        },
      },
    });

    if (!shareRoll || !shareRoll.isActive) {
      return errorResponse("SHARE_NOT_FOUND", "Share roll not found or inactive", 404);
    }

    if (shareRoll.expiresAt && new Date() > shareRoll.expiresAt) {
      return errorResponse("SHARE_EXPIRED", "This share link has expired", 410);
    }

    return successResponse({
      shareToken: shareRoll.shareToken,
      createdAt: shareRoll.createdAt.toISOString(),
      roll: {
        id: shareRoll.roll.id,
        title: shareRoll.roll.title,
        aspectRatio: shareRoll.roll.aspectRatio,
        filmStock: {
          name: shareRoll.roll.filmStock.name,
          brand: shareRoll.roll.filmStock.brand,
          iso: shareRoll.roll.filmStock.iso,
        },
        photos: shareRoll.roll.photos.map((p) => ({
          id: p.id,
          storagePath: p.storagePath,
          thumbnailPath: p.thumbnailPath,
          caption: p.caption,
          width: p.width,
          height: p.height,
          capturedAt: p.capturedAt.toISOString(),
        })),
      },
    });
  } catch {
    return errorResponse("SERVER_ERROR", "Failed to fetch share roll", 500);
  }
}
