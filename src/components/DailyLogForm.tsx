"use client";

import { useEffect, useState } from "react";
import { MoodPicker } from "./MoodPicker";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";
import { inputClassName } from "./ui/inputStyles";
import { cn } from "@/lib/utils";
import type { DailyLog, MoodLevel } from "@/lib/types";
import { MAX_LOG_FIELD_LENGTH } from "@/lib/types";

type DailyLogFormProps = {
  date: string;
  initial: DailyLog;
  onSave: (log: DailyLog) => void;
};

export function DailyLogForm({ date, initial, onSave }: DailyLogFormProps) {
  const [mood, setMood] = useState<MoodLevel | null>(initial.mood);
  const [energy, setEnergy] = useState<MoodLevel | null>(initial.energy);
  const [progress, setProgress] = useState(initial.progress);
  const [gratitude, setGratitude] = useState(initial.gratitude);
  const [insight, setInsight] = useState(initial.insight);
  const [tomorrowStep, setTomorrowStep] = useState(initial.tomorrowStep);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMood(initial.mood);
    setEnergy(initial.energy);
    setProgress(initial.progress);
    setGratitude(initial.gratitude);
    setInsight(initial.insight);
    setTomorrowStep(initial.tomorrowStep);
    setSaved(false);
  }, [initial, date]);

  const canSave = mood !== null && energy !== null;
  const isDirty =
    mood !== initial.mood ||
    energy !== initial.energy ||
    progress !== initial.progress ||
    gratitude !== initial.gratitude ||
    insight !== initial.insight ||
    tomorrowStep !== initial.tomorrowStep;

  function handleSave() {
    if (!canSave) return;
    onSave({ date, mood, energy, progress, gratitude, insight, tomorrowStep });
    setSaved(true);
  }

  function markDirty() {
    setSaved(false);
  }

  return (
    <div className="space-y-3 pb-28">
      <Card>
        <CardHeader label="状態" title="気分" />
        <MoodPicker value={mood} onChange={(v) => { setMood(v); markDirty(); }} compact />
      </Card>

      <Card>
        <CardHeader label="振り返り" title="今夜の記録" />
        <div className="space-y-3">
          <Field
            id="progress"
            label="今日進んだこと"
            value={progress}
            onChange={(v) => { setProgress(v); markDirty(); }}
            placeholder="例：提案送付、習慣2/3"
          />
          <Field
            id="gratitude"
            label="感謝したこと"
            value={gratitude}
            onChange={(v) => { setGratitude(v); markDirty(); }}
            placeholder="例：チームの迅速な対応"
          />
          <Field
            id="insight"
            label="気づき"
            value={insight}
            onChange={(v) => { setInsight(v); markDirty(); }}
            placeholder="例：午前の集中が成果に直結"
          />
          <Field
            id="tomorrow"
            label="明日の一歩"
            value={tomorrowStep}
            onChange={(v) => { setTomorrowStep(v); markDirty(); }}
            placeholder="例：中村さんへフォロー"
          />
          <fieldset>
            <legend className="mb-2 text-[11px] font-medium text-muted-foreground">
              今日のエネルギー <span className="text-primary">*</span>
            </legend>
            <EnergyPicker value={energy} onChange={(v) => { setEnergy(v); markDirty(); }} />
          </fieldset>
        </div>
      </Card>

      <div className="fixed right-0 bottom-0 left-0 z-10 border-t border-border bg-card/95 px-4 py-3 backdrop-blur safe-bottom">
        <div className="mx-auto max-w-md">
          {saved ? (
            <p className="mb-2 text-center text-xs text-primary">保存しました ✓</p>
          ) : isDirty ? (
            <p className="mb-2 text-center text-xs text-amber-500">● 未保存</p>
          ) : null}
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground disabled:bg-muted disabled:text-muted-foreground enabled:active:opacity-90"
          >
            {canSave ? "振り返りを保存" : "気分とエネルギーを入力"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[11px] text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
        placeholder={placeholder}
        maxLength={MAX_LOG_FIELD_LENGTH}
        className={inputClassName}
      />
    </div>
  );
}

function EnergyPicker({
  value,
  onChange,
}: {
  value: MoodLevel | null;
  onChange: (v: MoodLevel) => void;
}) {
  const labels: Record<MoodLevel, string> = {
    1: "枯渇",
    2: "低め",
    3: "普通",
    4: "十分",
    5: "充実",
  };

  return (
    <div className="flex justify-between gap-1">
      {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => {
        const selected = value === level;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            aria-label={labels[level]}
            aria-pressed={selected}
            className={cn(
              "flex min-h-10 min-w-0 flex-1 items-center justify-center rounded-lg border text-[11px] font-medium active:scale-95",
              selected
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-muted/50 text-muted-foreground",
            )}
          >
            {labels[level]}
          </button>
        );
      })}
    </div>
  );
}

export function LogSummary({ log }: { log: DailyLog }) {
  const parts: string[] = [];
  if (log.mood) parts.push(`気分 ${log.mood}/5`);
  if (log.energy) parts.push(`エネルギー ${log.energy}/5`);
  if (!parts.length) return null;
  return <p className="text-xs text-muted-foreground">{parts.join(" · ")}</p>;
}
