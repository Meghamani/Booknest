"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { sidebarMenuItems } from "@/constants/navigation";
import { theme } from "@/constants/theme";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);

  async function handleLogout() {
    onNavigate?.();
    setLogoutConfirmationOpen(false);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      if (!response.ok) throw new Error("Logout failed");
      toast.success("You have been logged out");
      router.replace("/login");
    } catch (error) {
      console.error(error);
      toast.error("Could not log out. Please try again.");
    }
  }

  return (
    <aside
      className="h-full w-full overflow-y-auto shadow-md p-5 sm:p-6 flex flex-col min-h-screen"
      style={{ backgroundColor: theme.colors.sidebarBg, color: "#F7F4EB" }}
    >
      {/* Logo + Name */}
      <Link
        href="/dashboard"
        aria-label="Book Hub home"
        onClick={onNavigate}
        className="mb-8 flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondaryAccent"
      >
        <Image
          src="/book-hub-logo.png" // replace with your logo path
          alt="Book Hub Logo"
          width={40}
          height={40}
          className="object-contain"
        />
        <h2 className="text-2xl font-bold">Book Hub</h2>
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

      <button
        className="mt-auto rounded-lg p-2 text-[#F3A18C] transition hover:bg-white/10"
        onClick={() => setLogoutConfirmationOpen(true)}
      >
        Logout
      </button>
      <ConfirmationDialog
        open={logoutConfirmationOpen}
        title="Are you sure you want to log out?"
        message="You will need to log in again to access your reading room."
        confirmButtonText="Log out"
        cancelButtonText="Stay logged in"
        onConfirm={() => void handleLogout()}
        onCancel={() => setLogoutConfirmationOpen(false)}
      />
    </aside>
  );
}
