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
      <div className="rounded-[24px] border border-white/12 bg-white/[0.04] p-6 text-sm text-slate-300">
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
        eyebrow="Add-ons"
        title="Add-on library"
        subtitle="Manage global add-on defaults and simple presets."
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
