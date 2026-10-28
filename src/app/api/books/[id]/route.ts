import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { getAuthenticatedUserId } from "@/lib/auth";

const bookStatuses = ["library", "finished", "wishlist"] as const;

function isBookStatus(value: unknown): value is (typeof bookStatuses)[number] {
  return typeof value === "string" && bookStatuses.includes(value as (typeof bookStatuses)[number]);
}

// GET
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const book = await prisma.book.findFirst({ where: { id, userId } });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (err) {
    console.error("[GET /api/books/[id]] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const data = await req.json();

    if (
      typeof data.title !== "string" || !data.title.trim() ||
      typeof data.author !== "string" || !data.author.trim() ||
      typeof data.genre !== "string" || !data.genre.trim() ||
      !isBookStatus(data.status) ||
      !Number.isInteger(data.rating) || data.rating < 0 || data.rating > 5 ||
      (data.imageUrl !== undefined && typeof data.imageUrl !== "string")
    ) {
      return NextResponse.json({ error: "Invalid book details" }, { status: 400 });
    }

    const existingBook = await prisma.book.findFirst({
      where: { id, userId },
      select: { status: true, finishedAt: true, updatedAt: true },
    });

    if (!existingBook) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    const finishedAt = data.status !== "finished"
      ? null
      : existingBook.status === "finished"
        ? existingBook.finishedAt ?? existingBook.updatedAt
        : new Date();

    const result = await prisma.book.updateMany({
      where: { id, userId },
      data: {
        title: data.title.trim(),
        author: data.author.trim(),
        genre: data.genre.trim(),
        status: data.status,
        finishedAt,
        rating: data.rating,
        imageUrl: data.imageUrl ?? "",
        review: typeof data.review === "string" ? data.review : null,
        notes: typeof data.notes === "string" ? data.notes : null,
      },
    });

    if (!result.count) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    const updated = await prisma.book.findFirst({ where: { id, userId } });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/books/[id]] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const result = await prisma.book.deleteMany({ where: { id, userId } });

    if (!result.count) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/books/[id]] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
