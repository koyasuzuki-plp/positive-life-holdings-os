import type {
  BusinessScores,
  CurrentPosition,
  VisionMap,
} from "./context";
import { BUSINESS_LABELS, HORIZON_LABELS } from "./context";
import type { NextMilestone } from "./milestone";
import type { Agenda, ExecutiveId, ExecutiveKarte, ExecutiveStatement, KarteMap } from "./types";
import { buildRoundPrefix } from "./roundEngine";

export type BoardContext = {
  vision?: VisionMap;
  position?: CurrentPosition;
  scores?: BusinessScores;
  nextMilestone?: NextMilestone | null;
  energy?: number | null;
  mood?: number | null;
  kartes?: KarteMap;
};

function hasKarte(k: ExecutiveKarte | undefined): boolean {
  return !!(k && (k.currentStatus || k.goal || k.kpis || k.challenges));
}

// ── 未来のこうや ────────────────────────────────────────────────
function futureKouya(agenda: Agenda, ctx: BoardContext): string {
  const topic = agenda.topic || "今日の議題";
  const { position, nextMilestone, vision, kartes } = ctx;
  const karte = kartes?.["future-kouya"];

  if (hasKarte(karte)) {
    const k = karte!;
    const visionKeyword = vision?.visionKeywords?.[0] ?? "";
    const statusPart = k.currentStatus && k.goal
      ? `${k.currentStatus}という現状から、目標「${k.goal}」に向かうにあたり`
      : k.currentStatus
        ? `${k.currentStatus}という現状において`
        : `目標「${k.goal}」の実現に向け`;
    const challengePart = k.challenges
      ? `、最大の課題は「${k.challenges}」です。`
      : `、経営判断の精度を上げることが必要です。`;
    const closing = visionKeyword
      ? `${visionKeyword}を実現した私から問います。「${topic}」はこの課題を突破できる判断ですか？数字ではなくビジョンで選んでください。`
      : `「${topic}」はこの課題を越えるための判断ですか？恐れではなくビジョンで選んでください。`;
    return `${statusPart}${challengePart} ${closing}`;
  }

  const part1 = position?.monthlyRevenue
    ? `現在地：月商${position.monthlyRevenue}、最大の壁は「${position.mainChallenge || "未記録"}」。`
    : "現在地が未記録です。まず現在地を記録してから意思決定してください。";

  const part2 = nextMilestone
    ? `次の関門は${nextMilestone.monthsAway > 0 ? `${nextMilestone.monthsAway}ヶ月後` : "今月"}（${HORIZON_LABELS[nextMilestone.item.horizon]}）の「${nextMilestone.item.title}」。今日の議題「${topic}」は${agenda.decision ? "この達成に直結します。" : "この関門への道筋と整合しているか確認してください。"}`
    : `マイルストーンが未設定です。「${topic}」を議論する前に、次の関門を定義することを強く推奨します。`;

  const keyword = vision?.visionKeywords?.[0] ?? "";
  const part3 = keyword
    ? `${keyword}を実現した私から言います。${agenda.decision ? `「${agenda.decision}」` : "今日の判断"}は、ビジョンに近づくものか、遠ざかるものか。その一点で選んでください。`
    : "迷ったら、より大きな自分が選ぶほうへ。恐れではなく、ビジョンで判断してください。";

  return `${part1} ${part2} ${part3}`;
}

