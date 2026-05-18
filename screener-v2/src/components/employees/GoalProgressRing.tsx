export interface GoalProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

export function GoalProgressRing({ progress, size = 48, strokeWidth = 3 }: GoalProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[color:var(--app-border)]"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-[color:var(--app-brand)] transition-all duration-300"
        />
      </svg>
      <span className="text-[11px] font-mono font-medium text-[color:var(--app-text)]">
        {progress}%
      </span>
    </div>
  );
}
