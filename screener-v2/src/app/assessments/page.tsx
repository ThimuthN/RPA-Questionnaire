import Link from "next/link";
import type { Route } from "next";
import { Zap, Library, BarChart3 } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { requirePageSession } from "@/lib/auth/guards";

interface HubCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: Route;
  label: string;
}

export default async function AssessmentsPage() {
  await requirePageSession("/assessments");

  const cards: HubCard[] = [
    {
      title: "Create assessment",
      description: "Create or assign a screening assessment for a candidate.",
      icon: <Zap className="h-6 w-6" />,
      href: "/create-test" as Route,
      label: "Create assessment"
    },
    {
      title: "Assessment templates",
      description: "Manage reusable assessment templates and question sets.",
      icon: <Library className="h-6 w-6" />,
      href: "/addons" as Route,
      label: "View templates"
    },
    {
      title: "Assessment results",
      description: "Review completed assessment evidence and candidate results.",
      icon: <BarChart3 className="h-6 w-6" />,
      href: "/results" as Route,
      label: "View results"
    }
  ];

  return (
    <SceneTransition>
      <SceneShell
        variant="create"
        tone="page"
        eyebrow="Assessments"
        title="Assessment hub"
        subtitle="Manage screening evidence for candidates."
      >
        <div className="space-y-5">
          <StagePanel className="space-y-4 overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_16%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]">
            <div className="space-y-2">
              <p className="text-sm text-[color:var(--app-text)]">
                Use assessments to create screening evidence for candidates. Assessment results should support hiring decisions; they should not automatically decide outcomes.
              </p>
            </div>
          </StagePanel>

          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
            {cards.map((card) => (
              <Link key={card.href} href={card.href}>
                <div className="group h-full rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)] hover:shadow-[var(--app-shadow-soft)]">
                  <div className="space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--app-brand)]/10 text-[color:var(--app-brand)] transition group-hover:bg-[color:var(--app-brand)]/20">
                      {card.icon}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-[color:var(--app-heading)]">{card.title}</h3>
                      <p className="text-sm text-[color:var(--app-text)]">{card.description}</p>
                    </div>
                    <div className="pt-2">
                      <Button variant="secondary" className="w-full">
                        {card.label}
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </SceneShell>
    </SceneTransition>
  );
}
