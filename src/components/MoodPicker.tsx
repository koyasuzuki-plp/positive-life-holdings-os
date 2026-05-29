"use client";

import { MOOD_EMOJI, MOOD_LABELS, type MoodLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEVELS: MoodLevel[] = [1, 2, 3, 4, 5];

type MoodPickerProps = {
  value: MoodLevel | null;
  onChange: (mood: MoodLevel) => void;
  compact?: boolean;
};

export function MoodPicker({ value, onChange, compact }: MoodPickerProps) {
  return (
    <div>
      {!compact && (
        <p className="mb-3 text-sm text-muted-foreground">
          タップして選んでください
        </p>
      )}
      <div className="flex justify-between gap-1">
        {LEVELS.map((level) => {
          const selected = value === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              aria-label={MOOD_LABELS[level]}
              aria-pressed={selected}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg border transition-all active:scale-95",
                compact ? "min-h-10" : "min-h-14 rounded-xl border-2",
                selected
                  ? "border-primary bg-primary/15"
                  : "border-border bg-muted/50",
              )}
            >
              <span className={compact ? "text-lg leading-none" : "text-2xl leading-none"}>
                {MOOD_EMOJI[level]}
              </span>
            </button>
          );
        })}
      </div>
      {value && !compact && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {MOOD_LABELS[value]}
        </p>
      )}
    </div>
  );
}
