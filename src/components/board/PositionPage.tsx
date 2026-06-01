"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { StickyFooter } from "@/components/StickyFooter";
import { inputClassName } from "@/components/ui/inputStyles";
import { useVisionContext } from "@/hooks/useVisionContext";
import type { CurrentPosition, ProgressLevel } from "@/lib/board/context";
import { todayKey } from "@/lib/date";

const PROGRESS_LABELS: Record<ProgressLevel, string> = {
  1: "停滞中",
  2: "やや低迷",
  3: "普通",
  4: "前進中",
  5: "絶好調",
};

export function PositionPage() {
  const router = useRouter();
  const { position, ready, updatePosition } = useVisionContext();
  const [form, setForm] = useState<CurrentPosition>(position);
  const [isDirty, setIsDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (ready) { setForm(position); setIsDirty(false); setSaved(false); }
  }, [ready, position]);

  function patch(p: Partial<CurrentPosition>) {
    setForm((f) => ({ ...f, ...p }));
    setIsDirty(true);
    setSaved(false);
  }

  function handleSave() {
    updatePosition({ ...form, updatedAt: todayKey() });
    setIsDirty(false);
    setSaved(true);
    setTimeout(() => router.push("/board"), 900);
  }

  if (!ready) {
    return (
      <AppShell title="現在地" subtitle="経営状況の記録" hideNav>
        <div className="flex min-h-32 items-center justify-center text-muted-foreground">…</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="現在地" subtitle="経営状況の記録" hideNav>
      <div className="space-y-3 pb-24">
        <BackLink href="/board" label="役員会に戻る" />

        {position.updatedAt && (
          <p className="text-xs text-muted-foreground">最終更新: {position.updatedAt}</p>
        )}

        <Card>
          <CardHeader label="② 現在地" title="今の経営状況" />
          <div className="space-y-3">
            <Field
              label="今月の月商"
              placeholder="例: 45万円"
              value={form.monthlyRevenue}
              onChange={(v) => patch({ monthlyRevenue: v })}
            />
            <Field
              label="今の最大の壁"
              placeholder="例: 安定的な集客ができていない"
              value={form.mainChallenge}
              onChange={(v) => patch({ mainChallenge: v })}
              multiline
            />
            <Field
              label="直近の最大の成果"
              placeholder="例: OriVisで新規契約3件"
              value={form.biggestWin}
              onChange={(v) => patch({ biggestWin: v })}
              multiline
            />
          </div>
        </Card>

        <Card>
          <CardHeader label="前進感" title="全体の進捗感" />
          <div className="flex gap-2">
            {([1, 2, 3, 4, 5] as ProgressLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => patch({ overallProgress: level })}
                className={`flex flex-1 flex-col items-center gap-1 rounded-lg border py-2 transition-colors ${
                  form.overallProgress === level
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                <span className="text-base font-bold">{level}</span>
                <span className="text-[9px] leading-none">{PROGRESS_LABELS[level]}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <StickyFooter>
        {saved ? (
          <p className="mb-2 text-center text-xs text-primary">保存しました ✓</p>
        ) : isDirty ? (
          <p className="mb-2 text-center text-xs text-amber-500">● 未保存</p>
        ) : null}
        <button
          type="button"
          onClick={handleSave}
          disabled={saved}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground active:opacity-90 disabled:opacity-60"
        >
          {saved ? "保存しました ✓" : "保存して役員会に戻る"}
        </button>
      </StickyFooter>
    </AppShell>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  multiline,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</label>
      {multiline ? (
        <textarea
          className={`${inputClassName} min-h-[4rem] resize-none`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className={inputClassName}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
