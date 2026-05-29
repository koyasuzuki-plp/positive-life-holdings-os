export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type Habit = {
  id: string;
  name: string;
};

export type DailyLog = {
  date: string;
  mood: MoodLevel | null;
  /** 夜の振り返り：今日のエネルギー 1〜5 */
  energy: MoodLevel | null;
  progress: string;
  gratitude: string;
  insight: string;
  tomorrowStep: string;
};

export type PriorityAction = {
  action: string;
  duration: string;
  reason: string;
  done: boolean;
};

export type AppState = {
  monthlyFocus: string;
  habits: Habit[];
  habitChecks: Record<string, boolean>;
  logs: Record<string, DailyLog>;
  priorityActions: Record<string, PriorityAction>;
};

export const MAX_FOCUS_LENGTH = 40;
export const MAX_HABIT_NAME_LENGTH = 20;
export const MAX_PRIORITY_ACTION_LENGTH = 60;
export const MAX_PRIORITY_REASON_LENGTH = 80;
export const MAX_LOG_FIELD_LENGTH = 120;
export const HABIT_COUNT = 3;

export const DEFAULT_HABITS: Habit[] = [
  { id: "1", name: "朝の振り返り" },
  { id: "2", name: "運動・ストレッチ" },
  { id: "3", name: "深い仕事 1ブロック" },
];

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: "とても低い",
  2: "低い",
  3: "普通",
  4: "良い",
  5: "とても良い",
};

export const MOOD_EMOJI: Record<MoodLevel, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

export function emptyPriorityAction(): PriorityAction {
  return { action: "", duration: "", reason: "", done: false };
}
