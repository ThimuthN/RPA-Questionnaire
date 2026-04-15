import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-12 w-12",
  md: "h-20 w-20",
  lg: "h-28 w-28",
  xl: "h-40 w-40"
} as const;

export function OrbitMascot({
  className,
  size = "lg",
  spark = true
}: {
  className?: string;
  size?: keyof typeof sizeClasses;
  spark?: boolean;
}) {
  return (
    <div className={cn("relative isolate", sizeClasses[size], className)}>
      <div className="brand-orbit absolute inset-[6%] rounded-full border border-[color:color-mix(in_srgb,var(--app-brand)_28%,transparent)]" />
      <div className="brand-orbit-reverse absolute inset-[18%] rounded-full border border-[color:color-mix(in_srgb,var(--teal-500)_24%,transparent)]" />
      <div className="brand-float absolute inset-[12%] rounded-[34%] bg-[radial-gradient(circle_at_32%_28%,color-mix(in_srgb,var(--app-surface)_96%,white),color-mix(in_srgb,var(--blue-300)_72%,var(--app-brand-soft))_20%,color-mix(in_srgb,var(--blue-500)_82%,var(--app-brand))_52%,color-mix(in_srgb,var(--app-heading)_88%,var(--blue-600))_100%)] shadow-[0_18px_44px_color-mix(in_srgb,var(--blue-500)_28%,transparent)]" />
      <div className="brand-face absolute inset-[26%] rounded-[36%] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-surface)_92%,white),color-mix(in_srgb,var(--app-control-bg)_90%,var(--app-surface-soft)))] backdrop-blur-md">
        <div className="brand-eye absolute left-[22%] top-[34%] h-[14%] w-[14%] rounded-full bg-[color:var(--app-heading)] shadow-[0_0_0_5px_color-mix(in_srgb,var(--app-surface)_72%,transparent)]" />
        <div className="brand-eye absolute right-[22%] top-[34%] h-[14%] w-[14%] rounded-full bg-[color:var(--app-heading)] shadow-[0_0_0_5px_color-mix(in_srgb,var(--app-surface)_72%,transparent)] [animation-delay:120ms]" />
        <div className="brand-mouth absolute left-1/2 top-[58%] h-[10%] w-[28%] -translate-x-1/2 rounded-full border-b-2 border-[color:color-mix(in_srgb,var(--app-heading)_78%,transparent)]" />
      </div>
      <div className="absolute left-[50%] top-[3%] h-[18%] w-[18%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--app-surface)_96%,white),color-mix(in_srgb,var(--blue-300)_84%,var(--app-brand-soft))_42%,color-mix(in_srgb,var(--teal-500)_70%,var(--app-brand))_100%)] shadow-[0_0_18px_color-mix(in_srgb,var(--blue-300)_36%,transparent)]" />
      {spark ? (
        <>
          <div className="brand-spark absolute left-[4%] top-[22%] h-[10%] w-[10%] rounded-full bg-[color:color-mix(in_srgb,var(--app-surface)_84%,white)]" />
          <div className="brand-spark absolute bottom-[18%] right-[4%] h-[8%] w-[8%] rounded-full bg-[color:color-mix(in_srgb,var(--teal-500)_76%,var(--app-brand))] [animation-delay:240ms]" />
        </>
      ) : null}
    </div>
  );
}
