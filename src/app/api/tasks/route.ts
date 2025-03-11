import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Create a new task (Lead only)
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "LEAD") {
      return NextResponse.json({ message: "Only LEAD users can create tasks" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, assignedToId } = body;

    if (!title || !description) {
      return NextResponse.json({ message: "Title and description are required" }, { status: 400 });
    }

    // Check if assignedTo user exists if provided
    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId }
      });

      if (!assignee) {
        return NextResponse.json({ message: "Assignee user not found" }, { status: 404 });
      }
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: "NOT_STARTED",
        createdById: user.id,
        assignedToId,
        histories: {
          create: {
            userId: user.id,
            action: "TASK_CREATED",
            newTitle: title,
            newDesc: description,
            newAssignee: assignedToId,
            newStatus: "NOT_STARTED"
          }
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
        assignedTo: assignedToId
          ? {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          : undefined
      }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Task creation error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

// Get all tasks
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let tasks;

    // If LEAD, get all tasks. If TEAM, get only assigned tasks
    if (user.role === "LEAD") {
      tasks = await prisma.task.findMany({
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
        },
        orderBy: { createdAt: "desc" }
      });
    } else {
      tasks = await prisma.task.findMany({
        where: { assignedToId: user.id },
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
        },
        orderBy: { createdAt: "desc" }
      });
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Task listing error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}
