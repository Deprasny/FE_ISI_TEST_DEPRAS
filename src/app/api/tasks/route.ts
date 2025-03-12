import { withAuth, withLeadAuth, type TokenPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Create a new task (Lead only)
export const POST = withLeadAuth(async (request: NextRequest, user: TokenPayload) => {
  try {
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
});

// Get all tasks
export const GET = withAuth(async (request: NextRequest, user: TokenPayload) => {
  try {
    let tasks;
    if (user.role === "LEAD") {
      // LEAD can see all tasks
      tasks = await prisma.task.findMany({
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      // TEAM members can only see tasks assigned to them
      tasks = await prisma.task.findMany({
        where: {
          assignedToId: user.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { message: "Error fetching tasks" },
      { status: 500 }
    );
  }
});
