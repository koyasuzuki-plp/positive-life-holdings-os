import type { BoardContext } from "./dummy";
import type {
  Agenda,
  ExecutiveDialogue,
  ExecutiveId,
  Proposal,
  Vote,
  VotingResult,
} from "./types";

// ── 提案生成（アジェンダから3案を常時生成）─────────────────────────────

export function generateProposals(
  agenda: Agenda,
  ctx: BoardContext,
): Proposal[] {
  const topic = agenda.topic ?? "今日の議題";
  const { nextMilestone, scores } = ctx;

  const isUrgent =
    /今すぐ|急ぎ|今週|緊急/.test(topic) ||
    /今すぐ|急ぎ|今週|緊急/.test(agenda.situation ?? "");
  const deadlineA = isUrgent ? "今週末" : "今月末";

  // 案A：即時実行案
  const proposalA: Proposal = {
    id: "A",
    title: `即時実行案：${topic}`,
    detail: `「${topic}」を48時間以内に着手する。担当者・期日・週次KPIを本日中に確定し、${deadlineA}までに完了を目指す。`,
    proposedBy: "coo",
    assignee: "COO（執行責任）",
    deadline: deadlineA,
    kpi: agenda.decision
      ? `「${agenda.decision}」の達成確認・週次進捗報告100%`
      : `週次進捗報告100%・${deadlineA}時点で完了率50%以上`,
    metrics: [
      { label: "期待効果",       value: "高（即着手・即成果）",   tone: "good"    },
      { label: "実行難易度",     value: "高（全力投入が必要）",   tone: "caution" },
      { label: "実行速度",       value: "即日（48時間以内着手）", tone: "good"    },
      { label: "ビジョン整合性", value: "中（短期成果重視型）",   tone: "caution" },
    ],
  };

  // 案B：実験検証案
  const msNote = nextMilestone
    ? `「${nextMilestone.item.title}」達成への`
    : "";
  const proposalB: Proposal = {
    id: "B",
    title: `実験検証案：30日テストから開始`,
    detail: `「${topic}」を30日間の最小実験として設計。仮説・測定指標・終了条件を今週末までに定義し、リスクを最小化しながら学習を最速化する。結果を踏まえて本格投資を判断する。`,
    proposedBy: "strategy",
    assignee: "未来戦略室（実験設計）",
    deadline: "今週末に実験設計完了・来月末に結果評価",
    kpi: `${msNote}仮説検証2件以上・週次学習ログ記録・来月末に成果レポート`,
    metrics: [
      { label: "期待効果",       value: "中（実験後に本格化）",   tone: "caution" },
      { label: "実行難易度",     value: "低（最小実験から開始）", tone: "good"    },
      { label: "実行速度",       value: "中期（30日で仮説検証）", tone: "caution" },
      { label: "ビジョン整合性", value: "高（学習型成長と整合）", tone: "good"    },
    ],
  };

  // 案C：条件整備案
  const avgScore = scores
    ? Math.round(
        Object.values(scores).reduce((s, b) => s + b.score, 0) /
          Object.values(scores).length,
      )
    : null;
  const proposalC: Proposal = {
    id: "C",
    title: `条件整備案：リスク解消後に着手`,
    detail: `「${topic}」は直ちに着手しない。①ROI試算・回収見通し6ヶ月以内の確認②キャッシュフロー安全性の確保③実行リソースの整備、を完了した後に改めて着手判断を行う。`,
    proposedBy: "cfo",
    assignee: "CFO（条件整備責任）",
    deadline: "条件達成後14日以内に役員会で再議",
    kpi: avgScore != null
      ? `全事業平均スコア${avgScore}点維持・ROI試算書提出・撤退条件の数値定義`
      : `ROI試算書提出・撤退条件の数値定義・キャッシュフロープラス維持`,
    metrics: [
      { label: "期待効果",       value: "低（着手先送りリスク）", tone: "risk"    },
      { label: "実行難易度",     value: "最低（条件整備のみ）",   tone: "good"    },
      { label: "実行速度",       value: "低（条件達成まで待機）", tone: "risk"    },
      { label: "ビジョン整合性", value: "低（機会損失の懸念）",   tone: "risk"    },
    ],
  };

  return [proposalA, proposalB, proposalC];
}

// ── 投票ロジック ──────────────────────────────────────────────────────

function pickVote(
  executiveId: ExecutiveId,
  proposals: Proposal[],
  dialogues: ExecutiveDialogue[],
): string {
  const findId = (id: string) => proposals.find((p) => p.id === id)?.id;

  // 全発言から「最後に支持した案」を優先使用（R3発言 > R2 > R1）
  const supported = dialogues
    .filter((d) => d.executiveId === executiveId && d.supportedProposalId)
    .at(-1)?.supportedProposalId;
  if (supported && proposals.find((p) => p.id === supported)) return supported;

  // フォールバック：役割ベースのデフォルト投票（finalistから優先順に選択）
  switch (executiveId) {
    case "coo":          return findId("A") ?? findId("B") ?? proposals[0].id;
    case "strategy":     return findId("B") ?? findId("A") ?? proposals[0].id;
    case "future-kouya": return findId("B") ?? findId("A") ?? proposals[0].id;
    case "cfo":          return findId("C") ?? findId("B") ?? proposals[0].id;
    case "cho":          return findId("C") ?? findId("B") ?? proposals[0].id;
    default: {
      const lastDialogue = dialogues.filter((d) => d.executiveId === executiveId).at(-1);
      const stance = lastDialogue?.stance;
      if (stance === "賛成")   return findId("A") ?? proposals[0].id;
      if (stance === "反対")   return findId("C") ?? findId("B") ?? proposals[0].id;
      if (stance === "代替案") return findId("B") ?? proposals[0].id;
      return findId("B") ?? proposals[0].id;
    }
  }
}

export function generateVotes(
  attendees: ExecutiveId[],
  proposals: Proposal[],
  dialogues: ExecutiveDialogue[],
): Vote[] {
  return attendees.map((executiveId) => ({
    executiveId,
    proposalId: pickVote(executiveId, proposals, dialogues),
  }));
}

export function tallyVotes(votes: Vote[], proposals: Proposal[]): VotingResult {
  const tally = new Map<string, number>();
  for (const v of votes) {
    tally.set(v.proposalId, (tally.get(v.proposalId) ?? 0) + 1);
  }
  let winnerId = proposals[0].id;
  let maxVotes = 0;
  for (const [id, count] of tally.entries()) {
    if (count > maxVotes) {
      maxVotes = count;
      winnerId = id;
    }
  }
  return { proposals, votes, winnerId };
}
