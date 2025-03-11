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
