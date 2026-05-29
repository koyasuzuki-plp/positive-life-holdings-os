import { type ReactNode } from "react";

type StickyFooterProps = {
  children: ReactNode;
};

export function StickyFooter({ children }: StickyFooterProps) {
  return (
    <div className="fixed right-0 bottom-0 left-0 z-10 border-t border-border bg-card/95 px-4 py-3 backdrop-blur safe-bottom">
      <div className="mx-auto max-w-md">{children}</div>
    </div>
  );
}
