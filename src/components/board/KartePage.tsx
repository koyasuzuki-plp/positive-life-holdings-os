"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { StickyFooter } from "@/components/StickyFooter";
import { inputClassName } from "@/components/ui/inputStyles";
import { EXECUTIVES } from "@/lib/board/executives";
import { loadKarteMap, saveKarteMap } from "@/lib/board/contextStorage";
import type { ExecutiveId, ExecutiveKarte, KarteMap } from "@/lib/board/types";
import { todayKey } from "@/lib/date";

function emptyKarte(): ExecutiveKarte {
  return {
    currentStatus: "",
    goal: "",
    kpis: "",
    challenges: "",
    questionsForCEO: "",
    updatedAt: "",
  };
}

export function KartePage() {
  const router = useRouter();
  const [form, setForm] = useState<KarteMap>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setForm(loadKarteMap());
    setReady(true);
  }, []);

  function patch(id: ExecutiveId, field: keyof ExecutiveKarte, value: string) {
    setForm((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? emptyKarte()), [field]: value },
    }));
    setIsDirty(true);
    setSaved(false);
  }

  function handleSave() {
    const today = todayKey();
    const updated: KarteMap = {};
    for (const exec of EXECUTIVES) {
      const k = form[exec.id];
      if (k) {
        updated[exec.id] = { ...k, updatedAt: today };
      }
    }
    saveKarteMap(updated);
    setIsDirty(false);
    setSaved(true);
    setTimeout(() => router.push("/board"), 900);
  }

  if (!ready) {
    return (
      <AppShell title="役員カルテ" subtitle="担当事業の現状管理" hideNav>
        <div className="flex min-h-32 items-center justify-center text-muted-foreground">…</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="役員カルテ" subtitle="担当事業の現状管理" hideNav>
      <div className="space-y-3 pb-24">
        <BackLink href="/board" label="役員会に戻る" />

        <Card>
          <p className="text-xs text-muted-foreground">
            各役員の担当事業カルテを記録します。入力内容はAI役員会の発言に反映されます。
          </p>
        </Card>

        {EXECUTIVES.map((exec) => {
          const k = form[exec.id] ?? emptyKarte();
          return (
            <Card key={exec.id}>
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white ${exec.colorClass}`}
                >
                  {exec.initial}
                </span>
                <div>
                  <CardHeader label={exec.businessLabel} title={exec.name} />
                  <p className="text-[10px] text-muted-foreground">{exec.role}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <KarteField
                  label="現状"
                  placeholder="例：月商38万、受講者12名"
                  value={k.currentStatus}
                  onChange={(v) => patch(exec.id, "currentStatus", v)}
                />
                <KarteField
                  label="目標"
                  placeholder="例：月商100万、受講者30名"
                  value={k.goal}
                  onChange={(v) => patch(exec.id, "goal", v)}
                />
                <KarteField
                  label="KPI"
                  placeholder="例：新規問合せ数 / 継続率 / 月次売上"
                  value={k.kpis}
                  onChange={(v) => patch(exec.id, "kpis", v)}
                />
                <KarteField
                  label="課題"
                  placeholder="例：リピート率が60%→45%に低下"
                  value={k.challenges}
                  onChange={(v) => patch(exec.id, "challenges", v)}
                  multiline
                />
                <KarteField
                  label="CEOへの質問例"
                  placeholder="例：集客予算をどこまで増やせますか？"
                  value={k.questionsForCEO}
                  onChange={(v) => patch(exec.id, "questionsForCEO", v)}
                  multiline
                />
              </div>
            </Card>
          );
        })}
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

function KarteField({
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
      <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
        {label}
      </label>
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
