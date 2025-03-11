import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // API routes that require authentication
  // if (request.nextUrl.pathname.startsWith("/api/tasks")) {
  //   const user = getUserFromToken(request);

  //   // Check if user is authenticated
  //   if (!user) {
  //     return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  //   }

  //   // Check if operation requires LEAD permissions
  //   const isTaskCreationOrDeletion =
  //     (request.method === "POST" && !request.nextUrl.pathname.includes("/")) ||
  //     request.method === "DELETE";

  //   // Check if it's a LEAD-only operation on tasks
  //   const isAssignmentOrTitleUpdate =
  //     request.method === "PUT" &&
  //     (request.headers.get("content-type")?.includes("application/json") || "") &&
  //     request.nextUrl.pathname.split("/").length === 4; // /api/tasks/[id]

  //   // Require LEAD permissions for specific operations
  //   if ((isTaskCreationOrDeletion || isAssignmentOrTitleUpdate) && !isLead(request)) {
  //     return NextResponse.json({ message: "Forbidden - Requires LEAD role" }, { status: 403 });
  //   }
  // }

  return NextResponse.next();
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/api/tasks/:path*"]
};
