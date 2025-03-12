import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Get all users (Lead gets full details, Team gets limited info for display purposes)
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Different access levels based on role
    if (user.role === "LEAD") {
      // LEAD users get full access to all user details
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
    } else {
      // TEAM users get limited access - just enough to display names in task history
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          role: true
        },
        orderBy: { name: "asc" }
      });
      return NextResponse.json(users);
    }
  } catch (error) {
    console.error("User listing error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
