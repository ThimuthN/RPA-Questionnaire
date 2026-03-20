import { cn } from "@/lib/utils";

export function ChoicePills({
  name,
  options,
  defaultValue,
  idPrefix,
  required = false,
  className
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  idPrefix: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option, index) => {
        const id = `${idPrefix}-${option.value}`;

        return (
          <div key={option.value}>
            <input
              id={id}
              name={name}
              type="radio"
              value={option.value}
              defaultChecked={defaultValue === option.value}
              required={required && index === 0}
              className="peer sr-only"
            />
            <label
              htmlFor={id}
              className="inline-flex cursor-pointer items-center rounded-full border border-white/16 bg-white/[0.05] px-3 py-2 text-sm text-slate-200 transition hover:border-white/30 hover:bg-white/[0.08] peer-checked:border-brand-300/60 peer-checked:bg-brand-500/15 peer-checked:text-white"
            >
              {option.label}
            </label>
          </div>
        );
      })}
    </div>
  );
}
