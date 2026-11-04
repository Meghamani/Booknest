import { randomBytes } from "crypto";
import { Resend } from "resend";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";

const passwordRules = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

type ResetTokenPayload = jwt.JwtPayload & {
  userId?: unknown;
  passwordHash?: unknown;
  purpose?: unknown;
};

export async function POST(request: Request) {
  try {
    const body: { action?: unknown; email?: unknown; token?: unknown; password?: unknown } = await request.json();

    if (body.action === "request") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (user && process.env.RESEND_API_KEY && process.env.JWT_SECRET) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const token = jwt.sign(
          { userId: user.id, passwordHash: user.password, purpose: "password-reset" },
          process.env.JWT_SECRET,
          { expiresIn: "30m", jwtid: randomBytes(16).toString("hex") },
        );
        const baseUrl = process.env.APP_URL || new URL(request.url).origin;
        const resetUrl = new URL(`/reset-password?token=${encodeURIComponent(token)}`, baseUrl).toString();
        const sender = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
        const { error } = await resend.emails.send({
          from: sender,
          to: user.email,
          subject: "Reset your Booknest password",
          html: `<p>We received a request to reset your Booknest password.</p><p><a href="${resetUrl}">Choose a new password</a></p><p>This link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email.</p>`,
          text: `Reset your Booknest password: ${resetUrl}\n\nThis link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email.`,
        });

        if (error) console.error("[api/password-reset] Email delivery failed", error);
      } else if (user) {
        console.error("[api/password-reset] RESEND_API_KEY or JWT_SECRET is not configured");
      }

      return NextResponse.json({
        success: true,
        message: "If an account exists for that email, a password reset link will be sent.",
      });
    }

    if (body.action === "reset") {
      if (typeof body.token !== "string" || typeof body.password !== "string") {
        return NextResponse.json({ error: "The reset link is invalid or expired" }, { status: 400 });
      }

      if (!passwordRules.test(body.password)) {
        return NextResponse.json({ error: "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character" }, { status: 400 });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) return NextResponse.json({ error: "Password reset is unavailable" }, { status: 500 });

      let payload: ResetTokenPayload;
      try {
        payload = jwt.verify(body.token, secret) as ResetTokenPayload;
      } catch {
        return NextResponse.json({ error: "The reset link is invalid or expired" }, { status: 400 });
      }

      if (
        payload.purpose !== "password-reset" ||
        typeof payload.userId !== "string" ||
        typeof payload.passwordHash !== "string"
      ) {
        return NextResponse.json({ error: "The reset link is invalid or expired" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || user.password !== payload.passwordHash) {
        return NextResponse.json({ error: "The reset link is invalid or expired" }, { status: 400 });
      }

      const password = await bcrypt.hash(body.password, 10);
      await prisma.user.update({ where: { id: user.id }, data: { password } });

      return NextResponse.json({ success: true, message: "Password updated. You can now sign in." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[api/password-reset] Request failed", error);
    return NextResponse.json({ error: "Unable to process the password reset" }, { status: 500 });
  }
}