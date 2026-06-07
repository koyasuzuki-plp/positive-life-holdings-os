"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { CEOReplyForm } from "@/components/board/CEOReplyForm";
import {
  generateDummyStatements,
  getDummyResolution,
  generateRoundStatements,
  generateRoundResolution,
  type BoardContext,
} from "@/lib/board/dummy";
import { detectCEOIntent, selectRoundExecutives } from "@/lib/board/roundEngine";
import { EXECUTIVES, getExecutive } from "@/lib/board/executives";
import type {
  Agenda,
  BoardSession,
  Executive,
  ExecutiveId,
  ExecutiveStatement,
  MeetingRound,
} from "@/lib/board/types";
import {
  loadBusinessScores,
  loadCurrentPosition,
  loadKarteMap,
  loadVisionMap,
} from "@/lib/board/contextStorage";
import { getNextMilestone } from "@/lib/board/milestone";
import { inputClassName } from "@/components/ui/inputStyles";
import { todayKey } from "@/lib/date";
import { loadState } from "@/lib/storage";

const MAX_ROUNDS = 3;

type Phase = "form" | "session" | "ceo-reply" | "resolved";

const EMPTY_AGENDA: Agenda = {
  topic: "",
  background: "",
  situation: "",
  decision: "",
};

// モジュールレベルに置くことで useCallback 依存配列の問題を回避
function loadBoardContext(): BoardContext {
  const today = todayKey();
  const vision = loadVisionMap();
  const position = loadCurrentPosition();
  const scores = loadBusinessScores();
  const nextMilestone = getNextMilestone(vision.milestones, today);
  const appState = loadState();
  const todayLog = appState.logs[today];
  return {
    vision,
    position,
    scores,
    nextMilestone,
    energy: todayLog?.energy ?? null,
    mood: todayLog?.mood ?? null,
    kartes: loadKarteMap(),
  };
}

type SessionRoomProps = {
  onSave: (session: BoardSession) => void;
};

