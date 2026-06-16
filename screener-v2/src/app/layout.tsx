import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { IBM_Plex_Mono, Manrope, Sora } from "next/font/google";
import { AppLogo } from "@/components/brand/AppLogo";
import { MainNav } from "@/components/navigation/MainNav";
import { WorkspaceRail } from "@/components/navigation/WorkspaceRail";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { CommandPalette, CommandPaletteTrigger } from "@/components/search/CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getAppSession } from "@/lib/auth/app-session";
import { getConfiguredAppUrl } from "@/lib/server/app-url";
import { brandThemeCss } from "@/lib/brand/theme";
import { getStarryStatus } from "@/lib/ai/config";
import { StarryDock } from "@/components/ai/StarryDock";
import { listDepartments } from "@/lib/db/departments";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { mfaRequiredForSessionAsync } from "@/lib/auth/mfa-policy";
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
  metadataBase: new URL(getConfiguredAppUrl() ?? "http://localhost:3000"),
  title: {
    default: "Northstar",
    template: "%s | Northstar"
  },
  description: "Northstar helps hiring teams move faster — from job posting to final offer, in one focused workspace.",
  icons: {
    icon: "/icon.svg"
  }
};

export const viewport: Viewport = {
  themeColor: "#07111f"
};

const themeInitScript = `
  try {
    const savedTheme = localStorage.getItem("northstar-theme") || localStorage.getItem("assessment-hub-theme");
    document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
  } catch {
    document.documentElement.dataset.theme = "light";
  }
`;

/**
 * Public-facing routes render their own chrome (PublicSiteFrame / full-screen shells),
 * so they must NOT get the authenticated app sidebar even when a session exists.
 */
function isPublicShellPath(pathname: string) {
  if (pathname === "/") return true;
  return ["/jobs", "/privacy", "/terms", "/login", "/upload", "/auth", "/invite", "/forgot-password", "/reset-password"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAppSession();
  const pathname = (await headers()).get("x-pathname") ?? "";
  const showSidebar = Boolean(session) && !isPublicShellPath(pathname);
  const brandCss = brandThemeCss();

  const [departments, starry] = await Promise.all([
    showSidebar ? listDepartments(false) : Promise.resolve([]),
    showSidebar ? getStarryStatus() : Promise.resolve(null)
  ]);
  const showStarry = Boolean(starry?.enabled);

  // MFA enrollment wall: when the org enforces 2FA (MFA_ENFORCEMENT), a user who
  // is required to use it but hasn't enrolled is redirected to the security page
  // until they do. The extra query runs only when enforcement is on AND the user
  // is in scope, and clears itself once they enroll (no lockout risk).
  if (showSidebar && session && session.userId && pathname !== "/account/security" && await mfaRequiredForSessionAsync(session)) {
    const mfaUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { mfaEnabled: true }
    });
    if (mfaUser && !mfaUser.mfaEnabled) {
      redirect("/account/security?enroll=required");
    }
  }

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable} bg-[color:var(--app-bg)] text-[color:var(--app-text)]`}>
        <a href="#main-content" className="absolute -left-full top-0 z-50 bg-[color:var(--app-brand)] p-2 text-white focus:left-0">
          Skip to main content
        </a>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {brandCss ? <style dangerouslySetInnerHTML={{ __html: brandCss }} /> : null}
        <MotionProvider>
          {showSidebar && session ? (
            /* ── Authenticated app routes: full sidebar layout ── */
            <div className="min-h-screen bg-[radial-gradient(circle_at_top,var(--app-bg-accent-top),transparent_28%),linear-gradient(180deg,var(--app-bg),var(--app-bg))] text-[color:var(--app-text)] md:flex">
              <WorkspaceRail
                viewer={{ email: session.email, name: session.name, roleId: session.roleId, permissions: session.permissions, departmentId: session.departmentId }}
                departments={departments}
              />
              <div className="min-w-0 flex-1">
                <header className="northstar-ribbon-shell sticky top-0 z-30 border-b border-[color:var(--app-header-border)] bg-[color:var(--app-header-bg)] backdrop-blur-xl md:hidden">
                  <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
                    <Link href="/" className="transition hover:opacity-95">
                      <AppLogo compact />
                    </Link>
                    <div className="flex items-center gap-2">
                      <NotificationBell />
                      <CommandPaletteTrigger />
                    </div>
                    <MainNav
                      viewer={{ email: session.email, name: session.name, permissions: session.permissions, departmentId: session.departmentId }}
                      departments={departments}
                    />
                  </nav>
                </header>
                <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">{children}</main>
              </div>
              <ThemeToggle />
              <CommandPalette />
              <StarryDock configured={showStarry} />
            </div>
          ) : (
            /* ── Public routes (and unauthenticated): no sidebar, full-width ── */
            <div className="min-h-screen bg-[radial-gradient(circle_at_top,var(--app-bg-accent-top),transparent_28%),linear-gradient(180deg,var(--app-bg),var(--app-bg))] text-[color:var(--app-text)]">
              <main id="main-content">{children}</main>
              <ThemeToggle />
            </div>
          )}
        </MotionProvider>
      </body>
    </html>
  );
}
