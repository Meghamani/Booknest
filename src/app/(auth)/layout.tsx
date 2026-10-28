"use client";

import Image from "next/image";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">

      {/* LEFT SIDE */}
      <div className="flex flex-col justify-center bg-page px-6 py-12 md:px-16">
        {children}
      </div>

      {/* RIGHT SIDE */}
      <div className="relative hidden items-center justify-center overflow-hidden bg-accent md:flex">

        {/* IMAGE + QUOTE Container */}
        <div className="relative z-10 mt-10 flex w-full max-w-lg flex-col items-center px-6">

          {/* Illustration */}
          <Image
            src="/login.png"
            alt="Reading Illustration"
            width={500}
            height={500}
            className="h-auto w-full object-contain"
            priority
          />

          {/* Quote just below image */}
          <p className="mt-6 px-4 text-center text-lg font-medium text-textSecondary sm:px-10">
            “A room without books is like a body without a soul.”
          </p>
        </div>
      </div>

    </div>
  );
}
