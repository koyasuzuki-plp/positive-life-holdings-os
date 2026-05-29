import type { DailyLog, MoodLevel } from "./types";

type LegacyLog = DailyLog & {
  actions?: string;
  note?: string;
};

export function createEmptyLog(date: string): DailyLog {
  return {
    date,
    mood: null,
    energy: null,
    progress: "",
    gratitude: "",
    insight: "",
    tomorrowStep: "",
  };
}

function parseMood(value: unknown): MoodLevel | null {
  const n = Number(value);
  return n >= 1 && n <= 5 ? (n as MoodLevel) : null;
}

export function normalizeLog(raw: Partial<LegacyLog> & { date: string }): DailyLog {
  return {
    date: raw.date,
    mood: parseMood(raw.mood),
    energy: parseMood(raw.energy),
    progress: String(raw.progress ?? raw.actions ?? ""),
    gratitude: String(raw.gratitude ?? raw.note ?? ""),
    insight: String(raw.insight ?? ""),
    tomorrowStep: String(raw.tomorrowStep ?? ""),
  };
}