// ── CFO ────────────────────────────────────────────────────────
function cfo(agenda: Agenda, ctx: BoardContext): string {
  const topic = agenda.topic || "今日の議題";
  const { scores, kartes } = ctx;
  const karte = kartes?.["cfo"];

  if (hasKarte(karte)) {
    const k = karte!;
    const statusPart = k.currentStatus ? `${k.currentStatus}の状態で` : "財務状況を踏まえ";
    const kpiPart = k.kpis ? `、管理KPI「${k.kpis}」を基準にすると` : "";
    const challengePart = k.challenges
      ? `、課題「${k.challenges}」が財務的リスクになっています。`
      : `、財務的な裏付けの確認が必要です。`;
    const actionPart = k.kpis
      ? `「${topic}」への判断は、まず「${k.kpis}」への影響を数値で試算してから行ってください。数値なき決断は経営ではなく賭けです。`
      : `「${topic}」への投資判断前に、キャッシュフローへの影響を必ず確認してください。数値なき決断は経営ではなく賭けです。`;
    return `財務の視点から。${statusPart}${kpiPart}${challengePart} ${actionPart}`;
  }

  if (!scores) {
    return `財務的観点から分析します。「${topic}」に関し、まずキャッシュフローへの影響確認が必要です。短期的なコスト増があるとしても、6〜12ヶ月の回収見通しがあるか検討してください。リスクを取るなら上限を決め、その金額内で実行することを推奨します。数値の根拠なき決断は経営ではなく賭けです。`;
  }
  const ids = Object.values(scores);
  const avg = Math.round(ids.reduce((s, b) => s + b.score, 0) / ids.length);
  const lowest = ids.sort((a, b) => a.score - b.score)[0];
  return `財務的観点から。全事業平均スコア${avg}/100。最低スコアは${BUSINESS_LABELS[lowest.businessId]}の${lowest.score}点で、ここが財務的リスクの震源地です。「${topic}」の意思決定に際し、このボトルネックを解消するか温存するかを明確にしてください。数値の根拠なき決断は経営ではなく賭けです。`;
}

// ── COO ────────────────────────────────────────────────────────
function coo(agenda: Agenda, ctx: BoardContext): string {
  const topic = agenda.topic || "今日の議題";
  const { scores, kartes } = ctx;
  const karte = kartes?.["coo"];
  const situation = agenda.situation;

  if (hasKarte(karte)) {
    const k = karte!;
    const statusPart = k.currentStatus ? `${k.currentStatus}という執行状況で` : "執行面では";
    const challengePart = k.challenges
      ? `、「${k.challenges}」という課題を抱えています。`
      : `、実行体制の整備が必要です。`;
    const actionPart = k.challenges
      ? `「${topic}」を前進させるには、まず「${k.challenges}」への対処を今日中に一手決めてください。担当・期日・アクションの3点を確定することが実行の起点です。`
      : `「${topic}」の実行を今日中に誰が・いつまでに・何をするかで定義してください。`;
    return `執行の観点から。${statusPart}${challengePart} ${actionPart}`;
  }

  if (scores) {
    const highestScore = Object.values(scores).sort((a, b) => b.score - a.score)[0];
    return `執行の観点から。「${topic}」の実行には48時間以内に担当・期日・アクションを確定させることが重要です。現在スコア最高の${BUSINESS_LABELS[highestScore.businessId]}（${highestScore.score}点）のナレッジを他事業へ横展開することも実行オプションとして検討してください。${situation ? `現状「${situation.slice(0, 25)}…」を踏まえ、` : ""}まず最小の完了可能なアクションを今日中に起こしてください。`;
  }
  return `執行の観点から。「${topic}」を実行に移すには、誰が・いつまでに・何をするかを48時間以内に確定させることが重要です。${situation ? `現状「${situation.slice(0, 25)}…」という状況を踏まえ、` : ""}まず最小の完了可能なアクションを今日中に起こしてください。`;
}

