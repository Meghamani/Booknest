"use client";

import { useState } from "react";
import Image from "next/image";

type AvatarProps = {
  name: string;
  imageUrl?: string;
  size?: number; // optional (default 36)
};

export default function Avatar({
  name,
  imageUrl,
  size = 36,
}: AvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const initial = name?.charAt(0).toUpperCase();

  const showImage = imageUrl && imageUrl !== failedImageUrl;

  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full border border-border font-semibold text-textPrimary"
      style={{
        width: size,
        height: size,
      }}
    >
      {showImage ? (
        <Image
          src={imageUrl}
          alt={name}
          width={size}
          height={size}
          className="object-cover"
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        <div className="w-full h-full bg-accent flex items-center justify-center">
          {initial}
        </div>
      )}
    </div>
  );
}
