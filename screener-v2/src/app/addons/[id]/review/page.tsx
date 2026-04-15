import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { ResultReviewSections } from "@/components/results/ResultReviewSections";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { buildDraftFromAddon, getAddonCatalogEntry } from "@/lib/addons/catalog";
import { getAddonAssessmentType, getAddonAssessmentTypeMeta } from "@/lib/addons/assessment-types";
import { requirePageSession } from "@/lib/auth/guards";
import { buildReviewSectionsFromBlueprint } from "@/lib/exams/review";
import { resolveExamBlueprint } from "@/lib/exams/resolve";

export const dynamic = "force-dynamic";

export default async function AddonReviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePageSession(`/addons/${id}/review`);

  const addon = await getAddonCatalogEntry(id);
  if (!addon) {
    notFound();
  }

  const addonType = getAddonAssessmentTypeMeta(addon.assessmentTypeId);
  const addonTypeEntry = getAddonAssessmentType(addon.assessmentTypeId);
  const sections = addonTypeEntry
    ? buildReviewSectionsFromBlueprint(
        resolveExamBlueprint({
          drafts: [buildDraftFromAddon(addon)],
          passPercent: addon.defaultRequiredPercent
        })
      )
    : [];
  const questionCount = sections.reduce((total, section) => total + section.items.length, 0);

  return (
    <SceneTransition>
      <SceneShell
        variant="results"
        tone="page"
        eyebrow="Add-on Review"
        title={addon.label}
        subtitle={addon.description}
        utility={
          <div className="flex flex-wrap gap-2">
            <Link href="/addons">
              <Button variant="secondary">Back to Add-ons</Button>
            </Link>
            <StatusPill label={addonType.label} tone={addonType.tone} />
            <StatusPill label={`${questionCount} questions`} tone="neutral" />
          </div>
        }
      >
        <div className="space-y-5">
          <StagePanel tone="summary" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusPill label={`${addon.defaultDurationMinutes} min`} tone="neutral" />
              <StatusPill label={`${addon.defaultRequiredPercent}% pass`} tone="neutral" />
              <StatusPill label={`${addon.defaultWeight}/100 weight`} tone="neutral" />
              <StatusPill
                label={addon.isActive ? "Active" : "Inactive"}
                tone={addon.isActive ? "emerald" : "amber"}
              />
            </div>
            <p className="text-sm leading-6 text-[color:var(--app-text)]">
              Review the resolved question set and expected answers for this add-on&apos;s current
              default configuration.
            </p>
          </StagePanel>

          {addonTypeEntry ? (
            <ResultReviewSections sections={sections} mode="answer_key" />
          ) : (
            <StagePanel className="space-y-3">
              <h2 className="text-2xl text-[color:var(--app-heading)]">Review unavailable</h2>
              <p className="text-sm leading-6 text-[color:var(--app-text)]">
                This add-on references an assessment type that this app build does not recognize yet.
                Refresh or redeploy the app before reviewing its questions and answers.
              </p>
            </StagePanel>
          )}
        </div>
      </SceneShell>
    </SceneTransition>
  );
}