export function SessionRoom({ onSave }: SessionRoomProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("form");
  const [agenda, setAgenda] = useState<Agenda>(EMPTY_AGENDA);
  const [attendees, setAttendees] = useState<ExecutiveId[]>(
    () => EXECUTIVES.map((e) => e.id)
  );

  function toggleAttendee(id: ExecutiveId) {
    setAttendees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // ラウンド管理
  const [round, setRound] = useState(1);
  const [completedRounds, setCompletedRounds] = useState<MeetingRound[]>([]);
  const [boardCtx, setBoardCtx] = useState<BoardContext>({});

  // 現在ラウンドの表示状態
  const [currentStatements, setCurrentStatements] = useState<ExecutiveStatement[]>([]);
  const [currentResolution, setCurrentResolution] = useState({
    resolution: "",
    nextAction: "",
  });
  const [revealedCount, setRevealedCount] = useState(0);

  const [saved, setSaved] = useState(false);

  // 発言アニメーション
  useEffect(() => {
    if (phase !== "session") return;
    if (revealedCount >= currentStatements.length) return;
    const timer = setTimeout(() => {
      setRevealedCount((c) => c + 1);
    }, 700);
    return () => clearTimeout(timer);
  }, [phase, revealedCount, currentStatements.length]);

  const startMeeting = useCallback(() => {
    if (!agenda.topic.trim()) return;
    const ctx = loadBoardContext();
    setBoardCtx(ctx);
    const allStmts = generateDummyStatements(agenda, ctx);
    const stmts = allStmts.filter((s) => attendees.includes(s.executiveId));
    const res = getDummyResolution(agenda, ctx);
    setCurrentStatements(stmts);
    setCurrentResolution(res);
    setRevealedCount(0);
    setRound(1);
    setCompletedRounds([]);
    setSaved(false);
    setPhase("session");
  }, [agenda, attendees]);

  function handleDecide() {
    const finalRound: MeetingRound = {
      roundNumber: round,
      statements: currentStatements,
      resolution: currentResolution.resolution,
      nextAction: currentResolution.nextAction,
    };
    setCompletedRounds((prev) => [...prev, finalRound]);
    setPhase("resolved");
  }

  function handleContinue(ceoComment: string) {
    const done: MeetingRound = {
      roundNumber: round,
      statements: currentStatements,
      resolution: currentResolution.resolution,
      nextAction: currentResolution.nextAction,
      ceoContinueComment: ceoComment.trim() || undefined,
    };
    const nextRound = round + 1;
    const intent = detectCEOIntent(ceoComment);
    const preferred = selectRoundExecutives(intent).filter((id) => attendees.includes(id));
    const execIds = preferred.length > 0 ? preferred : attendees.slice(0, 3);
    const stmts = generateRoundStatements(agenda, ceoComment, nextRound, boardCtx, execIds);
    const res = generateRoundResolution(agenda, ceoComment, nextRound, boardCtx);

    setCompletedRounds((prev) => [...prev, done]);
    setCurrentStatements(stmts);
    setCurrentResolution(res);
    setRound(nextRound);
    setRevealedCount(0);
    setPhase("session");
  }

  function handleSave() {
    const lastRound = completedRounds[completedRounds.length - 1];
    const session: BoardSession = {
      id: `${todayKey()}-${Date.now()}`,
      date: todayKey(),
      agenda,
      attendees,
      rounds: completedRounds,
      finalResolution: lastRound?.resolution ?? "",
      finalNextAction: lastRound?.nextAction ?? "",
    };
    onSave(session);
    setSaved(true);
  }

  const allRevealed =
    revealedCount >= currentStatements.length && currentStatements.length > 0;
  const isLastRound = round >= MAX_ROUNDS;
  const nextExecutive =
    currentStatements.length > 0 && revealedCount < currentStatements.length
      ? getExecutive(currentStatements[revealedCount].executiveId)
      : undefined;

  // 直前ラウンドの CEO コメント（session フェーズの Round 2/3 で表示）
  const prevCEOComment =
    round > 1 && completedRounds.length > 0
      ? completedRounds[completedRounds.length - 1].ceoContinueComment
      : undefined;

  // ── form ─────────────────────────────────────────────────────────
  if (phase === "form") {
    return (
      <AppShell title="役員会議室" subtitle="議題設定" hideNav>
        <div className="space-y-3">
          <BackLink href="/board" label="役員会に戻る" />

          <Card>
            <CardHeader label="AGENDA" title="今日の議題を設定" />
            <div className="space-y-3">
              <FormField
                label="議題 *"
                placeholder="例：新規SNS集客施策の採用可否"
                value={agenda.topic}
                onChange={(v) => setAgenda((a) => ({ ...a, topic: v }))}
              />
              <FormField
                label="背景"
                placeholder="なぜこの議題が必要か"
                value={agenda.background}
                onChange={(v) => setAgenda((a) => ({ ...a, background: v }))}
                multiline
              />
              <FormField
                label="現状"
                placeholder="現在の状況・数値・課題"
                value={agenda.situation}
                onChange={(v) => setAgenda((a) => ({ ...a, situation: v }))}
                multiline
              />
              <FormField
                label="意思決定したい内容"
                placeholder="今日の会議で何を決めたいか"
                value={agenda.decision}
                onChange={(v) => setAgenda((a) => ({ ...a, decision: v }))}
                multiline
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              label="出席役員"
              title={`${attendees.length}名選択中`}
            />
            <div className="space-y-1.5">
              {EXECUTIVES.map((exec) => {
                const selected = attendees.includes(exec.id);
                const isOnlyOne = selected && attendees.length === 1;
                return (
                  <button
                    key={exec.id}
                    type="button"
                    onClick={() => !isOnlyOne && toggleAttendee(exec.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left active:opacity-70 ${
                      selected ? "bg-primary/10" : "bg-muted/30 opacity-50"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${exec.colorClass}`}
                    >
                      {exec.initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-card-foreground">
                        {exec.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {exec.businessLabel}
                      </p>
                    </div>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <button
            type="button"
            onClick={startMeeting}
            disabled={!agenda.topic.trim()}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:opacity-90 disabled:opacity-40"
          >
            会議開始
          </button>
        </div>
      </AppShell>
    );
  }

  // ── ceo-reply ─────────────────────────────────────────────────────
  if (phase === "ceo-reply") {
    return (
      <AppShell title="役員会議室" subtitle={agenda.topic} hideNav>
        <div className="space-y-3">
          <RoundBadge current={round} max={MAX_ROUNDS} label="完了" />
          <CEOReplyForm
            currentRound={round}
            onContinue={handleContinue}
            onDecide={handleDecide}
          />
        </div>
      </AppShell>
    );
  }

  // ── resolved ──────────────────────────────────────────────────────
  if (phase === "resolved") {
    const lastRound = completedRounds[completedRounds.length - 1];
    return (
      <AppShell title="役員会議室" subtitle={agenda.topic} hideNav>
        <div className="space-y-3">
          <RoundBadge current={completedRounds.length} max={MAX_ROUNDS} label="決定" />

          <Card variant="mission">
            <CardHeader label="議題" title={agenda.topic} />
          </Card>

          <Card variant="advisor" className="!p-0">
            <div className="border-b border-stone-700/80 px-3.5 py-3">
              <CardHeader label="最終決議" title="会議結果" dark />
            </div>
            <div className="space-y-2 px-3.5 py-3">
              <div className="rounded-lg bg-stone-800/40 px-2.5 py-2">
                <p className="text-[10px] font-medium tracking-wider uppercase text-teal-400/90">
                  結論
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-stone-200">
                  {lastRound?.resolution}
                </p>
              </div>
              <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-2.5 py-2">
                <p className="text-[10px] font-medium tracking-wider uppercase text-teal-400/90">
                  次の一手
                </p>
                <p className="mt-0.5 text-[13px] font-medium leading-snug text-teal-50">
                  {lastRound?.nextAction}
                </p>
              </div>
            </div>
          </Card>

          {completedRounds.length > 1 && (
            <Card>
              <CardHeader
                label="議論の軌跡"
                title={`${completedRounds.length}ラウンドの対話`}
              />
              <div className="space-y-2">
                {completedRounds.map((r) => (
                  <div key={r.roundNumber} className="border-l-2 border-primary/30 pl-3">
                    <p className="text-[10px] font-semibold text-primary">
                      Round {r.roundNumber}
                    </p>
                    {r.ceoContinueComment && (
                      <p className="mt-0.5 text-[10px] text-amber-500">
                        CEO「
                        {r.ceoContinueComment.length > 40
                          ? `${r.ceoContinueComment.slice(0, 40)}…`
                          : r.ceoContinueComment}
                        」
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {saved ? (
            <div className="space-y-2">
              <p className="text-center text-xs text-primary">議事録を保存しました ✓</p>
              <button
                type="button"
                onClick={() => router.push("/board")}
                className="flex min-h-12 w-full items-center justify-center rounded-xl border border-border text-sm font-medium text-muted-foreground active:opacity-90"
              >
                役員会ホームに戻る
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:opacity-90"
            >
              議事録を保存して閉会
            </button>
          )}
        </div>
      </AppShell>
    );
  }

  // ── session（デフォルト）────────────────────────────────────────────
  return (
    <AppShell title="役員会議室" subtitle={agenda.topic} hideNav>
      <div className="space-y-3">
        <RoundBadge
          current={round}
          max={MAX_ROUNDS}
          label={isLastRound ? "最終" : "議論中"}
        />

        {isLastRound && (
          <Card variant="advisor">
            <p className="text-[12px] text-amber-300">
              ⚑ 最終ラウンドです。役員が最終見解を述べます。CEOの最終判断をお願いします。
            </p>
          </Card>
        )}

        {/* 議題サマリー */}
        <Card variant="mission">
          <CardHeader label="議題" title={agenda.topic} />
          {agenda.decision && (
            <p className="text-xs text-muted-foreground">決定事項：{agenda.decision}</p>
          )}
        </Card>

        {/* 直前ラウンドのCEOコメント（Round 2/3 で表示） */}
        {prevCEOComment && (
          <Card>
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                CEO
              </span>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[10px] font-semibold text-amber-500">
                  CEOのコメント（Round {round - 1}→{round}）
                </p>
                <p className="text-xs leading-relaxed text-card-foreground">
                  {prevCEOComment}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* 役員発言 */}
        <div className="space-y-2">
          {currentStatements.slice(0, revealedCount).map((stmt) => {
            const exec = getExecutive(stmt.executiveId);
            if (!exec) return null;
            return (
              <StatementCard
                key={`${round}-${stmt.executiveId}`}
                exec={exec}
                content={stmt.content}
              />
            );
          })}

          {!allRevealed && nextExecutive && (
            <div className="flex items-center gap-2 px-1 py-1">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${nextExecutive.colorClass}`}
              >
                {nextExecutive.initial}
              </span>
              <p className="text-xs text-muted-foreground">
                {nextExecutive.name} が発言中
                <span className="ml-1 animate-pulse">…</span>
              </p>
            </div>
          )}
        </div>

        {/* 決議案 + 選択ボタン（全員発言後に表示） */}
        {allRevealed && (
          <>
            <Card variant="advisor" className="!p-0">
              <div className="border-b border-stone-700/80 px-3.5 py-3">
                <CardHeader label={`Round ${round} 決議`} title="決議案" dark />
              </div>
              <div className="space-y-2 px-3.5 py-3">
                <div className="rounded-lg bg-stone-800/40 px-2.5 py-2">
                  <p className="text-[10px] font-medium tracking-wider uppercase text-teal-400/90">
                    結論
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-stone-200">
                    {currentResolution.resolution}
                  </p>
                </div>
                <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-2.5 py-2">
                  <p className="text-[10px] font-medium tracking-wider uppercase text-teal-400/90">
                    次の一手
                  </p>
                  <p className="mt-0.5 text-[13px] font-medium leading-snug text-teal-50">
                    {currentResolution.nextAction}
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-2 pb-4">
              <button
                type="button"
                onClick={handleDecide}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:opacity-90"
              >
                この内容で決定する
              </button>
              {!isLastRound && (
                <button
                  type="button"
                  onClick={() => setPhase("ceo-reply")}
                  className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border text-sm text-muted-foreground active:opacity-80"
                >
                  もう少し議論する →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

// ── サブコンポーネント ────────────────────────────────────────────────

function RoundBadge({
  current,
  max,
  label,
}: {
  current: number;
  max: number;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-6 rounded-full transition-colors ${
              i < current ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
      <span
        className={`text-xs font-semibold ${
          label === "最終"
            ? "text-amber-500"
            : label === "決定"
              ? "text-primary"
              : "text-muted-foreground"
        }`}
      >
        Round {current} / {max}　{label}
      </span>
    </div>
  );
}

function FormField({
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
      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      {multiline ? (
        <textarea
          className={`${inputClassName} min-h-[5rem] resize-none`}
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
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        />
      )}
    </div>
  );
}

function StatementCard({
  exec,
  content,
}: {
  exec: Executive;
  content: string;
}) {
  return (
    <Card>
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${exec.colorClass}`}
        >
          {exec.initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-xs font-semibold text-card-foreground">{exec.name}</span>
            <span className="text-[10px] text-muted-foreground">{exec.role}</span>
          </div>
          <p className="text-xs leading-relaxed text-card-foreground">{content}</p>
        </div>
      </div>
    </Card>
  );
}
