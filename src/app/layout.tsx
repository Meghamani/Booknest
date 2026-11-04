import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import {Toaster} from "sonner";
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Booknest",
  description: "Your personal reading room",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "64x64" }],
    apple: [{ url: "/icon.png", type: "image/png", sizes: "64x64" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistMono.variable} antialiased`}
      >
        {children}
         <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
