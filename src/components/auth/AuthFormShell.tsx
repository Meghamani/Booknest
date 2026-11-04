import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { BookOpen, Sprout } from "lucide-react";

interface AuthFormShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function AuthFormShell({ title, subtitle, children }: AuthFormShellProps) {
  return (
    <main className="relative mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 content-center overflow-x-clip bg-[#FBF7ED] px-5 pb-2 text-[#173F3A] sm:px-8 lg:min-h-screen lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-x-10 lg:gap-y-2 lg:px-10 lg:py-0 xl:gap-x-16 xl:px-16">
      <Sprout aria-hidden="true" className="pointer-events-none absolute -right-3 top-2 h-24 w-24 rotate-[-35deg] text-[#DCE7D8]/70 sm:right-6 sm:top-4 sm:h-32 sm:w-32 lg:hidden" strokeWidth={1} />

      <section className="relative z-10 flex flex-col items-center pt-0 text-center lg:col-start-1 lg:row-start-1 lg:items-start lg:text-left">
        <Link href="/" aria-label="Booknest home" className="mb-0 inline-flex w-full items-center justify-center lg:mb-1">
          <Image
            src="/BooknestLogo-transparent.png"
            alt="Booknest - Read, Grow, Belong"
            width={351}
            height={286}
            priority
            className="h-[116px] w-auto object-contain sm:h-[124px] lg:h-[100px] xl:h-[118px]"
          />
        </Link>

        <h1 className="max-w-[620px] font-serif text-[36px] font-bold leading-[1.02] text-[#173F3A] sm:text-[40px] lg:text-[48px] xl:text-[54px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 font-serif text-base leading-snug text-[#526963] sm:text-lg lg:mt-2 lg:text-[21px]">
            {subtitle}
          </p>
        )}

        <div className="mt-3 flex w-full max-w-[310px] items-center justify-center gap-4 text-[#D8A33E] lg:mt-4">
          <span className="h-px flex-1 bg-[#D8A33E]/75" />
          <BookOpen aria-hidden="true" size={22} strokeWidth={1.5} />
          <span className="h-px flex-1 bg-[#D8A33E]/75" />
        </div>
      </section>

      <section aria-label="Cozy reading room" className="relative z-0 -mx-5 mt-3 h-[110px] overflow-hidden rounded-t-[24px] bg-[#E8EEE4] sm:-mx-8 sm:h-[140px] sm:rounded-t-[30px] lg:mx-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:h-[min(76vh,700px)] lg:min-h-[480px] lg:rounded-[36px]">
        <Image
          src="/LoginBanner.png"
          alt="A cozy reading room with a bookshelf, green armchair, lamp, sunlit window, books, and a coffee mug"
          width={1672}
          height={941}
          priority
          sizes="(min-width: 1024px) 52vw, 100vw"
          className="h-full w-full object-cover object-center"
        />
      </section>

      <section className="relative z-10 -mt-6 rounded-t-[36px] bg-[#FBF7ED] px-1 pb-2 pt-5 sm:-mt-8 sm:px-4 sm:pt-6 lg:col-start-1 lg:row-start-2 lg:mt-0 lg:rounded-none lg:px-0 lg:pb-0 lg:pt-2">
        {children}

        <div className="mt-4 text-center sm:mt-5 lg:mt-4">
          <div className="mb-2 flex items-center justify-center gap-3 text-[#D8A33E] lg:mb-3">
            <span className="h-px w-14 bg-[#D8A33E]/75" />
            <BookOpen aria-hidden="true" size={20} strokeWidth={1.5} />
            <span className="h-px w-14 bg-[#D8A33E]/75" />
          </div>
          <p className="font-serif text-sm italic text-[#36564F] sm:text-base lg:text-lg">“Books are a uniquely portable magic.”</p>
          <p className="mt-0.5 font-serif text-xs text-[#526963] sm:text-sm">— Stephen King</p>
        </div>

        <Sprout aria-hidden="true" className="pointer-events-none absolute bottom-4 -left-7 h-28 w-28 rotate-[-40deg] text-[#DCE7D8]/65 lg:hidden" strokeWidth={1} />
        <Sprout aria-hidden="true" className="pointer-events-none absolute bottom-4 -right-7 h-28 w-28 rotate-[40deg] scale-x-[-1] text-[#DCE7D8]/65 lg:hidden" strokeWidth={1} />
      </section>
    </main>
  );
}
