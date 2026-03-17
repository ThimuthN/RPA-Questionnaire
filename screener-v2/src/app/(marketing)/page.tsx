import Link from "next/link";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { HeroScene } from "@/components/motion/HeroScene";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { getSession } from "@/lib/auth/session";
import { copy } from "@/lib/design/copy";

export default async function MarketingHomePage() {
  const session = await getSession();
  const createHref = session ? "/create-test" : "/login?next=/create-test";

  return (
    <SceneTransition>
      <SceneShell
        variant="create"
        eyebrow="Role-aware technical assessment"
        title={copy.landing.headline}
        subtitle={copy.landing.subtext}
      >
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Link href={createHref}>
                <Button>{copy.landing.primaryCta}</Button>
              </Link>
              <Link href="/run-test">
                <Button variant="secondary">{copy.landing.secondaryCta}</Button>
              </Link>
            </div>
          </div>
          <HeroScene className="min-h-[320px]" />
        </div>
      </SceneShell>
    </SceneTransition>
  );
}
