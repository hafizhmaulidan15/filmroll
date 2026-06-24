import type { Metadata } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { VisitorProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: "FilmRoll - Capture memories, not content.",
  description: "A disposable camera web experience focused on privacy, nostalgia, and memory keeping.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="pb-20 safe-bottom">
        <VisitorProvider>
          <main className="mx-auto max-w-lg min-h-screen">{children}</main>
          <BottomNav />
        </VisitorProvider>
      </body>
    </html>
  );
}
