export function todayKey(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function formatDisplayDate(date = new Date()): string {
  return date.toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "おはようございます";
  if (h < 17) return "こんにちは";
  return "おつかれさまです";
}

/** YYYY-MM-DD の直近 n 日（今日含む） */
export function lastNDays(today: string, n: number): string[] {
  const base = new Date(`${today}T12:00:00`);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}
