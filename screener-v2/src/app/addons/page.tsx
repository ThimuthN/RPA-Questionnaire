import dynamic from "next/dynamic";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { SceneShell } from "@/components/scene/SceneShell";
import { StatusPill } from "@/components/primitives/StatusPill";
import { requirePageSession } from "@/lib/auth/guards";
import { listAddonCatalog, listAssessmentPresets } from "@/lib/addons/catalog";

const AddonLibraryClient = dynamic(
  () => import("@/components/addons/AddonLibraryClient").then((mod) => mod.AddonLibraryClient),
  {
    loading: () => (
      <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 text-sm text-[color:var(--app-muted)] shadow-[var(--app-shadow-soft)]">
        Loading add-on library...
      </div>
    )
  }
);

export default async function AddonsPage() {
  await requirePageSession("/addons");

  const [addons, presets] = await Promise.all([
    listAddonCatalog(true),
    listAssessmentPresets(true)
  ]);

  return (
    <SceneTransition>
      <SceneShell
        variant="create"
        tone="page"
        eyebrow="Add-ons"
        title="Add-on library"
        subtitle="Manage add-ons and presets."
        utility={
          <div className="flex flex-wrap gap-2">
            <StatusPill label={`${addons.length} add-ons`} tone="blue" />
            <StatusPill label={`${presets.length} presets`} tone="purple" />
          </div>
        }
      >
        <AddonLibraryClient initialAddons={addons} initialPresets={presets} />
      </SceneShell>
    </SceneTransition>
  );
}
