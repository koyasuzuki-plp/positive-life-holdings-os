"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { generateDummyStatements, getDummyResolution } from "@/lib/board/dummy";
import { EXECUTIVES, getExecutive } from "@/lib/board/executives";
import type { Agenda, BoardSession, Executive, ExecutiveStatement } from "@/lib/board/types";
import { loadBusinessScores, loadCurrentPosition, loadVisionMap } from "@/lib/board/contextStorage";
import { getNextMilestone } from "@/lib/board/milestone";
import { inputClassName } from "@/components/ui/inputStyles";
import { todayKey } from "@/lib/date";
import { loadState } from "@/lib/storage";

type Phase = "form" | "session";

const EMPTY_AGENDA: Agenda = {
  topic: "",
  background: "",
  situation: "",
  decision: "",
};

type SessionRoomProps = {
  onSave: (session: BoardSession) => void;
};

export function SessionRoom({ onSave }: SessionRoomProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("form");
  const [agenda, setAgenda] = useState<Agenda>(EMPTY_AGENDA);
  const [statements, setStatements] = useState<ExecutiveStatement[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [resolution, setResolution] = useState({ resolution: "", nextAction: "" });
  const [saved, setSaved] = useState(false);

  const startMeeting = useCallback(() => {
    if (!agenda.topic.trim()) return;
    const today = todayKey();
    const vision = loadVisionMap();
    const position = loadCurrentPosition();
    const scores = loadBusinessScores();
    const nextMilestone = getNextMilestone(vision.milestones, today);
    const appState = loadState();
    const todayLog = appState.logs[today];
    const stmts = generateDummyStatements(agenda, {
      vision,
      position,
      scores,
      nextMilestone,
      energy: todayLog?.energy ?? null,
      mood: todayLog?.mood ?? null,
    });
    const res = getDummyResolution(agenda);
    setStatements(stmts);
    setResolution(res);
    setRevealedCount(0);
    setPhase("session");
  }, [agenda]);

  useEffect(() => {
    if (phase !== "session") return;
    if (revealedCount >= statements.length) return;
    const timer = setTimeout(() => {
      setRevealedCount((c) => c + 1);
    }, 700);
    return () => clearTimeout(timer);
  }, [phase, revealedCount, statements.length]);

  const handleSave = useCallback(() => {
    const session: BoardSession = {
      id: `${todayKey()}-${Date.now()}`,
      date: todayKey(),
      agenda,
      statements,
      resolution: resolution.resolution,
      nextAction: resolution.nextAction,
    };
    onSave(session);
    setSaved(true);
  }, [agenda, statements, resolution, onSave]);

  const allRevealed = revealedCount >= statements.length && statements.length > 0;
  const nextExecutive = statements.length > 0 && revealedCount < statements.length
    ? getExecutive(statements[revealedCount].executiveId)
    : undefined;

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

          {/* Attending executives preview */}
          <Card>
            <CardHeader label="出席役員" title={`${EXECUTIVES.length}名`} />
            <div className="flex flex-wrap gap-1.5">
              {EXECUTIVES.map((exec) => (
                <span
                  key={exec.id}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white ${exec.colorClass}`}
                  title={exec.name}
                >
                  {exec.initial}
                </span>
              ))}
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

  return (
    <AppShell title="役員会議室" subtitle={agenda.topic} hideNav>
      <div className="space-y-3">

        {/* Agenda summary */}
        <Card variant="mission">
          <CardHeader label="議題" title={agenda.topic} />
          {agenda.decision && (
            <p className="text-xs text-muted-foreground">決定事項：{agenda.decision}</p>
          )}
        </Card>

        {/* Executive statements */}
        <div className="space-y-2">
          {statements.slice(0, revealedCount).map((stmt) => {
            const exec = getExecutive(stmt.executiveId);
            if (!exec) return null;
            return (
              <StatementCard key={stmt.executiveId} exec={exec} content={stmt.content} />
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

        {/* Resolution */}
        {allRevealed && (
          <Card variant="advisor" className="!p-0">
            <div className="border-b border-stone-700/80 px-3.5 py-3">
              <CardHeader label="会議結果" title="決議" dark />
            </div>
            <div className="space-y-2 px-3.5 py-3">
              <div className="rounded-lg bg-stone-800/40 px-2.5 py-2">
                <p className="text-[10px] font-medium tracking-wider uppercase text-teal-400/90">
                  結論
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-stone-200">
                  {resolution.resolution}
                </p>
              </div>
              <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-2.5 py-2">
                <p className="text-[10px] font-medium tracking-wider uppercase text-teal-400/90">
                  次の一手
                </p>
                <p className="mt-0.5 text-[13px] font-medium leading-snug text-teal-50">
                  {resolution.nextAction}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Save / close */}
        {allRevealed && (
          saved ? (
            <div className="space-y-2">
              <p className="text-center text-xs text-primary">議事録を保存しました</p>
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
          )
        )}
      </div>
    </AppShell>
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
      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</label>
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
