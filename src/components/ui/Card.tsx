import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "advisor" | "mission";

type CardProps = {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
};

const variantClass: Record<CardVariant, string> = {
  default: "border-border bg-card text-card-foreground shadow-sm",
  advisor:
    "border-teal-900/40 bg-stone-950 text-stone-100 shadow-lg ring-1 ring-teal-500/15",
  mission:
    "border-border border-l-[3px] border-l-primary bg-card text-card-foreground shadow-sm",
};

export function Card({
  children,
  className,
  variant = "default",
}: CardProps) {
  return (
    <section className={cn("rounded-xl border p-3.5", variantClass[variant], className)}>
      {children}
    </section>
  );
}
