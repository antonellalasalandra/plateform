import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Segmented({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex rounded-[6px] bg-slate-100 p-1", className)} {...props} />;
}

export function Segment({
  active,
  className,
  ...props
}: HTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "h-10 rounded-[5px] px-4 text-sm font-bold text-muted transition",
        active && "bg-white text-ink shadow-sm",
        className
      )}
      {...props}
    />
  );
}
