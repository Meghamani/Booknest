import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type AuthTokenPayload = jwt.JwtPayload & { userId?: unknown };

export async function getAuthenticatedUserId(): Promise<string | null> {
  const token = (await cookies()).get("auth_token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) return null;

  try {
    const payload = jwt.verify(token, secret) as AuthTokenPayload;
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}