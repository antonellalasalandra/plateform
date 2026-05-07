import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[6px] border border-line bg-white px-3 text-sm font-medium text-ink outline-none transition placeholder:text-muted focus:border-slate-400 focus:ring-2 focus:ring-slate-100",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-[6px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm font-medium text-ink outline-none transition placeholder:text-muted focus:border-slate-400 focus:ring-2 focus:ring-slate-100",
        className
      )}
      {...props}
    />
  );
}
