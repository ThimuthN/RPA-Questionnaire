import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Manrope, Sora } from "next/font/google";
import { MainNav } from "@/components/navigation/MainNav";
import "./globals.css";

const fontDisplay = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display"
});

const fontBody = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "Assessment Hub",
  description: "A platform for creating, taking, and reviewing technical assessments."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable} bg-ink-950`}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(47,134,255,0.16),transparent_28%),linear-gradient(180deg,#040913,#091326)] text-white">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/68 backdrop-blur-xl">
            <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
              <Link href="/" className="font-display text-lg tracking-wide text-white">
                Assessment Hub
              </Link>
              <MainNav />
            </nav>
          </header>
          <main className="mx-auto w-full max-w-7xl px-4 py-8 md:py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