// ── CHO ────────────────────────────────────────────────────────
function cho(agenda: Agenda, ctx: BoardContext): string {
  const topic = agenda.topic || "今日の議題";
  const { energy, mood, kartes } = ctx;
  const karte = kartes?.["cho"];

  if (hasKarte(karte)) {
    const k = karte!;
    const statusPart = k.currentStatus ? `${k.currentStatus}の状態で` : "健康面では";
    const challengePart = k.challenges
      ? `、「${k.challenges}」が人的資本のリスクです。`
      : `、持続可能な負荷設計が必要です。`;
    const goalPart = k.goal
      ? `目標「${k.goal}」に向けて体制を整えながら、`
      : "";
    const actionPart = k.challenges
      ? `${goalPart}「${topic}」の実行タイミングは「${k.challenges}」が解消されてから、またはその解消と並行して設計してください。燃え尽きた後の回復コストは、今の予防コストの数倍になります。`
      : `${goalPart}「${topic}」の実行負荷がCEOの体力を超えないか確認してください。`;
    return `健康・人的資本の観点から。${statusPart}${challengePart} ${actionPart}`;
  }

  const energyText = energy != null ? `エネルギー${energy}/5` : "エネルギー未記録";
  const moodText = mood != null ? `・気分${mood}/5` : "";
  const condition = energy != null && energy <= 2
    ? `現在低エネルギー状態のため、「${topic}」の実行タイミングを翌朝に後倒しにすることを推奨します。`
    : energy != null && energy >= 4
      ? `コンディション良好（${energyText}${moodText}）。「${topic}」の高難度タスクは今日の午前に集中してください。`
      : `${energyText}${moodText}。「${topic}」の実行タイミングは代表の体調ピーク時に合わせてください。`;
  return `健康・人的資本の観点から。${condition} 燃え尽きた後の回復コストは、今の予防コストの数倍になります。持続可能な負荷設計を優先してください。`;
}

// ── 事業部長共通 ────────────────────────────────────────────────
function businessExec(
  topic: string,
  businessId: keyof typeof BUSINESS_LABELS,
  scores: BusinessScores | undefined,
  visionNote: string,
  karte?: ExecutiveKarte,
): string {
  const label = BUSINESS_LABELS[businessId];

  if (hasKarte(karte)) {
    const k = karte!;
    const gapPart = k.currentStatus && k.goal
      ? `${k.currentStatus}で、目標「${k.goal}」まで`
      : k.currentStatus
        ? `${k.currentStatus}の状況で`
        : `目標「${k.goal}」に向かう中で`;
    const challengePart = k.challenges
      ? `「${k.challenges}」が課題です。`
      : `前進が必要な状況です。`;
    const proposalPart = k.challenges
      ? `「${topic}」に対しては、「${k.challenges}」を解消する方向での施策設計を提案します。`
      : k.goal
        ? `「${topic}」は「${k.goal}」の達成に直結するか判断してください。`
        : `「${topic}」への対応を${label}事業の観点から検討してください。`;
    const actionPart = k.challenges
      ? `今日やるべきことは、「${k.challenges}」に直接手を打つ最小アクションを一つ決定することです。${visionNote}`
      : k.kpis
        ? `今日やるべきことは、KPI「${k.kpis}」を動かす最初の一手を決定することです。${visionNote}`
        : `今日中に${label}事業としての具体的な次の一手を決定してください。${visionNote}`;
    return `${label}事業の視点から。${gapPart}${challengePart} ${proposalPart} ${actionPart}`;
  }

  if (!scores?.[businessId]) {
    return `${label}事業の視点から。「${topic}」との事業連携可能性を検討しました。ブランドの一貫性を維持しながら進めることで既存顧客の信頼を守れます。${visionNote}`;
  }
  const s = scores[businessId];
  const phase =
    s.score >= 70
      ? "攻勢段階"
      : s.score >= 40
        ? "改善フェーズ"
        : "立て直し最優先";
  const focus = s.monthlyFocus ? `今月の重点は「${s.monthlyFocus}」` : "今月の重点が未設定";
  const next = s.nextAction ? `次の一手は「${s.nextAction}」` : "";
  return `${label}事業の視点から。現在スコア${s.score}/100・${phase}。${focus}。${next ? `${next}。` : ""}「${topic}」はこの方向性と整合しているか確認し、${phase === "立て直し最優先" ? "新規コミットより現事業の立て直しを優先してください。" : "相乗効果を最大化する形で実行してください。"}${visionNote}`;
}

