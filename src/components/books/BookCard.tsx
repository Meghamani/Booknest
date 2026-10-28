"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

interface BookCardProps {
  title: string;
  author: string;
  genre?: string;
  rating?: number;
  cover: string;
  href: string;
  controls?: ReactNode;
}

export default function BookCard({
  title,
  author,
  genre,
  rating = 0,
  cover,
  href,
  controls,
}: BookCardProps) {
  return (
    <Link
      href={href}
      className="group block w-full min-w-0 relative cursor-pointer"
    >
      {/* BOOK IMAGE WRAPPER */}
      <div className="relative w-full aspect-[5/7] rounded-xl overflow-hidden shadow-md">
        <Image
        src={cover && cover.trim() !== "" ? cover : "/default-img.png"}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* OVERLAY CONTROLS */}
        <div
          className="
    absolute inset-0 
    bg-gradient-to-t from-black/60 via-black/30 to-transparent
    opacity-0 group-hover:opacity-100
    transition-opacity duration-300
    flex items-start justify-end p-3
  "
        >
          <div className="flex gap-2">
            {controls}
          </div>
        </div>
      </div>

      {/* TEXT BELOW */}
      <div className="mt-2 space-y-0.5">
        <h3 className="line-clamp-1 text-sm font-semibold text-textPrimary">{title}</h3>
        <p className="line-clamp-1 text-xs text-textSecondary">{author}</p>
        {genre && <p className="line-clamp-1 text-xs text-textSecondary/75">{genre}</p>}
        {rating > 0 && (
          <div className="flex min-h-5 items-center gap-1.5 pt-0.5">
            <span
              role="img"
              aria-label={`Rated ${rating} out of 5 stars`}
              className="text-sm leading-none tracking-[0.08em] text-[#B78930]"
            >
              {Array.from({ length: 5 }, (_, index) => index < rating ? "★" : "☆").join("")}
            </span>
            <span className="text-xs font-medium tabular-nums text-textSecondary">{rating}/5</span>
          </div>
        )}
      </div>
    </Link>
  );
}
