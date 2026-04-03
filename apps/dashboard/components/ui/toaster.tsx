"use client";

import { useEffect } from "react";
import { useToast, dismissToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const variantStyles = {
  default: "border-slate-200 bg-white text-slate-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800"
};

export function Toaster() {
  const { toasts } = useToast();

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => dismissToast(toast.id), 6000)
    );
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [toasts]);

  return (
    <div className="fixed right-6 top-6 z-[60] flex w-[320px] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "border px-4 py-3 text-sm shadow-lg",
            variantStyles[toast.variant ?? "default"]
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-xs opacity-80">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="p-1 transition hover:bg-black/5"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
