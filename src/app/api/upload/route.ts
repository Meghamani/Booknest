import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getAuthenticatedUserId } from "@/lib/auth";
import { s3, S3_BUCKET } from "@/lib/s3-client";

const imageExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(req: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const extension = imageExtensions[file.type];
    if (!extension) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, and GIF images are supported" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Images must be smaller than 5 MB" }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const filename = `${randomUUID()}${extension}`;
    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: `uploads/${filename}`,
      Body: Buffer.from(bytes),
      ContentType: file.type,
      ContentLength: file.size,
    }));

    return NextResponse.json({
      url: `/api/images/${filename}`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
