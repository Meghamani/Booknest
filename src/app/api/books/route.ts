import { NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { getAuthenticatedUserId } from "@/lib/auth";

const bookStatuses = ["library", "finished", "wishlist"] as const;

function isBookStatus(value: unknown): value is (typeof bookStatuses)[number] {
  return typeof value === "string" && bookStatuses.includes(value as (typeof bookStatuses)[number]);
}


/* =========================
   GET BOOKS (per user)
========================= */
export async function GET(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const status = new URL(req.url).searchParams.get("status");

    if (status && !isBookStatus(status)) {
      return NextResponse.json({ error: "Invalid book status" }, { status: 400 });
    }

    const books = await prisma.book.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(books);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load books" },
      { status: 500 }
    );
  }
}

/* =========================
   CREATE BOOK
========================= */
export async function POST(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await req.json();
    const title = typeof data.title === "string" ? data.title.trim() : "";
    const author = typeof data.author === "string" ? data.author.trim() : "";
    const genre = typeof data.genre === "string" ? data.genre.trim() : "";
    const rating = data.rating ?? 0;

    if (!title || !author || !genre || !isBookStatus(data.status)) {
      return NextResponse.json({ error: "Title, author, genre, and a valid status are required" }, { status: 400 });
    }

    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 0 and 5" }, { status: 400 });
    }

    const newBook = await prisma.book.create({
      data: {
        title,
        author,
        genre,
        status: data.status,
        finishedAt: data.status === "finished" ? new Date() : null,
        rating,
        imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
        review: data.review ?? null,
        notes: data.notes ?? null,
        userId, // 👈 real, verified user
      },
    });

    return NextResponse.json(newBook);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to save book" },
      { status: 500 }
    );
  }
}

/* =========================
   UPDATE BOOK STATUS (ownership protected)
========================= */
export async function PATCH(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, status, title, author, genre, rating, imageUrl, review, notes } =
      await req.json();

    if (typeof id !== "string" || !id || !isBookStatus(status)) {
      return NextResponse.json(
        { error: "A book id and valid status are required" },
        { status: 400 }
      );
    }

    if (
      typeof title !== "string" || !title.trim() ||
      typeof author !== "string" || !author.trim() ||
      typeof genre !== "string" || !genre.trim() ||
      !Number.isInteger(rating) || rating < 0 || rating > 5 ||
      (imageUrl !== undefined && typeof imageUrl !== "string")
    ) {
      return NextResponse.json({ error: "Invalid book details" }, { status: 400 });
    }

    const existingBook = await prisma.book.findFirst({
      where: { id, userId },
      select: { status: true, finishedAt: true, updatedAt: true },
    });

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const finishedAt = status !== "finished"
      ? null
      : existingBook.status === "finished"
        ? existingBook.finishedAt ?? existingBook.updatedAt
        : new Date();

    const result = await prisma.book.updateMany({
      where: { id, userId },
      data: {
        status,
        finishedAt,
        title: title.trim(),
        author: author.trim(),
        genre: genre.trim(),
        rating,
        imageUrl,
        review: review ?? null,
        notes: notes ?? null,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    const updatedBook = await prisma.book.findFirst({
      where: { id, userId },
    });

    return NextResponse.json(updatedBook);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update book status" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE BOOK (ownership protected)
========================= */
export async function DELETE(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await req.json();

    if (typeof id !== "string" || !id) {
      return NextResponse.json({ error: "A book id is required" }, { status: 400 });
    }

    await prisma.book.deleteMany({
      where: {
        id,
        userId, // 👈 ensures user owns the book
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 }
    );
  }
}


