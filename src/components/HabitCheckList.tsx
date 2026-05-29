"use client";

import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EditButton } from "./EditButton";

type HabitCheckListProps = {
  habits: Habit[];
  checked: Record<string, boolean>;
  today: string;
  onToggle: (habitId: string) => void;
};

export function HabitCheckList({
  habits,
  checked,
  today,
  onToggle,
}: HabitCheckListProps) {
  return (
    <ul className="space-y-1.5">
      {habits.map((habit) => {
        const isDone = checked[`${today}:${habit.id}`];
        return (
          <li key={habit.id}>
            <button
              type="button"
              onClick={() => onToggle(habit.id)}
              className={cn(
                "flex w-full min-h-11 items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left active:scale-[0.99]",
                isDone
                  ? "border-primary/30 bg-primary/10"
                  : "border-border bg-muted/50",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                  isDone
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-transparent",
                )}
                aria-hidden
              >
                ✓
              </span>
              <span
                className={cn(
                  "text-sm",
                  isDone
                    ? "text-muted-foreground line-through"
                    : "text-card-foreground",
                )}
              >
                {habit.name}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function HabitEditLink() {
  return <EditButton href="/edit/habits" />;
}
