
"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { Sprout } from "lucide-react";
import { usePathname } from "next/navigation";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") {
    return <div className="min-h-screen w-full bg-[#FBF7ED]">{children}</div>;
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#FBF7ED] text-[#173F3A]">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[48fr_52fr]">
        <section className="flex min-w-0 items-center justify-center px-5 py-12 sm:px-8 md:px-12 lg:px-8 lg:py-3 xl:px-14 2xl:px-16">
          <div className="w-full max-w-[580px]">
            {children}
          </div>
        </section>

        <section className="flex min-w-0 items-center justify-center px-4 pb-10 sm:px-8 lg:px-7 lg:py-10 xl:px-12">
          <div className="w-full max-w-[900px] rounded-[32px] bg-[#E8EEE4] p-4 sm:rounded-[40px] sm:p-6 lg:p-7 xl:p-8">
            <Image
              src="/LoginBanner.png"
              alt="A cozy reading room with a green armchair, books, flowers, and a sunlit window"
              width={1680}
              height={944}
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="h-auto w-full rounded-[26px] shadow-[0_20px_50px_rgba(33,73,67,0.13)] sm:rounded-[32px]"
            />

            <div className="mt-5 text-center sm:mt-6">
              <div className="mb-3 flex items-center justify-center gap-3">
                <span className="h-px w-12 bg-[#D6AD55]" />
                <Sprout aria-hidden="true" size={20} strokeWidth={1.5} className="text-[#B68B36]" />
                <span className="h-px w-12 bg-[#D6AD55]" />
              </div>

              <p className="mx-auto max-w-[440px] font-serif text-base italic leading-relaxed text-[#36564F] sm:text-lg">
                A little space for stories, and the people who love them.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
