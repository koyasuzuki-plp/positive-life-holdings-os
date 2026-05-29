"use client";

import { useEffect, useState } from "react";
import { AppShell } from "./AppShell";
import { DailyLogForm } from "./DailyLogForm";
import { formatDisplayDate } from "@/lib/date";
import { createEmptyLog } from "@/lib/log";
import { useAppState } from "@/hooks/useAppState";

export function LogPage() {
  const { ready, today, todayLog, saveLog } = useAppState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initial = todayLog ?? createEmptyLog(today);

  if (!mounted || !ready) {
    return (
      <AppShell title="記録" subtitle="読み込み中…">
        <div className="flex min-h-40 items-center justify-center text-muted-foreground">
          …
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="夜の振り返り" subtitle={formatDisplayDate()}>
      <p className="mb-4 text-sm text-muted-foreground">
        1日の締めくくりとして、進捗とエネルギーを記録します。
      </p>
      <DailyLogForm date={today} initial={initial} onSave={saveLog} />
    </AppShell>
  );
}
