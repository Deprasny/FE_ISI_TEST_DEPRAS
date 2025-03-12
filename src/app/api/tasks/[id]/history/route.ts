import { withAuth, type TokenPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Get history for a specific task
export const GET = withAuth(async (request: NextRequest, user: TokenPayload) => {
  try {
    // Extract the task ID from the URL path
    const pathParts = request.nextUrl.pathname.split('/');
    // The task ID is the second-to-last part in the path for the history endpoint
    const taskId = pathParts[pathParts.length - 2];

    if (!taskId) {
      return NextResponse.json({ message: "Task ID is required" }, { status: 400 });
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // Team members can only see histories of tasks assigned to them
    if (user.role !== "LEAD" && task.assignedToId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Get task history
    const histories = await prisma.taskHistory.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        timestamp: "desc"
      }
    });

    return NextResponse.json(histories);
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
});
