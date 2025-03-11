import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Get a single task by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;

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
}

// Update a task
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;
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
    if (user.role !== "LEAD" && (title || assignedToId)) {
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
      previousAssignee: assignedToId ? existingTask.assignedToId : undefined,
      newAssignee: assignedToId || undefined
    };

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (user.role === "LEAD" && title) updateData.title = title;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (user.role === "LEAD" && assignedToId) updateData.assignedToId = assignedToId;

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
}

// Delete a task (LEAD only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only LEADs can delete tasks
    if (user.role !== "LEAD") {
      return NextResponse.json({ message: "Only LEAD users can delete tasks" }, { status: 403 });
    }

    const taskId = params.id;

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    // Create a history entry before deletion
    await prisma.taskHistory.create({
      data: {
        taskId,
        userId: user.id,
        action: "TASK_DELETED",
        previousStatus: task.status,
        previousTitle: task.title,
        previousDesc: task.description,
        previousAssignee: task.assignedToId
      }
    });

    // Delete task
    await prisma.task.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Task deletion error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}
