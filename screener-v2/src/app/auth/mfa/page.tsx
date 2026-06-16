import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyMfaChallengeToken, MFA_CHALLENGE_COOKIE } from "@/lib/auth/mfa-session";
import { brandLogoFull } from "@/lib/brand/theme";
import Image from "next/image";

export const metadata: Metadata = { title: "Two-Factor Authentication" };

export default async function MfaChallengePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const challengeToken = cookieStore.get(MFA_CHALLENGE_COOKIE)?.value;
  const challenge = await verifyMfaChallengeToken(challengeToken);

  if (!challenge) redirect("/login");

  const email = challenge.email;
  const maskedEmail = email.replace(/(.{2}).+(@.+)/, "$1…$2");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-[400px] space-y-7">

        {/* Branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src={brandLogoFull()}
            alt="Northstar"
            width={700}
            height={150}
            priority
            className="pub-wordmark h-9 w-auto"
          />
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--pub-muted)]">
            Two-factor authentication
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-8 py-8 shadow-[0_8px_32px_rgba(10,35,54,0.12),0_2px_8px_rgba(10,35,54,0.05)]">

          {/* Shield icon */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--app-brand)]/10">
              <svg className="h-7 w-7 text-[color:var(--app-brand)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          </div>

          <div className="mb-6 space-y-1 text-center">
            <h1 className="text-[20px] font-semibold leading-tight text-[color:var(--app-heading)]">
              Verify your identity
            </h1>
            <p className="text-sm text-[color:var(--app-muted)]">
              Enter the 6-digit code from your authenticator app for <span className="font-medium text-[color:var(--app-text)]">{maskedEmail}</span>
            </p>
          </div>

          {params.error && (
            <div className="mb-4 rounded-lg border border-[color:var(--app-danger-soft)] bg-[color:var(--app-danger-soft)] px-4 py-3 text-sm text-[color:var(--app-danger)]">
              {params.error}
            </div>
          )}

          <form action="/api/auth/mfa/challenge" method="post" className="space-y-5">

            {/* Code input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[color:var(--app-text)]" htmlFor="code">
                Authenticator code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                placeholder="000 000"
                maxLength={7}
                className="w-full rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-center text-xl font-mono tracking-[0.3em] text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] placeholder:tracking-[0.3em] outline-none transition focus:border-[color:var(--app-brand)] focus:ring-2 focus:ring-[color:var(--app-brand-soft)]"
              />
            </div>

            {/* Trust device */}
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="trustDevice"
                value="true"
                className="mt-0.5 h-4 w-4 rounded border-[color:var(--app-border)] accent-[color:var(--app-brand)]"
              />
              <span className="text-sm text-[color:var(--app-muted)]">
                Trust this device for 30 days
              </span>
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-[color:var(--app-brand)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--app-brand-strong)] active:scale-[0.99]"
            >
              Verify →
            </button>

          </form>

          {/* Backup code toggle */}
          <details className="mt-4 group">
            <summary className="cursor-pointer list-none text-center text-sm text-[color:var(--app-muted)] hover:text-[color:var(--app-text)] transition-colors">
              Use a backup code instead
            </summary>
            <div className="mt-3">
              <form action="/api/auth/mfa/challenge" method="post" className="space-y-3">
                <input
                  name="code"
                  type="text"
                  placeholder="XXXX-XXXX"
                  autoCapitalize="characters"
                  className="w-full rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2.5 text-center font-mono text-sm tracking-widest text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] outline-none transition focus:border-[color:var(--app-brand)] focus:ring-2 focus:ring-[color:var(--app-brand-soft)]"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2.5 text-sm font-medium text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]"
                >
                  Use backup code
                </button>
              </form>
            </div>
          </details>

        </div>

        <p className="text-center text-[11px] leading-5 text-[color:var(--pub-muted)]">
          <a href="/login" className="hover:text-[color:var(--app-text)] underline underline-offset-2 transition-colors">
            ← Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}
