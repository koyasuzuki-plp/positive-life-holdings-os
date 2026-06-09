"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { generateDialogueRound } from "@/lib/board/dialogueEngine";
import { generateProposals, generateVotes, tallyVotes } from "@/lib/board/votingEngine";
import type { BoardContext } from "@/lib/board/dummy";
import { EXECUTIVES, getExecutive } from "@/lib/board/executives";
import type {
  Agenda,
  BoardSession,
  DialogueRound,
  DialogueStance,
  Executive,
  ExecutiveDialogue,
  ExecutiveId,
  Proposal,
  ProposalMetric,
  Vote,
  VotingResult,
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

// form → round1(提案) → round2(反論) → ceo-summary → round3(再提案) → voting → resolved
type Phase = "form" | "round1" | "round2" | "ceo-summary" | "round3" | "voting" | "resolved";

const EMPTY_AGENDA: Agenda = { topic: "", background: "", situation: "", decision: "" };

function loadBoardContext(): BoardContext {
  const today = todayKey();
  const vision = loadVisionMap();
  const position = loadCurrentPosition();
  const scores = loadBusinessScores();
  const nextMilestone = getNextMilestone(vision.milestones, today);
  const appState = loadState();
  const todayLog = appState.logs[today];
  return {
    vision, position, scores, nextMilestone,
    energy: todayLog?.energy ?? null,
    mood:   todayLog?.mood   ?? null,
    kartes: loadKarteMap(),
  };
}

type SessionRoomProps = { onSave: (session: BoardSession) => void };

export function SessionRoom({ onSave }: SessionRoomProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("form");
  const [agenda, setAgenda] = useState<Agenda>(EMPTY_AGENDA);
  const [attendees, setAttendees] = useState<ExecutiveId[]>(() => EXECUTIVES.map((e) => e.id));

  function toggleAttendee(id: ExecutiveId) {
    setAttendees((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const [boardCtx, setBoardCtx] = useState<BoardContext>({});
  const [round1Dialogues, setRound1Dialogues] = useState<ExecutiveDialogue[]>([]);
  const [round2Dialogues, setRound2Dialogues] = useState<ExecutiveDialogue[]>([]);
  const [round3Dialogues, setRound3Dialogues] = useState<ExecutiveDialogue[]>([]);
  const [ceoSummary, setCeoSummary]           = useState("");
  const [currentDialogues, setCurrentDialogues] = useState<ExecutiveDialogue[]>([]);
  const [revealedCount, setRevealedCount]       = useState(0);

  const [proposals, setProposals]         = useState<Proposal[]>([]);
  const [finalistIds, setFinalistIds]     = useState<string[]>(["A", "B"]);
  const [votes, setVotes]                 = useState<Vote[]>([]);
  const [revealedVotes, setRevealedVotes] = useState(0);
  const [votingResult, setVotingResult]   = useState<VotingResult | null>(null);
  const [saved, setSaved]                 = useState(false);

  // 発言アニメーション
  useEffect(() => {
    if (phase !== "round1" && phase !== "round2" && phase !== "round3") return;
    if (revealedCount >= currentDialogues.length) return;
    const t = setTimeout(() => setRevealedCount((c) => c + 1), 750);
    return () => clearTimeout(t);
  }, [phase, revealedCount, currentDialogues.length]);

  // 投票アニメーション
  useEffect(() => {
    if (phase !== "voting") return;
    if (revealedVotes >= votes.length) {
      if (votes.length > 0 && proposals.length > 0) setVotingResult(tallyVotes(votes, proposals));
      return;
    }
    const t = setTimeout(() => setRevealedVotes((v) => v + 1), 850);
    return () => clearTimeout(t);
  }, [phase, revealedVotes, votes.length, proposals, votes]);

  // ── ハンドラ ──────────────────────────────────────────────────────

  const startMeeting = useCallback(() => {
    if (!agenda.topic.trim()) return;
    const ctx = loadBoardContext();
    setBoardCtx(ctx);
    // Proposalをアジェンダから先に生成（会議の中心）
    const props = generateProposals(agenda, ctx);
    setProposals(props);
    const dialogues = generateDialogueRound(attendees, agenda, ctx, 1, props);
    setRound1Dialogues(dialogues);
    setCurrentDialogues(dialogues);
    setRevealedCount(0);
    setSaved(false);
    setPhase("round1");
  }, [agenda, attendees]);

  function handleGoToRound2() {
    const dialogues = generateDialogueRound(attendees, agenda, boardCtx, 2, proposals, round1Dialogues);
    setRound2Dialogues(dialogues);
    setCurrentDialogues(dialogues);
    setRevealedCount(0);
    setPhase("round2");
  }

  function handleGoToCEOSummary() {
    // Round2の支持数をカウントし、上位2案をデフォルト決選候補に
    const counts = new Map<string, number>();
    for (const d of round2Dialogues) {
      if (d.supportedProposalId) {
        counts.set(d.supportedProposalId, (counts.get(d.supportedProposalId) ?? 0) + 1);
      }
    }
    const sorted = [...proposals].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
    setFinalistIds(sorted.slice(0, 2).map((p) => p.id));
    setPhase("ceo-summary");
  }

  function handleStartRound3(summary: string) {
    setCeoSummary(summary);
    // 決選に進む2案のみを渡す
    const finalistProposals = proposals.filter((p) => finalistIds.includes(p.id));
    const dialogues = generateDialogueRound(attendees, agenda, boardCtx, 3, finalistProposals, [], summary);
    setRound3Dialogues(dialogues);
    setCurrentDialogues(dialogues);
    setRevealedCount(0);
    setPhase("round3");
  }

  function handleStartVoting() {
    const finalistProposals = proposals.filter((p) => finalistIds.includes(p.id));
    const allDialogues = [...round1Dialogues, ...round2Dialogues, ...round3Dialogues];
    const vts = generateVotes(attendees, finalistProposals, allDialogues);
    setVotes(vts);
    setRevealedVotes(0);
    setVotingResult(null);
    setPhase("voting");
  }

  function handleConfirmResolution() {
    setPhase("resolved");
  }

  function handleSave() {
    if (!votingResult) return;
    const r1: DialogueRound = { roundNumber: 1, dialogues: round1Dialogues };
    const r2: DialogueRound = { roundNumber: 2, dialogues: round2Dialogues };
    const r3: DialogueRound = {
      roundNumber: 3,
      dialogues: round3Dialogues,
      ceoSummary: ceoSummary.trim() || undefined,
    };
    const winner = proposals.find((p) => p.id === votingResult.winnerId);
    const session: BoardSession = {
      id: `${todayKey()}-${Date.now()}`,
      date: todayKey(),
      agenda,
      attendees,
      dialogueRounds: [r1, r2, r3],
      proposals,
      votingResult,
      finalResolution: winner
        ? `【案${winner.id}】${winner.title}　担当：${winner.assignee}　期限：${winner.deadline}`
        : "",
      finalNextAction: winner?.kpi ?? "",
    };
    onSave(session);
    setSaved(true);
  }

  const allRevealed =
    currentDialogues.length > 0 && revealedCount >= currentDialogues.length;
  const nextExec =
    revealedCount < currentDialogues.length
      ? getExecutive(currentDialogues[revealedCount].executiveId)
      : undefined;

  // ── form ──────────────────────────────────────────────────────────
  if (phase === "form") {
    return (
      <AppShell title="役員会議室" subtitle="議題設定" hideNav>
        <div className="space-y-3">
          <BackLink href="/board" label="役員会に戻る" />
          <Card>
            <CardHeader label="AGENDA" title="今日の議題を設定" />
            <div className="space-y-3">
              <FormField label="議題 *" placeholder="例：新規SNS集客施策の採用可否"
                value={agenda.topic} onChange={(v) => setAgenda((a) => ({ ...a, topic: v }))} />
              <FormField label="背景" placeholder="なぜこの議題が必要か"
                value={agenda.background} onChange={(v) => setAgenda((a) => ({ ...a, background: v }))} multiline />
              <FormField label="現状" placeholder="現在の状況・数値・課題"
                value={agenda.situation} onChange={(v) => setAgenda((a) => ({ ...a, situation: v }))} multiline />
              <FormField label="意思決定したい内容" placeholder="今日の会議で何を決めたいか"
                value={agenda.decision} onChange={(v) => setAgenda((a) => ({ ...a, decision: v }))} multiline />
            </div>
          </Card>

          <Card>
            <CardHeader label="出席役員" title={`${attendees.length}名選択中`} />
            <div className="space-y-1.5">
              {EXECUTIVES.map((exec) => {
                const selected = attendees.includes(exec.id);
                const isOnly = selected && attendees.length === 1;
                return (
                  <button key={exec.id} type="button"
                    onClick={() => !isOnly && toggleAttendee(exec.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left active:opacity-70 ${
                      selected ? "bg-primary/10" : "bg-muted/30 opacity-50"
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${exec.colorClass}`}>
                      {exec.initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-card-foreground">{exec.name}</p>
                      <p className="text-[10px] text-muted-foreground">{exec.businessLabel}</p>
                    </div>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 text-transparent"
                    }`}>✓</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <button type="button" onClick={startMeeting} disabled={!agenda.topic.trim()}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:opacity-90 disabled:opacity-40">
            役員会議を開始する
          </button>
        </div>
      </AppShell>
    );
  }

  // ── ceo-summary ───────────────────────────────────────────────────
  if (phase === "ceo-summary") {
    // Round2のProposal別支持数
    const r2Counts = new Map<string, number>();
    for (const d of round2Dialogues) {
      if (d.supportedProposalId) {
        r2Counts.set(d.supportedProposalId, (r2Counts.get(d.supportedProposalId) ?? 0) + 1);
      }
    }

    const toggleFinalist = (id: string) => {
      setFinalistIds((prev) =>
        prev.includes(id)
          ? prev.length > 1 ? prev.filter((x) => x !== id) : prev  // 最低1案は必ず残す
          : prev.length < 2 ? [...prev, id] : [prev[1], id],        // 2案に収める
      );
    };

    return (
      <AppShell title="役員会議室" subtitle="CEO 2案絞り込み" hideNav>
        <div className="space-y-3">
          <PhaseStepper step={3} />
          <Card variant="mission">
            <CardHeader label="Round2完了 → CEO絞り込み" title="決選に進む2案を選択してください" />
            <p className="text-[11px] text-muted-foreground">
              3案の評価指標とRound2の支持状況を踏まえ、決選投票に進む2案を確定してください。
            </p>
          </Card>

          {/* 各Proposalの評価指標 + 支持数 + 絞り込みボタン */}
          {proposals.map((p) => {
            const isFinal = finalistIds.includes(p.id);
            const r2Count = r2Counts.get(p.id) ?? 0;
            return (
              <div key={p.id} className={`rounded-xl border p-3 transition-all ${
                isFinal ? "border-primary bg-primary/5" : "border-border bg-muted/20 opacity-60"
              }`}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        案{p.id}
                      </span>
                      <span className="text-[11px] font-semibold text-card-foreground">{p.title}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{p.detail}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <span className="text-lg font-bold text-primary">{r2Count}</span>
                    <span className="text-[8px] text-muted-foreground">R2支持</span>
                  </div>
                </div>

                {/* 評価指標グリッド */}
                <div className="mb-2 grid grid-cols-2 gap-1.5">
                  {p.metrics.map((m) => (
                    <MetricCell key={m.label} metric={m} />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => toggleFinalist(p.id)}
                  className={`flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold transition-all ${
                    isFinal
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {isFinal ? "✓ 決選進出" : "除外"}
                </button>
              </div>
            );
          })}

          {/* Round2スタンスサマリー */}
          <Card>
            <CardHeader label="Round2 支持状況" title="各役員の立場" />
            <div className="space-y-1.5">
              {round2Dialogues.map((d) => {
                const exec = getExecutive(d.executiveId);
                if (!exec) return null;
                return (
                  <div key={d.executiveId} className="flex items-center gap-2">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${exec.colorClass}`}>
                      {exec.initial}
                    </span>
                    <span className="flex-1 text-[10px] text-muted-foreground">{exec.name}</span>
                    {d.supportedProposalId && (
                      <span className="rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                        案{d.supportedProposalId}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              CEO論点整理・絞り込み理由
            </label>
            <textarea
              className={`${inputClassName} min-h-[6rem] resize-none`}
              placeholder="例：財務リスク（CFO）と実行速度（COO）のトレードオフが主争点。案Cは先送りリスクが高いため除外。案AとBの2案を決選とする。"
              value={ceoSummary}
              onChange={(e) => setCeoSummary(e.target.value)}
            />
          </div>

          <button type="button" onClick={() => handleStartRound3(ceoSummary)}
            disabled={!ceoSummary.trim() || finalistIds.length < 2}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:opacity-90 disabled:opacity-40">
            決選2案（{finalistIds.map((id) => `案${id}`).join("・")}）でRound3へ →
          </button>
        </div>
      </AppShell>
    );
  }

  // ── voting ────────────────────────────────────────────────────────
  if (phase === "voting") {
    const finalistProposals = proposals.filter((p) => finalistIds.includes(p.id));
    const tally = new Map<string, number>();
    for (const v of votes.slice(0, revealedVotes)) {
      tally.set(v.proposalId, (tally.get(v.proposalId) ?? 0) + 1);
    }
    const allVotesIn = revealedVotes >= votes.length && votes.length > 0;

    return (
      <AppShell title="役員会議室" subtitle="投票" hideNav>
        <div className="space-y-3">
          <PhaseStepper step={5} />
          <Card variant="mission">
            <CardHeader label="決選投票" title={`CEO選定の${finalistProposals.length}案で最終採決`} />
          </Card>

          {finalistProposals.map((p) => {
            const cnt = tally.get(p.id) ?? 0;
            const isWinner = allVotesIn && votingResult?.winnerId === p.id;
            return (
              <ProposalCard key={p.id} proposal={p} voteCount={cnt}
                totalVotes={revealedVotes} isWinner={isWinner} />
            );
          })}

          <div className="space-y-1.5">
            {votes.slice(0, revealedVotes).map((v) => {
              const exec = getExecutive(v.executiveId);
              if (!exec) return null;
              return <VoteRow key={v.executiveId} exec={exec} vote={v} />;
            })}
            {!allVotesIn && <p className="px-1 text-xs text-muted-foreground animate-pulse">投票集計中…</p>}
          </div>

          {allVotesIn && votingResult && (
            <button type="button" onClick={handleConfirmResolution}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:opacity-90">
              決議を確定する →
            </button>
          )}
        </div>
      </AppShell>
    );
  }

  // ── resolved ──────────────────────────────────────────────────────
  if (phase === "resolved") {
    const finalistProposals = proposals.filter((p) => finalistIds.includes(p.id));
    const winner = finalistProposals.find((p) => p.id === votingResult?.winnerId);
    const voteCounts = new Map<string, number>();
    for (const v of votes) voteCounts.set(v.proposalId, (voteCounts.get(v.proposalId) ?? 0) + 1);

    return (
      <AppShell title="役員会議室" subtitle={agenda.topic} hideNav>
        <div className="space-y-3">
          <PhaseStepper step={6} />
          <Card variant="mission">
            <CardHeader label="議題" title={agenda.topic} />
          </Card>

          {winner && (
            <Card variant="advisor" className="!p-0">
              <div className="border-b border-stone-700/80 px-3.5 py-3">
                <CardHeader label="決議" title={winner.title} dark />
              </div>
              <div className="space-y-2 px-3.5 py-3">
                <div className="rounded-lg bg-stone-800/40 px-2.5 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-teal-400/90">決議内容</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-stone-200">{winner.detail}</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <ResolutionItem label="担当者" value={winner.assignee} />
                  <ResolutionItem label="期限"   value={winner.deadline} />
                  <ResolutionItem label="KPI"    value={winner.kpi} />
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader label="投票結果" title={`${votes.length}名で採決`} />
            <div className="space-y-1.5">
              {finalistProposals.map((p) => {
                const cnt = voteCounts.get(p.id) ?? 0;
                const pct = votes.length > 0 ? Math.round((cnt / votes.length) * 100) : 0;
                const isWinner = p.id === votingResult?.winnerId;
                return (
                  <div key={p.id} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-medium ${isWinner ? "text-primary" : "text-muted-foreground"}`}>
                        案{p.id}：{p.title}{isWinner && " ✓"}
                      </span>
                      <span className="text-[11px] font-semibold text-card-foreground">{cnt}票</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full transition-all ${isWinner ? "bg-primary" : "bg-muted-foreground/40"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 議論の軌跡 */}
          <Card>
            <CardHeader label="議論の軌跡" title="3ラウンドの対話" />
            <div className="space-y-2">
              <TraceRow label="Round1：提案" count={round1Dialogues.length} color="border-primary/30" />
              <TraceRow label="Round2：反論・補足" count={round2Dialogues.length} color="border-red-400/40" />
              {ceoSummary && (
                <div className="border-l-2 border-amber-500/50 pl-3">
                  <p className="text-[10px] font-semibold text-amber-500">CEO論点整理</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {ceoSummary.length > 60 ? `${ceoSummary.slice(0, 60)}…` : ceoSummary}
                  </p>
                </div>
              )}
              <TraceRow label={`Round3：決選投票（${finalistIds.map((id) => `案${id}`).join("・")}）`} count={round3Dialogues.length} color="border-primary/30" />
            </div>
          </Card>

          {saved ? (
            <div className="space-y-2">
              <p className="text-center text-xs text-primary">議事録を保存しました ✓</p>
              <button type="button" onClick={() => router.push("/board")}
                className="flex min-h-12 w-full items-center justify-center rounded-xl border border-border text-sm font-medium text-muted-foreground active:opacity-90">
                役員会ホームに戻る
              </button>
            </div>
          ) : (
            <button type="button" onClick={handleSave}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:opacity-90">
              議事録を保存して閉会
            </button>
          )}
        </div>
      </AppShell>
    );
  }

  // ── round1 / round2 / round3（対話フェーズ共通）──────────────────────
  const roundLabel =
    phase === "round1" ? "Round1：各役員が提案" :
    phase === "round2" ? "Round2：反論・補足" :
    `Round3：決選${finalistIds.map((id) => `案${id}`).join("・")}への最終投票`;
  const roundStep = phase === "round1" ? 1 : phase === "round2" ? 2 : 4;

  const nextButton =
    phase === "round1"
      ? { label: "Round2（反論・補足）へ →", action: handleGoToRound2 }
      : phase === "round2"
        ? { label: "CEO論点整理へ →",        action: handleGoToCEOSummary }
        : { label: "投票へ →",               action: handleStartVoting };

  return (
    <AppShell title="役員会議室" subtitle={agenda.topic} hideNav>
      <div className="space-y-3">
        <PhaseStepper step={roundStep} />

        <Card variant="mission">
          <CardHeader label={roundLabel} title={agenda.topic} />
          {agenda.decision && (
            <p className="text-xs text-muted-foreground">決定事項：{agenda.decision}</p>
          )}
        </Card>

        {/* 提案を常時表示（R3はCEO選定の2案のみ） */}
        <ProposalsSummary
          proposals={
            phase === "round3"
              ? proposals.filter((p) => finalistIds.includes(p.id))
              : proposals
          }
          finalistIds={phase === "round3" ? finalistIds : undefined}
        />

        {/* Round3ではCEO論点を先頭に表示 */}
        {phase === "round3" && ceoSummary && (
          <Card>
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">CEO</span>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[10px] font-semibold text-amber-500">CEO論点整理</p>
                <p className="text-xs leading-relaxed text-card-foreground">{ceoSummary}</p>
              </div>
            </div>
          </Card>
        )}

        {/* 役員発言 */}
        <div className="space-y-2">
          {currentDialogues.slice(0, revealedCount).map((d) => {
            const exec = getExecutive(d.executiveId);
            if (!exec) return null;
            return (
              <DialogueCard key={`${phase}-${d.executiveId}`} exec={exec} dialogue={d} />
            );
          })}
          {!allRevealed && nextExec && (
            <div className="flex items-center gap-2 px-1 py-1">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${nextExec.colorClass}`}>
                {nextExec.initial}
              </span>
              <p className="text-xs text-muted-foreground">
                {nextExec.name} が発言中<span className="ml-1 animate-pulse">…</span>
              </p>
            </div>
          )}
        </div>

        {allRevealed && (
          <div className="pb-4">
            <button type="button" onClick={nextButton.action}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:opacity-90">
              {nextButton.label}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ── サブコンポーネント ─────────────────────────────────────────────────

/** 評価指標セル */
function MetricCell({ metric }: { metric: ProposalMetric }) {
  const cls =
    metric.tone === "good"    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
    metric.tone === "caution" ? "bg-amber-500/10   border-amber-500/30   text-amber-400"   :
                                "bg-red-500/10     border-red-500/30     text-red-400";
  return (
    <div className={`rounded border px-2 py-1 ${cls}`}>
      <p className="text-[8px] font-medium opacity-70">{metric.label}</p>
      <p className="text-[9px] font-semibold leading-tight">{metric.value}</p>
    </div>
  );
}

/** 会議中の提案コンパクト表示（評価指標付き） */
function ProposalsSummary({ proposals, finalistIds }: { proposals: Proposal[]; finalistIds?: string[] }) {
  if (proposals.length === 0) return null;
  const label = finalistIds
    ? `CEO選定の決選${proposals.length}案`
    : "各役員はどの案を支持するかを表明します";
  return (
    <Card>
      <CardHeader label="議題に対する候補案" title={label} />
      <div className="space-y-2">
        {proposals.map((p) => (
          <div key={p.id} className="rounded-lg bg-muted/40 px-2.5 py-2">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                案{p.id}
              </span>
              <span className="text-[11px] font-semibold text-card-foreground">{p.title}</span>
            </div>
            <p className="mb-1.5 text-[10px] leading-relaxed text-muted-foreground">{p.detail}</p>
            {/* 評価指標 */}
            <div className="grid grid-cols-2 gap-1">
              {p.metrics.map((m) => (
                <MetricCell key={m.label} metric={m} />
              ))}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-muted-foreground">
              <span>担当：{p.assignee}</span>
              <span>期限：{p.deadline}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const STANCE_STYLE: Record<DialogueStance, { label: string; cls: string }> = {
  提案:   { label: "提案",   cls: "text-violet-400 bg-violet-400/10 border-violet-400/30" },
  賛成:   { label: "賛成",   cls: "text-green-400  bg-green-400/10  border-green-400/30"  },
  反対:   { label: "反対",   cls: "text-red-400    bg-red-400/10    border-red-400/30"    },
  補足:   { label: "補足",   cls: "text-blue-400   bg-blue-400/10   border-blue-400/30"   },
  代替案: { label: "代替案", cls: "text-amber-400  bg-amber-400/10  border-amber-400/30"  },
};

function StanceBadge({ stance }: { stance: DialogueStance }) {
  const s = STANCE_STYLE[stance];
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${s.cls}`}>{s.label}</span>
  );
}

function DialogueCard({ exec, dialogue }: { exec: Executive; dialogue: ExecutiveDialogue }) {
  return (
    <Card>
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${exec.colorClass}`}>
          {exec.initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="text-xs font-semibold text-card-foreground">{exec.name}</span>
            <span className="text-[10px] text-muted-foreground">{exec.role}</span>
            <StanceBadge stance={dialogue.stance} />
          </div>
          <p className="text-xs leading-relaxed text-card-foreground">{dialogue.content}</p>
        </div>
      </div>
    </Card>
  );
}

function ProposalCard({ proposal, voteCount, totalVotes, isWinner }: {
  proposal: Proposal; voteCount: number; totalVotes: number; isWinner: boolean;
}) {
  const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
  return (
    <Card className={isWinner ? "ring-1 ring-primary" : ""}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">案{proposal.id}</span>
            <span className="text-xs font-semibold text-card-foreground">{proposal.title}</span>
            {isWinner && <span className="text-[10px] font-bold text-primary">★ 最多得票</span>}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{proposal.detail}</p>
          {/* 評価指標 */}
          <div className="mt-1.5 grid grid-cols-2 gap-1">
            {proposal.metrics.map((m) => (
              <MetricCell key={m.label} metric={m} />
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1">
            {[["担当", proposal.assignee], ["期限", proposal.deadline], ["KPI", proposal.kpi]].map(([lbl, val]) => (
              <div key={lbl} className="rounded bg-muted/40 px-1.5 py-1">
                <p className="text-[9px] text-muted-foreground">{lbl}</p>
                <p className="line-clamp-2 text-[10px] font-medium text-card-foreground">{val}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center">
          <span className="text-lg font-bold text-primary">{voteCount}</span>
          <span className="text-[9px] text-muted-foreground">票</span>
        </div>
      </div>
      {totalVotes > 0 && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full transition-all duration-500 ${isWinner ? "bg-primary" : "bg-muted-foreground/40"}`}
            style={{ width: `${pct}%` }} />
        </div>
      )}
    </Card>
  );
}

function VoteRow({ exec, vote }: { exec: Executive; vote: Vote }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${exec.colorClass}`}>
        {exec.initial}
      </span>
      <span className="flex-1 text-[11px] text-card-foreground">{exec.name}</span>
      <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
        案{vote.proposalId}
      </span>
    </div>
  );
}

function ResolutionItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-2.5 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-teal-400/90">{label}</p>
      <p className="mt-0.5 text-[12px] font-medium leading-snug text-teal-50">{value}</p>
    </div>
  );
}

function TraceRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`border-l-2 ${color} pl-3`}>
      <p className="text-[10px] font-semibold text-primary">{label}</p>
      <p className="text-[10px] text-muted-foreground">{count}名が発言</p>
    </div>
  );
}

// 7ステップ: 議題(0) R1提案(1) R2反論(2) CEO絞込(3) R3決選(4) 投票(5) 決議(6)
function PhaseStepper({ step }: { step: number }) {
  const steps = ["議題", "R1提案", "R2反論", "CEO絞込", "R3決選", "投票", "決議"];
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto px-1 pb-1">
      {steps.map((s, i) => {
        const isDone = i < step;
        const isCurrent = i === step;
        return (
          <div key={s} className="flex shrink-0 items-center gap-0.5">
            <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold ${
              isDone    ? "bg-primary text-primary-foreground" :
              isCurrent ? "ring-1 ring-primary bg-primary/20 text-primary" :
                          "bg-muted text-muted-foreground"
            }`}>
              {isDone ? "✓" : i + 1}
            </div>
            <span className={`text-[8px] ${isCurrent ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className={`h-px w-2 ${isDone ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FormField({ label, placeholder, value, onChange, multiline }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</label>
      {multiline ? (
        <textarea className={`${inputClassName} min-h-[5rem] resize-none`}
          placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" className={inputClassName}
          placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }} />
      )}
    </div>
  );
}
