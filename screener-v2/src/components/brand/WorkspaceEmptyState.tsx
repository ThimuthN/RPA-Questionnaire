import Image from "next/image";

export function WorkspaceEmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="shrink-0 rounded-[24px] border border-white/10 bg-black/20 p-3">
          <Image src="/icon.svg" alt="" width={72} height={72} className="block" />
        </div>
        <div className="space-y-2">
          <p className="text-lg text-white">{title}</p>
          <p className="max-w-md text-sm leading-6 text-slate-300">{description}</p>
        </div>
      </div>
    </div>
  );
}
