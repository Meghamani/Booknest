"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar/SideBar";
import TopNavBar from "@/components/navbar/TopNavBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  useEffect(() => {
    const openNavigationForTour = () => {
      if (window.matchMedia("(max-width: 767px)").matches) setMobileNavigationOpen(true);
    };
    window.addEventListener("book-hub-open-mobile-nav", openNavigationForTour);
    return () => window.removeEventListener("book-hub-open-mobile-nav", openNavigationForTour);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:block md:w-64">
        <Sidebar />
      </div>

      <TopNavBar onMenuClick={() => setMobileNavigationOpen(true)} />

      {mobileNavigationOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavigationOpen(false)}
          />
          <div className="relative h-full w-64 max-w-[85vw] shadow-xl">
            <Sidebar onNavigate={() => setMobileNavigationOpen(false)} />
          </div>
        </div>
      )}

      <main className="min-h-screen min-w-0 w-full bg-page px-4 py-5 pt-20 sm:px-6 sm:py-6 sm:pt-20 md:ml-64 md:w-[calc(100%-16rem)] lg:p-8 lg:pt-24">
        {children}
      </main>
    </div>
  );
}