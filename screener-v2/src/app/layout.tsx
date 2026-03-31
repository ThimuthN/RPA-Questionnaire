import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Manrope, Sora } from "next/font/google";
import { AppLogo } from "@/components/brand/AppLogo";
import { MainNav } from "@/components/navigation/MainNav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getAppSession } from "@/lib/auth/app-session";
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
  title: {
    default: "Assessment Hub",
    template: "%s | Assessment Hub"
  },
  description: "A polished workspace for creating, running, and reviewing technical assessments.",
  icons: {
    icon: "/icon.svg"
  }
};

export const viewport: Viewport = {
  themeColor: "#07111f"
};

const themeInitScript = `
  try {
    const savedTheme = localStorage.getItem("assessment-hub-theme");
    document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
  } catch {
    document.documentElement.dataset.theme = "light";
  }
`;

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAppSession();

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable} bg-[color:var(--app-bg)] text-[color:var(--app-text)]`}>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,var(--app-bg-accent-top),transparent_28%),linear-gradient(180deg,var(--app-bg),var(--app-bg))] text-[color:var(--app-text)]">
          <header className="sticky top-0 z-30 border-b border-[color:var(--app-header-border)] bg-[color:var(--app-header-bg)] backdrop-blur-xl">
            <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
              <Link href="/" className="transition hover:opacity-95">
                <AppLogo />
              </Link>
              <MainNav viewer={session ? { email: session.email, name: session.name, role: session.role } : null} />
            </nav>
          </header>
          <main className="mx-auto w-full max-w-7xl px-4 py-8 md:py-10">{children}</main>
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
