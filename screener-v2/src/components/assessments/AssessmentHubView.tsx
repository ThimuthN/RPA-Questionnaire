import Link from "next/link";
import type { Route } from "next";
import { BarChart3, Library, Zap } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { StagePanel } from "@/components/scene/StagePanel";

type AssessmentHubViewProps = {
  workspaceId?: string;
  workspaceName?: string;
};

type HubCard = {
  title: string;
  description: string;
  href: Route;
  icon: React.ReactNode;
  label: string;
};

function buildWorkspaceHref(path: "/create-test" | "/addons" | "/results", workspaceId?: string): Route {
  if (!workspaceId) {
    return path as Route;
  }

  return `${path}?workspaceId=${workspaceId}` as Route;
}

export function AssessmentHubView({
  workspaceId,
  workspaceName
}: AssessmentHubViewProps) {
  const cards: HubCard[] = [
    {
      title: "Create assessment",
      description: workspaceId
        ? "Build an assessment with shared add-ons and presets available to this workspace."
        : "Create or assign a screening assessment for a candidate.",
      href: buildWorkspaceHref("/create-test", workspaceId),
      icon: <Zap className="h-6 w-6" />,
      label: "Create assessment"
    },
    {
      title: "Assessment templates",
      description: workspaceId
        ? "Browse shared add-ons, then create and manage presets for this workspace."
        : "Manage reusable assessment templates and question sets.",
      href: buildWorkspaceHref("/addons", workspaceId),
      icon: <Library className="h-6 w-6" />,
      label: "View templates"
    },
    {
      title: "Assessment results",
      description: workspaceId
        ? "Review completed assessment evidence for candidates in this workspace."
        : "Review completed assessment evidence and candidate results.",
      href: buildWorkspaceHref("/results", workspaceId),
      icon: <BarChart3 className="h-6 w-6" />,
      label: "View results"
    }
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--app-brand)]">
          {workspaceName ?? "Assessments"}
        </p>
        <div className="space-y-2">
          <h2 className="font-display text-4xl leading-[0.96] text-[color:var(--app-heading)] md:text-5xl">
            Assessment hub
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-[color:var(--app-muted)]">
            {workspaceId
              ? "Use the same assessment system with shared add-ons, workspace-specific presets, and scoped result views."
              : "Manage screening evidence for candidates."}
          </p>
        </div>
      </div>

      <StagePanel className="space-y-4 overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_16%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]">
        <p className="text-sm text-[color:var(--app-text)]">
          {workspaceId
            ? "Shared add-ons stay centralized. Workspace presets and result views stay scoped to the selected department."
            : "Use assessments to create screening evidence for candidates. Assessment results should support hiring decisions; they should not automatically decide outcomes."}
        </p>
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
  );
}
