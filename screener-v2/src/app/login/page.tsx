import type { Metadata } from "next";
import type { Route } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/app-session";
import { sanitizeNextPath } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in"
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const session = await getAppSession();

  if (session) {
    redirect(sanitizeNextPath(params.next) as Route);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-[400px] space-y-7">

        {/* Branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/brand/northstar-logo-clean.png"
            alt="Northstar"
            width={700}
            height={150}
            priority
            className="pub-wordmark h-9 w-auto"
          />
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--pub-muted)]">
            Internal access
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-8 py-8 shadow-[0_8px_32px_rgba(10,35,54,0.12),0_2px_8px_rgba(10,35,54,0.05)]">

          <div className="mb-6 space-y-1">
            <h1 className="text-[22px] font-semibold leading-tight text-[color:var(--app-heading)]">Sign in</h1>
            <p className="text-sm text-[color:var(--app-muted)]">Use your company credentials to continue.</p>
          </div>

          <form action="/api/auth/login" method="post" className="space-y-4">
            <input type="hidden" name="next" value={params.next || "/departments"} />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[color:var(--app-text)]" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2.5 text-sm text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] outline-none transition focus:border-[color:var(--app-brand)] focus:ring-2 focus:ring-[color:var(--app-brand-soft)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[color:var(--app-text)]" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                className="w-full rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-[color:var(--app-brand)] focus:ring-2 focus:ring-[color:var(--app-brand-soft)]"
              />
            </div>

            {params.error ? (
              <div className="rounded-lg border border-[color:var(--app-danger-soft)] bg-[color:var(--app-danger-soft)] px-4 py-3 text-sm text-[color:var(--app-danger)]">
                {params.error}
              </div>
            ) : null}

            <button
              type="submit"
              className="mt-1 w-full rounded-xl bg-[color:var(--app-brand)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--app-brand-strong)] active:scale-[0.99]"
            >
              Sign in →
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] leading-5 text-[color:var(--pub-muted)]">
          Northstar · Internal access only<br />
          Contact your administrator if you need help signing in.
        </p>
      </div>
    </div>
  );
}
