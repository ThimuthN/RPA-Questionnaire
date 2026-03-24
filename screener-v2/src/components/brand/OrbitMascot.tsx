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
      <div className="brand-orbit absolute inset-[6%] rounded-full border border-brand-300/25" />
      <div className="brand-orbit-reverse absolute inset-[18%] rounded-full border border-teal-400/20" />
      <div className="brand-float absolute inset-[12%] rounded-[34%] bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.92),rgba(138,184,255,0.7)_20%,rgba(47,134,255,0.88)_52%,rgba(11,18,32,0.96)_100%)] shadow-[0_18px_44px_rgba(31,111,255,0.34)]" />
      <div className="absolute inset-[26%] rounded-[36%] border border-white/10 bg-[linear-gradient(180deg,rgba(4,10,20,0.22),rgba(5,11,22,0.82))] backdrop-blur-md">
        <div className="absolute left-[22%] top-[34%] h-[14%] w-[14%] rounded-full bg-slate-950 shadow-[0_0_0_5px_rgba(255,255,255,0.15)]" />
        <div className="absolute right-[22%] top-[34%] h-[14%] w-[14%] rounded-full bg-slate-950 shadow-[0_0_0_5px_rgba(255,255,255,0.15)]" />
        <div className="absolute left-1/2 top-[58%] h-[10%] w-[28%] -translate-x-1/2 rounded-full border-b-2 border-white/75" />
      </div>
      <div className="absolute left-[50%] top-[3%] h-[18%] w-[18%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.96),rgba(138,184,255,0.88)_42%,rgba(18,179,168,0.76)_100%)] shadow-[0_0_18px_rgba(138,184,255,0.4)]" />
      {spark ? (
        <>
          <div className="brand-spark absolute left-[4%] top-[22%] h-[10%] w-[10%] rounded-full bg-white/80" />
          <div className="brand-spark absolute bottom-[18%] right-[4%] h-[8%] w-[8%] rounded-full bg-teal-300/80 [animation-delay:240ms]" />
        </>
      ) : null}
    </div>
  );
}