// ── 未来戦略室 ──────────────────────────────────────────────────
function strategy(agenda: Agenda, ctx: BoardContext): string {
  const topic = agenda.topic || "今日の議題";
  const { nextMilestone, vision, kartes } = ctx;
  const karte = kartes?.["strategy"];

  if (hasKarte(karte)) {
    const k = karte!;
    const statusPart = k.currentStatus ? `${k.currentStatus}という戦略状況で` : "戦略的観点から";
    const challengePart = k.challenges
      ? `、最大の戦略課題は「${k.challenges}」です。`
      : `、中長期の方向性を定める必要があります。`;
    const goalPart = k.goal ? `目指すべき方向は「${k.goal}」。` : "";
    const keywords = vision?.visionKeywords?.join("・") ?? "";
    const experimentPart = k.challenges
      ? `${keywords ? `ビジョン「${keywords}」の実現に向け、` : ""}「${topic}」は「${k.challenges}」の突破口として30日間の小実験に落とし込むことを提案します。まず実験の仮説・測定指標・終了条件を今日中に定義してください。`
      : `${keywords ? `ビジョン「${keywords}」の実現に向け、` : ""}「${topic}」を30日の実験として設計し、仮説と測定指標を今日中に定義してください。`;
    return `未来戦略室から総括します。${statusPart}${challengePart} ${goalPart}${experimentPart}`;
  }

  const keywords = vision?.visionKeywords?.join("・") ?? "";
  const milestoneNote = nextMilestone
    ? `${HORIZON_LABELS[nextMilestone.item.horizon]}後のマイルストーン「${nextMilestone.item.title}」達成を逆算すると、今日「${topic}」を前進させることは必須条件です。`
    : `マイルストーンを設定してから、この議題の優先順位を再評価することを推奨します。`;
  return `未来戦略室から総括します。${milestoneNote} ${keywords ? `ビジョン「${keywords}」の実現に向け、` : ""}不確実性の中での最善手は「小さく試し、学びを速く回す」こと。まず30日の実験として設計することを提案します。`;
}

// ── メイン関数 ──────────────────────────────────────────────────
export function generateDummyStatements(
  agenda: Agenda,
  ctx: BoardContext = {},
): ExecutiveStatement[] {
  const topic = agenda.topic || "今日の議題";
  const { vision, scores, kartes } = ctx;
  const visionKeyword = vision?.visionKeywords?.[0] ?? "";
  const visionNote = visionKeyword
    ? ` ビジョン「${visionKeyword}」との接続を意識して実行してください。`
    : "";

  return [
    { executiveId: "future-kouya", content: futureKouya(agenda, ctx) },
    { executiveId: "cfo",          content: cfo(agenda, ctx) },
    { executiveId: "coo",          content: coo(agenda, ctx) },
    { executiveId: "cho",          content: cho(agenda, ctx) },
    { executiveId: "orivis",       content: businessExec(topic, "orivis",     scores, visionNote, kartes?.["orivis"]) },
    { executiveId: "diet",         content: businessExec(topic, "diet",       scores, visionNote, kartes?.["diet"]) },
    { executiveId: "ai",           content: businessExec(topic, "ai",         scores, visionNote, kartes?.["ai"]) },
    { executiveId: "kirei",        content: businessExec(topic, "kirei",      scores, visionNote, kartes?.["kirei"]) },
    { executiveId: "publishing",   content: businessExec(topic, "publishing", scores, visionNote, kartes?.["publishing"]) },
    { executiveId: "strategy",     content: strategy(agenda, ctx) },
  ];
}

