import { CheckCircle2, X } from "lucide-react";

export function Notice({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4 rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
      <span className="flex items-center gap-2">
        <CheckCircle2 className="size-5" />
        {message}
      </span>
      {onClose ? (
        <button type="button" aria-label="Chiudi notifica" onClick={onClose}>
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
