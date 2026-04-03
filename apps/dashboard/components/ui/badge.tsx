import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  base: "inline-flex items-center px-2.5 py-1 text-xs font-semibold",
  variants: {
    default: "bg-[#d4c19a] text-black",
    secondary: "bg-muted text-muted-foreground",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
    refunded: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400"
  }
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants.variants;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants.base, badgeVariants.variants[variant], className)}
      {...props}
    />
  );
}

export { Badge };
