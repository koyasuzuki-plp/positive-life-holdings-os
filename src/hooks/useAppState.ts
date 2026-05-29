"use client";

import { useCallback, useEffect, useState } from "react";
import { todayKey } from "@/lib/date";
import { createEmptyLog } from "@/lib/log";
import { defaultState, loadState, saveState } from "@/lib/storage";
import type {
  AppState,
  DailyLog,
  Habit,
  MoodLevel,
  PriorityAction,
} from "@/lib/types";
import { emptyPriorityAction } from "@/lib/types";

export function useAppState() {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  const persist = useCallback((updater: AppState | ((prev: AppState) => AppState)) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveState(next);
      return next;
    });
  }, []);

  const toggleHabit = useCallback(
    (habitId: string) => {
      const key = `${todayKey()}:${habitId}`;
      persist((prev) => ({
        ...prev,
        habitChecks: {
          ...prev.habitChecks,
          [key]: !prev.habitChecks[key],
        },
      }));
    },
    [persist],
  );

  const setMood = useCallback(
    (mood: MoodLevel) => {
      const date = todayKey();
      persist((prev) => {
        const existing = prev.logs[date] ?? createEmptyLog(date);
        return {
          ...prev,
          logs: {
            ...prev.logs,
            [date]: { ...existing, mood },
          },
        };
      });
    },
    [persist],
  );

  const saveLog = useCallback(
    (log: DailyLog) => {
      persist((prev) => ({
        ...prev,
        logs: { ...prev.logs, [log.date]: log },
      }));
    },
    [persist],
  );

  const savePriorityAction = useCallback(
    (date: string, action: PriorityAction) => {
      persist((prev) => ({
        ...prev,
        priorityActions: { ...prev.priorityActions, [date]: action },
      }));
    },
    [persist],
  );

  const updateMonthlyFocus = useCallback(
    (monthlyFocus: string) => {
      persist((prev) => ({ ...prev, monthlyFocus }));
    },
    [persist],
  );

  const updateHabits = useCallback(
    (habits: Habit[]) => {
      persist((prev) => ({ ...prev, habits }));
    },
    [persist],
  );

  const today = todayKey();
  const todayLog = state.logs[today];
  const todayPriority = state.priorityActions[today] ?? emptyPriorityAction();
  const habitDoneCount = state.habits.filter(
    (h) => state.habitChecks[`${today}:${h.id}`],
  ).length;

  return {
    state,
    ready,
    today,
    todayLog,
    todayPriority,
    habitDoneCount,
    toggleHabit,
    setMood,
    saveLog,
    savePriorityAction,
    updateMonthlyFocus,
    updateHabits,
  };
}