export function getDummyResolution(
  agenda: Agenda,
  ctx: BoardContext = {},
): { resolution: string; nextAction: string } {
  const topic = agenda.topic || "今日の議題";
  const { kartes } = ctx;

  const topChallenge = kartes
    ? (Object.values(kartes) as (ExecutiveKarte | undefined)[]).find((k) => k?.challenges)?.challenges
    : undefined;

  const resolution = agenda.decision
    ? `「${topic}」について全役員の議論を経て、「${agenda.decision}」を採択することを決議します。${topChallenge ? `特に「${topChallenge}」の解決を優先課題として位置づけ、この解決と連動させて実行します。` : "リスクを管理しながら最小単位での実行から開始します。"}`
    : `「${topic}」について全役員の意見を統合した結果、${topChallenge ? `「${topChallenge}」への対処を最初のステップとして前進することを決議します。` : "リスクを管理しながら前進することを決議します。最小単位での実行から開始し、30日後に成果を計測します。"}`;

  const nextAction = agenda.decision
    ? `「${agenda.decision}」を実行する。${topChallenge ? `まず「${topChallenge}」に対処する具体アクションを本日中に決定し着手する。` : "担当者と期日を本日中に確定する。"}`
    : topChallenge
      ? `「${topChallenge}」を解消する最初のアクションを本日中に一つ決定し、実行する。`
      : `「${topic}」の方向性を本日中に確定し、明日から行動を開始する。`;

  return { resolution, nextAction };
}

// ── ラウンド2/3用：CEO コメントを踏まえた再発言 ────────────────────
export function generateRoundStatements(
  agenda: Agenda,
  ceoComment: string,
  roundNumber: number,
  ctx: BoardContext,
  executiveIds: ExecutiveId[],
): ExecutiveStatement[] {
  const topic = agenda.topic || "今日の議題";
  const { vision, scores, kartes } = ctx;
  const visionKeyword = vision?.visionKeywords?.[0] ?? "";
  const visionNote = visionKeyword
    ? ` ビジョン「${visionKeyword}」との接続を意識して実行してください。`
    : "";
  const prefix = buildRoundPrefix(ceoComment, roundNumber);

  return executiveIds.map((id): ExecutiveStatement => {
    let base = "";
    switch (id) {
      case "future-kouya":
        base = futureKouya(agenda, ctx);
        break;
      case "cfo":
        base = cfo(agenda, ctx);
        break;
      case "coo":
        base = coo(agenda, ctx);
        break;
      case "cho":
        base = cho(agenda, ctx);
        break;
      case "strategy":
        base = strategy(agenda, ctx);
        break;
      default: {
        const bizId = id as "orivis" | "diet" | "ai" | "kirei" | "publishing";
        base = businessExec(topic, bizId, scores, visionNote, kartes?.[bizId]);
      }
    }
    return { executiveId: id, content: `${prefix} ${base}` };
  });
}

// ── ラウンド2/3用：CEO コメントを反映した決議案 ────────────────────
export function generateRoundResolution(
  agenda: Agenda,
  ceoComment: string,
  roundNumber: number,
  ctx: BoardContext = {},
): { resolution: string; nextAction: string } {
  const topic = agenda.topic || "今日の議題";
  const { kartes } = ctx;
  const short = ceoComment.trim().length > 0
    ? (ceoComment.length > 22 ? `${ceoComment.slice(0, 22)}…` : ceoComment)
    : "前回の議論";
  const isFinal = roundNumber >= 3;

  const topChallenge = kartes
    ? (Object.values(kartes) as (ExecutiveKarte | undefined)[]).find((k) => k?.challenges)?.challenges
    : undefined;

  return {
    resolution: isFinal
      ? `「${short}」というCEOの最終指示を受け、全役員が最終見解を統合しました。「${topic}」について${topChallenge ? `「${topChallenge}」を起点とした` : ""}実行可能な最小アクションを即時開始します。`
      : `CEOの「${short}」を踏まえ、「${topic}」への見解を更新しました。${topChallenge ? `「${topChallenge}」への対処を軸に` : ""}前回より実行精度を高めた形で前進することを決議します。`,
    nextAction: agenda.decision
      ? `「${agenda.decision}」に対し、「${short}」を軸に${topChallenge ? `「${topChallenge}」の解消から着手する。` : "本日中に最初のアクションを実行する。"}`
      : topChallenge
        ? `「${short}」の方向性で「${topChallenge}」を解消する最初の一手を本日中に実行する。`
        : `「${short}」の方向性で本日中に最初の一手を実行し、30日後に役員会で進捗を報告する。`,
  };
}
