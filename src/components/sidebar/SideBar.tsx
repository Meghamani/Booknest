"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarMenuItems } from "@/constants/navigation";
import { theme } from "@/constants/theme";

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className="h-full w-full overflow-y-auto shadow-md p-5 sm:p-6 flex flex-col min-h-screen"
      style={{ backgroundColor: theme.colors.sidebarBg, color: "#F7F4EB" }}
    >
      {/* Logo + Name */}
      <Link
        href="/dashboard"
        aria-label="Booknest home"
        onClick={onNavigate}
        className="mb-8 rounded-lg font-serif text-2xl font-bold text-[#F7F4EB] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondaryAccent"
      >
        Booknest
      </Link>

      <nav className="flex flex-col gap-4">
        {sidebarMenuItems.map((item) => {
          const isActive =item.href === '/dashboard'? pathname === item.href : pathname?.split('/')[2] === item.href.split('/')[2];
          return (
            <Link
              key={item.href}
              href={item.href}
              data-app-tour={item.href === "/dashboard" ? undefined : item.href.split("/").pop()}
              style={{
                backgroundColor: isActive ? theme.colors.accent : "transparent",
                color: isActive ? theme.colors.textPrimary : "#F7F4EB",
              }}
              className="rounded-lg p-2 transition hover:bg-white/10"
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
