import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuthenticatedUserId } from "@/lib/auth";
import { s3, S3_BUCKET } from "@/lib/s3-client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filename } = await params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.test(filename)) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: `uploads/${filename}` }),
      { expiresIn: 60 }
    );
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("Image retrieval error:", err);
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}