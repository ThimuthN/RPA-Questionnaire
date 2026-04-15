import Image from "next/image";

export function WorkspaceEmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] p-6 shadow-[var(--app-shadow-soft)]">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="shrink-0 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-3">
          <Image src="/icon.svg" alt="" width={72} height={72} className="block" />
        </div>
        <div className="space-y-2">
          <p className="text-lg text-[color:var(--app-heading)]">{title}</p>
          <p className="max-w-md text-sm leading-6 text-[color:var(--app-text)]">{description}</p>
        </div>
      </div>
    </div>
  );
}
