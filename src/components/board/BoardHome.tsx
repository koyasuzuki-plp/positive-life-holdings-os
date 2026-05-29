"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { MilestoneCard } from "@/components/board/MilestoneCard";
import {
  BUSINESS_IDS,
  BUSINESS_LABELS,
  defaultCurrentPosition,
  defaultVisionMap,
  defaultBusinessScores,
  type BusinessScores,
  type CurrentPosition,
  type VisionMap,
} from "@/lib/board/context";
import {
  loadBusinessScores,
  loadCurrentPosition,
  loadVisionMap,
} from "@/lib/board/contextStorage";
import { FUTURE_KOUYA_QUOTES } from "@/lib/board/executives";
import { getNextMilestone } from "@/lib/board/milestone";
import { formatDisplayDate, greeting, todayKey } from "@/lib/date";
import { defaultState, loadState } from "@/lib/storage";
import type { AppState } from "@/lib/types";

const SCORE_COLOR = (score: number) =>
  score >= 70 ? "bg-primary" : score >= 40 ? "bg-amber-500" : "bg-rose-500";

export function BoardHome() {
  const [appState, setAppState] = useState<AppState>(defaultState);
  const [vision, setVision] = useState<VisionMap>(defaultVisionMap);
  const [position, setPosition] = useState<CurrentPosition>(defaultCurrentPosition);
  const [scores, setScores] = useState<BusinessScores>(defaultBusinessScores);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAppState(loadState());
    setVision(loadVisionMap());
    setPosition(loadCurrentPosition());
    setScores(loadBusinessScores());
    setMounted(true);
  }, []);

  const today = todayKey();
  const todayPriority = appState.priorityActions[today];
  const quoteIndex = new Date().getDate() % FUTURE_KOUYA_QUOTES.length;
  const quote = FUTURE_KOUYA_QUOTES[quoteIndex];
  const nextMilestone = getNextMilestone(vision.milestones, today);

  if (!mounted) {
    return (
      <AppShell title="役員会" subtitle="Positive Life Holdings">
        <div className="flex min-h-32 items-center justify-center text-muted-foreground">…</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="役員会" subtitle="Positive Life Holdings">
      <div className="space-y-3">

        {/* CEO greeting */}
        <Card variant="advisor" className="!p-0">
          <div className="border-b border-stone-700/80 px-3.5 py-3">
            <CardHeader
              label="Positive Life Holdings"
              title={`${greeting()}、CEO`}
              dark
              action={
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  CEO
                </span>
              }
            />
            <p className="text-xs text-stone-400">{formatDisplayDate()}</p>
          </div>
          <div className="px-3.5 py-3">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2">
              <p className="text-[10px] font-medium tracking-wider uppercase text-amber-400/90">
                未来のこうやからの一言
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-stone-200">{quote}</p>
            </div>
          </div>
        </Card>

        {/* Flow: ① Vision */}
        <MilestoneCard nextMilestone={nextMilestone} visionKeywords={vision.visionKeywords} />

        {/* Flow: ② 現在地 */}
        <Link href="/board/position" className="block">
          <Card className="active:opacity-80">
            <CardHeader
              label="② 現在地"
              title="経営状況"
              action={<span className="text-xs text-muted-foreground">編集 →</span>}
            />
            {position.monthlyRevenue ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">月商</span>
                  <span className="text-sm font-semibold text-card-foreground">
                    {position.monthlyRevenue}
                  </span>
                </div>
                {position.mainChallenge && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="shrink-0 text-xs text-muted-foreground">最大の壁</span>
                    <span className="text-right text-xs text-card-foreground">
                      {position.mainChallenge}
                    </span>
                  </div>
                )}
                {position.updatedAt && (
                  <p className="text-[10px] text-muted-foreground">
                    最終更新: {position.updatedAt}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                月商・最大の壁・成果を記録してください
              </p>
            )}
          </Card>
        </Link>

        {/* Flow: ③ 事業スコア */}
        <Link href="/board/scores" className="block">
          <Card className="active:opacity-80">
            <CardHeader
              label="③ 事業スコア"
              title="5事業の進捗"
              action={<span className="text-xs text-muted-foreground">編集 →</span>}
            />
            <div className="space-y-2">
              {BUSINESS_IDS.map((id) => {
                const s = scores[id];
                return (
                  <div key={id} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-[11px] text-muted-foreground">
                      {BUSINESS_LABELS[id]}
                    </span>
                    <div className="flex-1 overflow-hidden rounded-full bg-muted h-1.5">
                      <div
                        className={`h-full rounded-full ${SCORE_COLOR(s.score)}`}
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[11px] font-medium text-card-foreground">
                      {s.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </Link>

        {/* Divider → 役員会 */}
        <div className="flex items-center gap-2 px-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
            ④ AI役員会
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Today's management info */}
        {todayPriority?.action && (
          <Card variant="mission">
            <CardHeader label="本日の最重要行動" title={todayPriority.action} />
            {todayPriority.done && (
              <p className="text-xs font-medium text-primary">✓ 完了済み</p>
            )}
          </Card>
        )}

        {/* Executive list */}
        <Card>
          <CardHeader label="出席役員" title="10名" />
          <div className="flex flex-wrap gap-3">
            {[
              { initial: "未", color: "bg-amber-500", name: "未来のこうや" },
              { initial: "財", color: "bg-blue-500", name: "CFO" },
              { initial: "執", color: "bg-green-600", name: "COO" },
              { initial: "健", color: "bg-rose-500", name: "CHO" },
              { initial: "O", color: "bg-purple-500", name: "OriVis" },
              { initial: "D", color: "bg-orange-500", name: "ダイエット" },
              { initial: "A", color: "bg-cyan-500", name: "AI" },
              { initial: "K", color: "bg-pink-500", name: "キレイ" },
              { initial: "編", color: "bg-yellow-600", name: "出版" },
              { initial: "戦", color: "bg-indigo-500", name: "戦略室" },
            ].map((e) => (
              <div key={e.name} className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-white ${e.color}`}
                >
                  {e.initial}
                </span>
                <span className="text-[9px] text-muted-foreground">{e.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Open meeting button */}
        <Link
          href="/board/session"
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:opacity-90"
        >
          役員会を開く
        </Link>
      </div>
    </AppShell>
  );
}
