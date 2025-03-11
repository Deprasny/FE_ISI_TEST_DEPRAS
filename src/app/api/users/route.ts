import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Get all users (Lead only - for assigning tasks)
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only LEAD users can see the list of all users (for task assignment)
    if (user.role !== "LEAD") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("User listing error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
