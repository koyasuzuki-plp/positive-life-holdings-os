import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardHeaderProps = {
  label?: string;
  title: string;
  action?: ReactNode;
  dark?: boolean;
};

export function CardHeader({ label, title, action, dark }: CardHeaderProps) {
  return (
    <div className="mb-2 flex items-start justify-between gap-2">
      <div className="min-w-0">
        {label && (
          <p
            className={cn(
              "text-[10px] font-medium tracking-wider uppercase",
              dark ? "text-teal-400/80" : "text-muted-foreground",
            )}
          >
            {label}
          </p>
        )}
        <h2
          className={cn(
            "text-sm font-semibold leading-snug",
            dark ? "text-stone-50" : "text-card-foreground",
          )}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
