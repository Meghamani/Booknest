// app/api/profile/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { getAuthenticatedUserId } from "@/lib/auth";

function parseFavoriteGenres(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((genre): genre is string => typeof genre === "string")
      : [];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true, favoriteGenres: true, readingGoal: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: { ...user, favoriteGenres: parseFavoriteGenres(user.favoriteGenres) },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const body: { name?: unknown; avatarUrl?: unknown; favoriteGenres?: unknown; readingGoal?: unknown } = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const avatarUrl = body.avatarUrl === "" || body.avatarUrl === null
      ? null
      : typeof body.avatarUrl === "string" && body.avatarUrl.startsWith("/uploads/")
        ? body.avatarUrl
        : undefined;

    if (!name || name.length > 80) {
      return NextResponse.json({ error: "Name is required and must be 80 characters or fewer" }, { status: 400 });
    }

    if (avatarUrl === undefined) {
      return NextResponse.json({ error: "Invalid profile photo" }, { status: 400 });
    }

    if (!Array.isArray(body.favoriteGenres) || body.favoriteGenres.length > 100) {
      return NextResponse.json({ error: "Favorite genres must be a list" }, { status: 400 });
    }

    if (!Number.isInteger(body.readingGoal) || (body.readingGoal as number) < 1 || (body.readingGoal as number) > 1000) {
      return NextResponse.json({ error: "Yearly reading goal must be between 1 and 1000 books" }, { status: 400 });
    }

    const favoriteGenres = [...new Set(body.favoriteGenres.map((genre) =>
      typeof genre === "string" ? genre.trim() : ""
    ))];

    if (favoriteGenres.some((genre) => !genre || genre.length > 60)) {
      return NextResponse.json({ error: "Each favorite genre must be 1–60 characters" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, avatarUrl, favoriteGenres: JSON.stringify(favoriteGenres), readingGoal: body.readingGoal as number },
      select: { id: true, name: true, email: true, avatarUrl: true, readingGoal: true },
    });

    return NextResponse.json({
      user: { ...user, favoriteGenres },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
