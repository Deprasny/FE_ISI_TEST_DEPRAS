import { withAuth, withLeadAuth, type TokenPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Get a single task by ID
export const GET = withAuth(async (request: NextRequest, user: TokenPayload) => {
  try {
    // Extract the task ID from the URL path
    const pathParts = request.nextUrl.pathname.split('/');
    const taskId = pathParts[pathParts.length - 1];

    if (!taskId) {
      return NextResponse.json({ message: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // Team members can only access tasks assigned to them
    if (user.role !== "LEAD" && task.assignedToId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Task fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
});

// Update a task
export const PUT = withAuth(async (request: NextRequest, user: TokenPayload) => {
  try {
    // Extract the task ID from the URL path
    const pathParts = request.nextUrl.pathname.split('/');
    const taskId = pathParts[pathParts.length - 1];

    if (!taskId) {
      return NextResponse.json({ message: "Task ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, status, assignedToId } = body;

    // Find the task first
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!existingTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // Check permissions
    const isAssignedTeamMember = existingTask.assignedToId === user.id;

    // LEAD can update everything
    // TEAM can only update status and description of tasks assigned to them
    if (user.role !== "LEAD" && !isAssignedTeamMember) {
      return NextResponse.json(
        { message: "Forbidden - You are not assigned to this task" },
        { status: 403 }
      );
    }

    // Team members can only update status and description
    if (user.role !== "LEAD" && (title || assignedToId !== undefined)) {
      return NextResponse.json(
        { message: "Team members can only update status and description" },
        { status: 403 }
      );
    }

    // Validate status value if provided
    if (status && !["NOT_STARTED", "ON_PROGRESS", "DONE", "REJECT"].includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    // Create history entry
    const historyData = {
      userId: user.id,
      action: "TASK_UPDATED",
      previousStatus: status ? existingTask.status : undefined,
      newStatus: status || undefined,
      previousDesc: description ? existingTask.description : undefined,
      newDesc: description || undefined,
      previousTitle: title ? existingTask.title : undefined,
      newTitle: title || undefined,
      previousAssignee: assignedToId !== undefined ? existingTask.assignedToId : undefined,
      newAssignee: assignedToId !== undefined ? assignedToId : undefined
    };

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (user.role === "LEAD" && title) updateData.title = title;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (user.role === "LEAD" && assignedToId !== undefined) updateData.assignedToId = assignedToId;

    // Update task with history
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...updateData,
        histories: {
          create: historyData
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Task update error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
});

// Delete a task (LEAD only)
export const DELETE = withLeadAuth(async (request: NextRequest, user: TokenPayload) => {
  try {
    // Extract the task ID from the URL path
    const pathParts = request.nextUrl.pathname.split('/');
    const taskId = pathParts[pathParts.length - 1];

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

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // First, delete all task history records associated with this task
      await tx.taskHistory.deleteMany({
        where: { taskId }
      });

      // Then delete the task
      await tx.task.delete({
        where: { id: taskId }
      });
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Task deletion error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
});
