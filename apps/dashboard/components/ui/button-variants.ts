import { cn } from "@/lib/utils";

export const buttonVariants = {
  base:
    "inline-flex items-center justify-center gap-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50",
  default: "bg-primary text-primary-foreground hover:bg-primary/90 btn-glow",
  secondary: "bg-muted text-foreground hover:bg-muted/80",
  outline: "border border-border bg-background text-foreground hover:border-primary/30 hover:bg-muted/50",
  ghost: "text-foreground hover:bg-muted/50",
  destructive: "bg-rose-600 text-white hover:bg-rose-500",
  sizes: {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4",
    lg: "h-11 px-6 text-base",
    icon: "h-9 w-9"
  }
};

export type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export function getButtonClass(
  variant: ButtonVariant = "default",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(
    buttonVariants.base,
    buttonVariants[variant],
    buttonVariants.sizes[size],
    className
  );
}
