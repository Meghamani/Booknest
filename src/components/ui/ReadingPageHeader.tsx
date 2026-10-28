import { ReactNode } from "react";

interface ReadingPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  detail?: ReactNode;
}

export default function ReadingPageHeader({
  eyebrow,
  title,
  description,
  detail,
}: ReadingPageHeaderProps) {
  return (
    <header className="relative mb-8 overflow-hidden rounded-[1.75rem] bg-sidebar px-6 py-8 text-white sm:px-9 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-2 w-28 bg-secondaryAccent/80" />
      <div className="relative max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-secondaryAccent">
          {eyebrow}
        </p>
        <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#E1ECE6] sm:text-base sm:leading-7">
          {description}
        </p>
        {detail && <p className="mt-5 text-sm text-[#BBD2C8]">{detail}</p>}
      </div>
    </header>
  );
}
