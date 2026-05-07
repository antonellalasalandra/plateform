import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-[6px] px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-ink text-white hover:bg-slate-800",
        variant === "secondary" && "bg-slate-100 text-ink hover:bg-slate-200",
        variant === "outline" && "border border-line bg-white text-ink hover:bg-slate-50",
        variant === "ghost" && "bg-transparent text-ink hover:bg-slate-100",
        className
      )}
      {...props}
    />
  );
}
