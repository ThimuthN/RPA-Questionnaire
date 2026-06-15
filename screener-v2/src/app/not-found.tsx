import Link from "next/link";
import { AppLogo } from "@/components/brand/AppLogo";
import { Button } from "@/components/primitives/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <AppLogo pubStyle />
      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--pub-brand)]">
        404
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-[color:var(--app-heading)] sm:text-4xl">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[color:var(--app-muted)]">
        The page you&apos;re looking for may have moved or no longer exists.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link href="/jobs">
          <Button>Browse open roles</Button>
        </Link>
        <Link href="/">
          <Button variant="secondary">Back to home</Button>
        </Link>
      </div>
    </div>
  );
}
