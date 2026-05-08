"use client";

import { cn } from "@/lib/utils";

export type SegmentOption<T extends string = string> = {
  label: string;
  value: T;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-[6px] bg-slate-100 p-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "h-10 rounded-[5px] px-4 text-sm font-bold text-muted transition hover:text-ink",
            value === option.value && "bg-white text-ink shadow-sm"
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
