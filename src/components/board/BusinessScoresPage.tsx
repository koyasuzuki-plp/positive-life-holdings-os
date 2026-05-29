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
import {
  BUSINESS_IDS,
  BUSINESS_LABELS,
  type BusinessId,
  type BusinessScore,
  type BusinessScores,
} from "@/lib/board/context";
import { todayKey } from "@/lib/date";

const SCORE_COLOR = (score: number) => {
  if (score >= 70) return "bg-primary";
  if (score >= 40) return "bg-amber-500";
  return "bg-rose-500";
};

export function BusinessScoresPage() {
  const router = useRouter();
  const { scores, ready, updateScores } = useVisionContext();
  const [form, setForm] = useState<BusinessScores>(scores);

  useEffect(() => {
    if (ready) setForm(scores);
  }, [ready, scores]);

  function handleSave() {
    const today = todayKey();
    const updated: BusinessScores = { ...form };
    for (const id of BUSINESS_IDS) {
      updated[id] = { ...updated[id], updatedAt: today };
    }
    updateScores(updated);
    router.push("/board");
  }

  function patchScore(id: BusinessId, patch: Partial<BusinessScore>) {
    setForm((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  if (!ready) {
    return (
      <AppShell title="事業スコア" subtitle="5事業の進捗" hideNav>
        <div className="flex min-h-32 items-center justify-center text-muted-foreground">…</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="事業スコア" subtitle="5事業の進捗" hideNav>
      <div className="space-y-3 pb-24">
        <BackLink href="/board" label="役員会に戻る" />

        <Card>
          <p className="text-xs text-muted-foreground">
            各事業の現在スコアと今月の重点・次の一手を記録します。AI役員会の発言に反映されます。
          </p>
        </Card>

        {BUSINESS_IDS.map((id) => {
          const s = form[id];
          return (
            <Card key={id}>
              <CardHeader label="③ 事業スコア" title={BUSINESS_LABELS[id]} />

              {/* Score input */}
              <div className="mb-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">現在スコア</span>
                  <span className="text-sm font-bold text-card-foreground">{s.score}/100</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={s.score}
                  onChange={(e) => patchScore(id, { score: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${SCORE_COLOR(s.score)}`}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {s.score >= 70
                    ? "攻勢段階 — 拡大可能"
                    : s.score >= 40
                      ? "改善フェーズ — 継続が鍵"
                      : "要集中 — 立て直し最優先"}
                </p>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground">今月の重点</label>
                  <input
                    type="text"
                    className={inputClassName}
                    placeholder="例: 新規集客導線の確立"
                    value={s.monthlyFocus}
                    onChange={(e) => patchScore(id, { monthlyFocus: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground">次の一手</label>
                  <input
                    type="text"
                    className={inputClassName}
                    placeholder="例: LP改善を今週中に完了"
                    value={s.nextAction}
                    onChange={(e) => patchScore(id, { nextAction: e.target.value })}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <StickyFooter>
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground active:opacity-90"
        >
          保存して役員会に戻る
        </button>
      </StickyFooter>
    </AppShell>
  );
}
