import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

// Define Role enum to match the Prisma schema exactly
export type Role = "LEAD" | "TEAM";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface TokenPayload {
  id: string;
  email: string;
  role: Role;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7);
}

export function getUserFromToken(request: NextRequest): TokenPayload | null {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function isLead(request: NextRequest): boolean {
  const user = getUserFromToken(request);
  return user?.role === "LEAD";
}

export function isAuthenticated(request: NextRequest): boolean {
  return getUserFromToken(request) !== null;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}

// New wrapper function for API routes that require authentication
export function withAuth(handler: (req: NextRequest, user: TokenPayload) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const token = getTokenFromRequest(request);
      
      if (!token) {
        return NextResponse.json(
          { message: "Authentication required" },
          { status: 401 }
        );
      }

      const user = verifyToken(token);
      
      if (!user) {
        return NextResponse.json(
          { message: "Invalid token" },
          { status: 401 }
        );
      }

      return handler(request, user);
    } catch (error) {
      console.error("Authentication error:", error);
      return NextResponse.json(
        { message: "Authentication failed" },
        { status: 401 }
      );
    }
  };
}

// New wrapper function for API routes that require LEAD role
export function withLeadAuth(handler: (req: NextRequest, user: TokenPayload) => Promise<NextResponse>) {
  return withAuth(async (request: NextRequest, user: TokenPayload) => {
    if (user.role !== "LEAD") {
      return NextResponse.json(
        { message: "This operation requires LEAD role" },
        { status: 403 }
      );
    }
    return handler(request, user);
  });
}
