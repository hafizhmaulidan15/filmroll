import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getVisitorToken } from "@/lib/visitor";
import { v4 as uuidv4 } from "uuid";

export async function POST() {
  try {
    const visitorToken = uuidv4();
    const visitor = await prisma.visitor.create({
      data: { visitorToken },
    });

    return successResponse(
      { visitorId: visitor.id, visitorToken: visitor.visitorToken },
      201
    );
  } catch {
    return errorResponse("VISITOR_CREATION_FAILED", "Failed to create visitor", 500);
  }
}

export async function GET() {
  try {
    const token = await getVisitorToken();
    if (!token) {
      return errorResponse("UNAUTHORIZED", "Visitor token required", 401);
    }

    const visitor = await prisma.visitor.findUnique({
      where: { visitorToken: token },
    });

    if (!visitor) {
      return errorResponse("NOT_FOUND", "Visitor not found", 404);
    }

    return successResponse({
      id: visitor.id,
      createdAt: visitor.createdAt.toISOString(),
    });
  } catch {
    return errorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
