"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdvisorMessage } from "./AdvisorMessage";
import { AppShell } from "./AppShell";
import { HabitCheckList, HabitEditLink } from "./HabitCheckList";
import { MonthlyFocus } from "./MonthlyFocus";
import { MoodPicker } from "./MoodPicker";
import { PriorityActionCard } from "./PriorityActionCard";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";
import { formatDisplayDate, greeting } from "@/lib/date";
import { MOOD_LABELS, type PriorityAction } from "@/lib/types";
import { useAppState } from "@/hooks/useAppState";

export function TodayPage() {
  const {
    state,
    ready,
    today,
    todayLog,
    todayPriority,
    habitDoneCount,
    toggleHabit,
    setMood,
    savePriorityAction,
  } = useAppState();

  const [executionOpen, setExecutionOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logComplete =
    todayLog?.mood != null && todayLog?.energy != null;
  const allHabitsDone = habitDoneCount === state.habits.length;
  const total = state.habits.length;

  const handlePriorityChange = useCallback(
    (action: PriorityAction) => savePriorityAction(today, action),
    [savePriorityAction, today],
  );

  if (!mounted || !ready) {
    return (
      <AppShell title="今日" subtitle="読み込み中…">
        <div className="flex min-h-32 items-center justify-center text-muted-foreground">
          …
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="今日" subtitle={`${greeting()} · ${formatDisplayDate()}`}>
      <div className="space-y-3">
        <MonthlyFocus focus={state.monthlyFocus} />

        <AdvisorMessage
          monthlyFocus={state.monthlyFocus}
          habits={state.habits}
          habitChecks={state.habitChecks}
          today={today}
          habitDoneCount={habitDoneCount}
          todayLog={todayLog}
          priorityAction={todayPriority}
          nextHabitName={state.habits.find(
            (h) => !state.habitChecks[`${today}:${h.id}`],
          )?.name}
        />

        <PriorityActionCard
          value={todayPriority}
          onChange={handlePriorityChange}
        />

        <Card>
          <button
            type="button"
            onClick={() => setExecutionOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <div>
              <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                実行
              </p>
              <p className="text-sm font-semibold text-card-foreground">
                習慣と気分
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                習慣 {habitDoneCount}/{total}
                {todayLog?.mood
                  ? ` · 気分 ${MOOD_LABELS[todayLog.mood]}`
                  : ""}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {executionOpen ? "閉じる" : "開く"}
            </span>
          </button>

          {executionOpen && (
            <div className="mt-3 space-y-3 border-t border-border pt-3">
              <div className="flex justify-end">
                <HabitEditLink />
              </div>
              <HabitCheckList
                habits={state.habits}
                checked={state.habitChecks}
                today={today}
                onToggle={toggleHabit}
              />
              {allHabitsDone && (
                <p className="text-center text-xs text-primary">習慣クリア</p>
              )}
              <div>
                <p className="mb-2 text-[11px] text-muted-foreground">気分</p>
                <MoodPicker
                  value={todayLog?.mood ?? null}
                  onChange={setMood}
                  compact
                />
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader label="締め" title="夜の振り返り" />
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            {logComplete
              ? `記録済み${todayLog?.energy ? ` · エネルギー ${todayLog.energy}/5` : ""}`
              : "進捗・感謝・明日の一手を記録"}
          </p>
          <Link
            href="/log"
            className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground active:opacity-90"
          >
            {logComplete ? "振り返りを見る" : "振り返りを記録"}
          </Link>
        </Card>
      </div>
    </AppShell>
  );
}
