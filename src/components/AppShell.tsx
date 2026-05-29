import { type ReactNode } from "react";
import { BottomNav } from "./BottomNav";

type AppShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  hideNav?: boolean;
};

export function AppShell({
  children,
  title,
  subtitle,
  hideNav = false,
}: AppShellProps) {
  return (
    <div className={`mx-auto min-h-dvh max-w-md ${hideNav ? "pb-24" : "pb-[4.5rem]"}`}>
      {(title || subtitle) && (
        <header className="px-4 pt-5 pb-1">
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {title && (
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          )}
        </header>
      )}
      <main className="px-4 py-2">{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
