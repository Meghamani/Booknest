import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password } = body;
    // --- LOGIN ---
    if (action === "login") {
      if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
        return NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      if (!process.env.JWT_SECRET) {
        console.error("[api/auth] JWT_SECRET is not configured");
        return NextResponse.json({ error: "Authentication is unavailable" }, { status: 500 });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      const cookie = serialize("auth_token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
      const response = NextResponse.json({
        success: true,
        message: "Login successful",
        user: { id: user.id, email: user.email },
      });

      response.headers.set("Set-Cookie", cookie);
      return response;
    }

    // --- LOGOUT ---
    if (action === "logout") {
      const cookie = serialize("auth_token", "", {
        httpOnly: true,
        path: "/",
        expires: new Date(0),
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      const response = NextResponse.json({ success: true, message: "Logged out" });
      response.headers.set("Set-Cookie", cookie);
      return response;
    }

    // --- INVALID ACTION ---
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err) {
    console.error("[api/auth] Authentication request failed", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
