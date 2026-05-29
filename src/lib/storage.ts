import { createEmptyLog, normalizeLog } from "./log";
import type { AppState, DailyLog, Habit, PriorityAction } from "./types";
import { DEFAULT_HABITS, HABIT_COUNT } from "./types";

const STORAGE_KEY = "positive-life-os";

export const defaultState: AppState = {
  monthlyFocus: "売上と健康のバランスを整える",
  habits: DEFAULT_HABITS,
  habitChecks: {},
  logs: {},
  priorityActions: {},
};

function normalizeHabits(habits: unknown): Habit[] {
  if (!Array.isArray(habits) || habits.length === 0) {
    return DEFAULT_HABITS;
  }
  return Array.from({ length: HABIT_COUNT }, (_, i) => {
    const h = habits[i] as { id?: string; name?: string } | undefined;
    const fallback = DEFAULT_HABITS[i];
    return {
      id: String(h?.id ?? fallback?.id ?? i + 1),
      name: String(h?.name ?? fallback?.name ?? `習慣 ${i + 1}`),
    };
  });
}

function normalizePriorityAction(raw: unknown): PriorityAction {
  const p = raw as Partial<PriorityAction> | undefined;
  return {
    action: typeof p?.action === "string" ? p.action : "",
    duration: typeof p?.duration === "string" ? p.duration : "",
    reason: typeof p?.reason === "string" ? p.reason : "",
    done: Boolean(p?.done),
  };
}

function normalizeLogs(logs: unknown): Record<string, DailyLog> {
  if (!logs || typeof logs !== "object") return {};
  const result: Record<string, DailyLog> = {};
  for (const [date, value] of Object.entries(logs as Record<string, unknown>)) {
    if (value && typeof value === "object") {
      result[date] = normalizeLog({ ...(value as object), date });
    }
  }
  return result;
}

function normalizePriorityActions(
  actions: unknown,
): Record<string, PriorityAction> {
  if (!actions || typeof actions !== "object") return {};
  const result: Record<string, PriorityAction> = {};
  for (const [date, value] of Object.entries(
    actions as Record<string, unknown>,
  )) {
    result[date] = normalizePriorityAction(value);
  }
  return result;
}

function normalizeState(parsed: Partial<AppState>): AppState {
  return {
    monthlyFocus:
      typeof parsed.monthlyFocus === "string"
        ? parsed.monthlyFocus
        : defaultState.monthlyFocus,
    habits: normalizeHabits(parsed.habits),
    habitChecks:
      parsed.habitChecks && typeof parsed.habitChecks === "object"
        ? parsed.habitChecks
        : {},
    logs: normalizeLogs(parsed.logs),
    priorityActions: normalizePriorityActions(parsed.priorityActions),
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return normalizeState(JSON.parse(raw) as Partial<AppState>);
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}

export { createEmptyLog };
