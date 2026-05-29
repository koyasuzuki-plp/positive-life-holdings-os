"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "./AppShell";
import { BackLink } from "./BackLink";
import { StickyFooter } from "./StickyFooter";
import { useAppState } from "@/hooks/useAppState";
import {
  DEFAULT_HABITS,
  HABIT_COUNT,
  MAX_HABIT_NAME_LENGTH,
  type Habit,
} from "@/lib/types";
import { inputClassName } from "./ui/inputStyles";

function normalizeHabits(habits: Habit[]): string[] {
  const names = habits.slice(0, HABIT_COUNT).map((h) => h.name);
  while (names.length < HABIT_COUNT) {
    const fallback = DEFAULT_HABITS[names.length];
    names.push(fallback?.name ?? "");
  }
  return names;
}

export function HabitsEditPage() {
  const router = useRouter();
  const { state, ready, updateHabits } = useAppState();
  const [names, setNames] = useState<string[]>(["", "", ""]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready) setNames(normalizeHabits(state.habits));
  }, [ready, state.habits]);

  function handleSave() {
    const trimmed = names.map((n) => n.trim());
    if (trimmed.some((n) => !n)) {
      setError("すべての習慣に名前を入力してください");
      return;
    }
    const habits: Habit[] = state.habits.slice(0, HABIT_COUNT).map((h, i) => ({
      id: h.id ?? DEFAULT_HABITS[i]?.id ?? String(i + 1),
      name: trimmed[i]!,
    }));
    for (let i = habits.length; i < HABIT_COUNT; i++) {
      habits.push({
        id: DEFAULT_HABITS[i]?.id ?? String(i + 1),
        name: trimmed[i]!,
      });
    }
    updateHabits(habits);
    router.push("/");
  }

  function updateName(index: number, value: string) {
    setNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setError("");
  }

  if (!ready) {
    return (
      <AppShell title="習慣を編集" hideNav>
        <div className="flex min-h-40 items-center justify-center text-muted-foreground">
          …
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="習慣を編集" subtitle="3つの習慣" hideNav>
      <BackLink />
      <form
        className="space-y-4 pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {names.map((name, index) => (
          <div key={index}>
            <label
              htmlFor={`habit-${index}`}
              className="mb-2 block text-sm font-medium text-card-foreground"
            >
              習慣 {index + 1}
            </label>
            <input
              id={`habit-${index}`}
              type="text"
              value={name}
              onChange={(e) => updateName(index, e.target.value)}
              maxLength={MAX_HABIT_NAME_LENGTH}
              placeholder={DEFAULT_HABITS[index]?.name}
              className={inputClassName}
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {name.length}/{MAX_HABIT_NAME_LENGTH}
            </p>
          </div>
        ))}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">
          チェックの記録はそのまま残ります。名前だけ変更されます。
        </p>
      </form>

      <StickyFooter>
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground active:opacity-90"
        >
          保存して今日に戻る
        </button>
      </StickyFooter>
    </AppShell>
  );
}
