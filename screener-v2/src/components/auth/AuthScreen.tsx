import type { ReactNode } from "react";
import Image from "next/image";

/**
 * Shared centered, branded shell for the unauthenticated auth screens
 * (invite acceptance, forgot/reset password). Matches the /login aesthetic.
 */
export function AuthScreen({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-[420px] space-y-7">
        <div className="flex justify-center">
          <Image
            src="/brand/northstar-logo-clean.png"
            alt="Northstar"
            width={700}
            height={150}
            priority
            className="pub-wordmark h-9 w-auto"
          />
        </div>

        <div className="rounded-2xl border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-8 py-8 shadow-[0_8px_32px_rgba(10,35,54,0.12),0_2px_8px_rgba(10,35,54,0.05)]">
          <div className="mb-6 space-y-1">
            <h1 className="text-[22px] font-semibold leading-tight text-[color:var(--app-heading)]">{title}</h1>
            {subtitle ? <p className="text-sm text-[color:var(--app-muted)]">{subtitle}</p> : null}
          </div>
          {children}
        </div>

        {footer ? <div className="text-center text-[12px] text-[color:var(--pub-muted)]">{footer}</div> : null}
      </div>
    </div>
  );
}
