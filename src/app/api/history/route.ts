import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Get history of all tasks or specific task
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const skip = (page - 1) * limit;

    // Query options
    const queryOptions: {
      include: Record<string, unknown>;
      orderBy: Record<string, string>;
      where?: Record<string, unknown>;
      skip: number;
      take: number;
    } = {
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        timestamp: "desc"
      },
      skip,
      take: limit
    };

    // Filter by task if taskId is provided
    if (taskId) {
      queryOptions.where = {
        taskId
      };
    } else if (user.role !== "LEAD") {
      // If not a lead, only show history of tasks assigned to the user
      queryOptions.where = {
        task: {
          assignedToId: user.id
        }
      };
    }

    // Query for histories
    const histories = await prisma.taskHistory.findMany(queryOptions);

    // Get total count for pagination
    const totalCount = await prisma.taskHistory.count({
      where: queryOptions.where
    });

    return NextResponse.json({
      histories,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
