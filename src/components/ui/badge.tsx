import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[999px] border border-line bg-slate-50 px-2.5 py-1 text-xs font-bold text-muted",
        className
      )}
      {...props}
    />
  );
}
