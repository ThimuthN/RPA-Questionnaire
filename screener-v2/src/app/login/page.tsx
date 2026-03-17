import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <SceneShell
      variant="run"
      eyebrow="Login"
      title="Sign in"
      subtitle="Use your internal account to manage assessments, view results, and administer users."
    >
      <div className="mx-auto max-w-xl">
        <StagePanel className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl text-white">Internal access</h2>
            <p className="text-sm text-slate-300">Use your email as the username for sign in.</p>
          </div>

          <form action="/api/auth/login" method="post" className="space-y-3">
            <input type="hidden" name="next" value={params.next || "/create-test"} />
            <div className="grid gap-1">
              <label className="text-sm text-slate-200" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                placeholder="admin@company.com"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-slate-200" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </div>
            {params.error ? <p className="text-sm text-red-200">{params.error}</p> : null}
            <Button type="submit">Sign in</Button>
          </form>
        </StagePanel>
      </div>
    </SceneShell>
  );
}
