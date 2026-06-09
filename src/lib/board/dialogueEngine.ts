import { BUSINESS_LABELS } from "./context";
import { getExecutive } from "./executives";
import type { BoardContext } from "./dummy";
import type {
  Agenda,
  DialogueStance,
  ExecutiveDialogue,
  ExecutiveId,
  ExecutiveKarte,
  Proposal,
} from "./types";

// ── 役員ごとのデフォルト支持案（利用可能なProposalから優先順に選択）────────

function defaultSupport(
  executiveId: ExecutiveId,
  ctx: BoardContext,
  proposals: Proposal[],
): string {
  const find = (id: string) => proposals.find((p) => p.id === id)?.id;
  switch (executiveId) {
    case "coo":          return find("A") ?? find("B") ?? proposals[0].id;
    case "future-kouya": return find("B") ?? find("A") ?? proposals[0].id;
    case "strategy":     return find("B") ?? find("A") ?? proposals[0].id;
    case "cfo":          return find("C") ?? find("B") ?? proposals[0].id;
    case "cho":          return find("C") ?? find("B") ?? proposals[0].id;
    default: {
      const bizId = executiveId as "orivis" | "diet" | "ai" | "kirei" | "publishing";
      const score = ctx.scores?.[bizId]?.score ?? 50;
      if (score >= 70) return find("A") ?? find("B") ?? proposals[0].id;
      if (score >= 40) return find("B") ?? find("A") ?? proposals[0].id;
      return find("C") ?? find("B") ?? proposals[0].id;
    }
  }
}

function defaultOppose(supportId: string, proposals: Proposal[]): string {
  // 支持案の対極を反対案とする（利用可能なProposalから選択）
  const order = supportId === "A" ? ["C", "B"] :
                supportId === "C" ? ["A", "B"] : ["C", "A"];
  for (const id of order) {
    const found = proposals.find((p) => p.id === id)?.id;
    if (found) return found;
  }
  return proposals.find((p) => p.id !== supportId)?.id ?? supportId;
}

function getMetric(proposal: Proposal | undefined, label: string): string {
  return proposal?.metrics?.find((m) => m.label === label)?.value ?? "未評価";
}

// ── Round1：各役員が提案A/B/Cへの立場を表明 ──────────────────────────

function buildRound1(
  id: ExecutiveId,
  karte: ExecutiveKarte | undefined,
  ctx: BoardContext,
  agenda: Agenda,
  proposals: Proposal[],
  supportId: string,
): string {
  const topic = agenda.topic ?? "今日の議題";
  const { scores, position, energy, mood, nextMilestone, vision } = ctx;
  const visionKw = vision?.visionKeywords?.[0] ?? "";
  const supported = proposals.find((p) => p.id === supportId);
  const opposeId  = defaultOppose(supportId, proposals);
  const opposed   = proposals.find((p) => p.id === opposeId);

  // カルテ情報の抽出
  const status    = karte?.currentStatus ?? null;
  const goal      = karte?.goal          ? `（目標：${karte.goal}）`          : "";
  const kpis      = karte?.kpis          ? `、管理KPI「${karte.kpis}」`        : "";
  const challenge = karte?.challenges    ? `、課題「${karte.challenges}」`     : "";

  let situationLine = "";
  let supportReason = "";
  let opposeReason  = "";

  switch (id) {
    case "future-kouya": {
      const pos = position?.monthlyRevenue ? `月商${position.monthlyRevenue}` : "現在地未入力";
      const ms  = nextMilestone ? `次マイルストーン「${nextMilestone.item.title}」。` : "";
      situationLine = `${status ?? pos}${goal}${kpis}${challenge}。${ms}`;
      supportReason = `案${supportId}「${supported?.title ?? ""}」を支持します。${visionKw ? `「${visionKw}」実現に最も整合するアプローチです。` : "ビジョン軸での判断として最適です。"}`;
      opposeReason  = `案${opposeId}「${opposed?.title ?? ""}」は${opposeId === "C" ? "判断先送りリスクが高く" : "フル投資の不確実性が高く"}、現段階では適切ではないと考えます。`;
      break;
    }
    case "cfo": {
      const avg = scores
        ? Math.round(Object.values(scores).reduce((s, b) => s + b.score, 0) / Object.values(scores).length)
        : null;
      situationLine = `${status ?? "財務データ未入力"}${goal}${kpis}${challenge}。全事業平均スコア${avg ?? "未入力"}/100。`;
      supportReason = `案${supportId}「${supported?.title ?? ""}」を支持します。${karte?.challenges ? `財務課題「${karte.challenges}」がある中で` : ""}ROI試算と撤退条件を事前定義できる唯一の案です。数値根拠のない前進は経営ではなく賭けです。`;
      opposeReason  = `案${opposeId}「${opposed?.title ?? ""}」は財務的根拠が不十分で、キャッシュフローリスクを増大させる可能性があります。`;
      break;
    }
    case "coo": {
      situationLine = `${status ?? "執行データ未入力"}${goal}${kpis}${challenge}。`;
      supportReason = `案${supportId}「${supported?.title ?? ""}」を支持します。担当・期日・KPIを48時間以内に確定し、即座に実行できる体制を整えます。${karte?.kpis ? `進捗KPI「${karte.kpis}」でトラッキング。` : ""}`;
      opposeReason  = `案${opposeId}「${opposed?.title ?? ""}」は実行の遅延を招きます。${karte?.challenges ? `執行課題「${karte.challenges}」を抱える今こそ` : ""}スピードが最大の競争優位です。`;
      break;
    }
    case "cho": {
      const e = energy != null ? `エネルギー${energy}/5` : "";
      const m = mood   != null ? `気分${mood}/5`         : "";
      const cond = [e, m].filter(Boolean).join("・");
      situationLine = `${status ?? "健康データ未入力"}${goal}${kpis}${challenge}。${cond ? `CEO現在：${cond}。` : ""}`;
      supportReason = `案${supportId}「${supported?.title ?? ""}」を支持します。持続可能な負荷設計が組み込まれており、燃え尽きリスクを最小化できます。${karte?.kpis ? `「${karte.kpis}」による健康管理と両立可能です。` : ""}`;
      opposeReason  = `案${opposeId}「${opposed?.title ?? ""}」は${opposeId === "A" ? "即時着手による過負荷リスクが高く" : "条件整備の遅延がCEO稼働機会を失わせ"}、人的資本の観点から懸念します。`;
      break;
    }
    case "strategy": {
      const ms = nextMilestone
        ? `次マイルストーン「${nextMilestone.item.title}」（${nextMilestone.monthsAway > 0 ? `${nextMilestone.monthsAway}ヶ月後` : "今月"}）。`
        : "マイルストーン未設定。";
      situationLine = `${status ?? "戦略データ未入力"}${goal}${kpis}${challenge}。${ms}`;
      supportReason = `案${supportId}「${supported?.title ?? ""}」を支持します。不確実性の高い「${topic}」において、最速で学習を得ながらリスクを最小化できる唯一の戦略的選択肢です。${karte?.kpis ? `実験KPI「${karte.kpis}」で効果を測定できます。` : ""}`;
      opposeReason  = `案${opposeId}「${opposed?.title ?? ""}」は${opposeId === "A" ? "検証なしのフル投資で失敗コストが高く" : "判断を先送りにして機会損失を生む"}リスクがあります。`;
      break;
    }
    default: {
      const bizId = id as "orivis" | "diet" | "ai" | "kirei" | "publishing";
      const label = BUSINESS_LABELS[bizId];
      const sc    = scores?.[bizId];
      const phase = sc
        ? sc.score >= 70 ? "攻勢段階" : sc.score >= 40 ? "改善フェーズ" : "立て直し最優先"
        : "未測定";
      const st = status
        ? `${label}事業：${status}（目標：${karte?.goal ?? "未設定"}）`
        : `${label}事業スコア${sc?.score ?? "未入力"}/100`;
      situationLine = `${st}・${phase}。今月重点：${sc?.monthlyFocus || "未設定"}${kpis}${challenge}。`;
      supportReason = `案${supportId}「${supported?.title ?? ""}」を支持します。${label}事業の現状（スコア${sc?.score ?? "未入力"}/100）と${karte?.kpis ? `KPI「${karte.kpis}」` : "事業目標"}への貢献が最も高いと判断します。${sc?.nextAction ? `直近アクション「${sc.nextAction}」との統合も可能です。` : ""}`;
      opposeReason  = `案${opposeId}「${opposed?.title ?? ""}」は${label}事業の現フェーズには適合しない方向性です。${karte?.challenges ? `課題「${karte.challenges}」が未解決の中での` : ""}この選択はリスクが高すぎます。`;
      break;
    }
  }

  return (
    `【現状認識】${situationLine} ` +
    `【支持：案${supportId}】${supportReason} ` +
    `【懸念：案${opposeId}】${opposeReason}`
  );
}

// ── Round2：明示的な支持・反対を表明 ─────────────────────────────────

function buildRound2(
  id: ExecutiveId,
  karte: ExecutiveKarte | undefined,
  ctx: BoardContext,
  agenda: Agenda,
  proposals: Proposal[],
  r1Dialogues: ExecutiveDialogue[],
  supportId: string,
): string {
  const { scores, energy } = ctx;
  const opposeId  = defaultOppose(supportId, proposals);
  const supported = proposals.find((p) => p.id === supportId);
  const opposed   = proposals.find((p) => p.id === opposeId);

  // R1で自分と逆の立場を取った役員を参照
  const disagreers = r1Dialogues.filter(
    (d) => d.executiveId !== id && d.supportedProposalId !== supportId,
  );
  const referTarget = disagreers[0];
  const refName = referTarget
    ? (getExecutive(referTarget.executiveId)?.name ?? "前の役員")
    : null;

  let supportDetail = "";
  let opposeDetail  = "";
  let karteReason   = "";

  switch (id) {
    case "future-kouya": {
      const visionKw = ctx.vision?.visionKeywords?.[0] ?? "長期ビジョン";
      supportDetail = `案${supportId}「${supported?.title ?? ""}」を強く支持します。「${visionKw}」実現に向けた最適な判断軸です。`;
      opposeDetail  = `案${opposeId}「${opposed?.title ?? ""}」に反対します。現段階の意思決定基準として不適切です。`;
      karteReason   = karte?.challenges ? `課題「${karte.challenges}」を突破できる案はこれだけです。` : `ビジョンで選ぶ原則を貫いてください。`;
      break;
    }
    case "cfo": {
      supportDetail = `案${supportId}「${supported?.title ?? ""}」を支持します。財務的安全性が確保された唯一の案です。`;
      opposeDetail  = `案${opposeId}「${opposed?.title ?? ""}」に反対します。ROI根拠なしの実行は認められません。`;
      karteReason   = karte?.kpis ? `管理KPI「${karte.kpis}」の水準を維持できる案を選ぶ必要があります。` : `数値の根拠なき決断は経営ではなく賭けです。`;
      break;
    }
    case "coo": {
      supportDetail = `案${supportId}「${supported?.title ?? ""}」を支持します。今すぐ動ける、実行精度が最も高い案です。`;
      opposeDetail  = `案${opposeId}「${opposed?.title ?? ""}」に反対します。実行が遅れることで機会損失が発生します。`;
      karteReason   = karte?.kpis ? `進捗KPI「${karte.kpis}」で週次管理できる体制を今日中に整えます。` : `48時間以内の初動が最大の競争優位です。`;
      break;
    }
    case "cho": {
      const eNote = energy != null ? `現CEOエネルギー${energy}/5で、` : "";
      supportDetail = `案${supportId}「${supported?.title ?? ""}」を支持します。持続可能な負荷で実行できる安全な案です。`;
      opposeDetail  = `案${opposeId}「${opposed?.title ?? ""}」に反対します。${eNote}燃え尽きリスクが許容範囲を超えています。`;
      karteReason   = karte?.challenges ? `健康課題「${karte.challenges}」を抱えている今、無理な実行は後の回復コストが数倍になります。` : `人的資本の毀損は最大のリスクです。`;
      break;
    }
    case "strategy": {
      supportDetail = `案${supportId}「${supported?.title ?? ""}」を強く支持します。仮説検証の機会なきフル投資は戦略的に誤りです。`;
      opposeDetail  = `案${opposeId}「${opposed?.title ?? ""}」に反対します。${opposeId === "A" ? "検証なしの即時着手は失敗コストを最大化します。" : "条件整備の待機中に市場機会を失います。"}`;
      karteReason   = karte?.kpis ? `実験KPI「${karte.kpis}」で30日以内に判断材料を得られます。` : `小さく試して速く学ぶ原則が最良の戦略です。`;
      break;
    }
    default: {
      const bizId = id as "orivis" | "diet" | "ai" | "kirei" | "publishing";
      const label = BUSINESS_LABELS[bizId];
      const sc    = scores?.[bizId];
      supportDetail = `案${supportId}「${supported?.title ?? ""}」を支持します。${label}事業（スコア${sc?.score ?? "未入力"}/100）の現状から、この案が最も事業貢献につながります。`;
      opposeDetail  = `案${opposeId}「${opposed?.title ?? ""}」に反対します。${label}事業の観点からリソース配分として不適切です。`;
      karteReason   = karte?.kpis ? `KPI「${karte.kpis}」達成に直結する案を選ぶ必要があります。` : `${karte?.challenges ? `課題「${karte.challenges}」解消と連動させるべきです。` : "既存リソースとの整合を優先します。"}`;
      break;
    }
  }

  const refLine = refName ? `【${refName}の意見を受けて】 ` : "";

  return (
    `${refLine}` +
    `【支持：案${supportId}】${supportDetail} ` +
    `【反対：案${opposeId}】${opposeDetail} ` +
    `【根拠】${karteReason}`
  );
}

// ── Round3：2候補への最終投票表明（評価指標を役割別に根拠として使用）──────

function buildRound3(
  id: ExecutiveId,
  karte: ExecutiveKarte | undefined,
  ctx: BoardContext,
  agenda: Agenda,
  proposals: Proposal[], // finalist 2案
  supportId: string,
  ceoSummary: string,
): string {
  const summaryExcerpt =
    ceoSummary.length > 25 ? `${ceoSummary.slice(0, 25)}…` : ceoSummary;
  const { scores, nextMilestone } = ctx;
  const supported = proposals.find((p) => p.id === supportId);
  const header    = `【CEO論点「${summaryExcerpt}」を踏まえた最終投票】`;

  // 役割ごとに重視する評価指標を根拠として発言
  switch (id) {
    case "future-kouya": {
      const visionKw  = ctx.vision?.visionKeywords?.[0] ?? "";
      const ms        = nextMilestone ? `「${nextMilestone.item.title}」達成を前提に、` : "";
      const alignment = getMetric(supported, "ビジョン整合性");
      return (
        `${header} 案${supportId}「${supported?.title ?? ""}」に投票します。` +
        `${ms}【評価根拠 ビジョン整合性：${alignment}】` +
        `${visionKw ? `「${visionKw}」` : "ビジョン"}実現への整合性が最も高く、` +
        `${karte?.kpis ? `KPI「${karte.kpis}」での評価を条件に` : "最小実行単位での開始を条件に"}最終賛成とします。`
      );
    }
    case "cfo": {
      const avg           = scores
        ? Math.round(Object.values(scores).reduce((s, b) => s + b.score, 0) / Object.values(scores).length)
        : null;
      const expectedEffect = getMetric(supported, "期待効果");
      return (
        `${header} 案${supportId}「${supported?.title ?? ""}」に投票します。` +
        `全事業平均スコア${avg ?? "未入力"}/100を踏まえ、` +
        `【評価根拠 期待効果：${expectedEffect}】この案のROIと費用対効果は財務的に最も安全です。` +
        `${karte?.kpis ? `KPI「${karte.kpis}」の維持を` : "財務的安全性の確保を"}決議条件として追加することを最終提案とします。`
      );
    }
    case "coo": {
      const difficulty = getMetric(supported, "実行難易度");
      const speed      = getMetric(supported, "実行速度");
      return (
        `${header} 案${supportId}「${supported?.title ?? ""}」に投票します。` +
        `【評価根拠 実行難易度：${difficulty} / 実行速度：${speed}】` +
        `担当者・完了期日・週次KPIを本日中に確定し、48時間以内に初動アクションを起こすことを最終条件とします。` +
        `${karte?.kpis ? `管理KPI：「${karte.kpis}」。` : ""}`
      );
    }
    case "cho": {
      const alignment = getMetric(supported, "ビジョン整合性");
      const speed     = getMetric(supported, "実行速度");
      return (
        `${header} 案${supportId}「${supported?.title ?? ""}」に投票します。` +
        `【評価根拠 ビジョン整合性：${alignment} / 実行速度：${speed}】` +
        `${karte?.challenges ? `「${karte.challenges}」リスク回避のため` : ""}` +
        `週1日オフ・月次エネルギーレビューの義務化を実行条件として最終提案とします。` +
        `${karte?.kpis ? `KPI「${karte.kpis}」のモニタリングも必須です。` : ""}`
      );
    }
    case "strategy": {
      const ms        = nextMilestone ? `「${nextMilestone.item.title}」達成への` : "";
      const alignment = getMetric(supported, "ビジョン整合性");
      const difficulty = getMetric(supported, "実行難易度");
      return (
        `${header} 案${supportId}「${supported?.title ?? ""}」に投票します。` +
        `【評価根拠 ビジョン整合性：${alignment} / 実行難易度：${difficulty}】` +
        `${ms}実験設計として、仮説を「${agenda.decision || agenda.topic}」と定め、` +
        `成功指標を${karte?.kpis ? `「${karte.kpis}」` : "数値で"}定義し、` +
        `終了条件を「指標未達の場合は撤退」とする最終提案とします。`
      );
    }
    default: {
      const bizId       = id as "orivis" | "diet" | "ai" | "kirei" | "publishing";
      const label       = BUSINESS_LABELS[bizId];
      const sc          = scores?.[bizId];
      const expectedEffect = getMetric(supported, "期待効果");
      const speed       = getMetric(supported, "実行速度");
      return (
        `${header} 案${supportId}「${supported?.title ?? ""}」に投票します。` +
        `【評価根拠 期待効果：${expectedEffect} / 実行速度：${speed}】` +
        `${label}事業スコア${sc?.score ?? "未入力"}/100の観点から、` +
        `${karte?.kpis ? `KPI「${karte.kpis}」への貢献` : "事業貢献"}が確認できる条件で賛成し、` +
        `${karte?.challenges ? `「${karte.challenges}」解消と連動させる形での` : "既存リソースと統合する形での"}実行を最終提案とします。`
      );
    }
  }
}

// ── メイン生成関数 ──────────────────────────────────────────────────

export function generateDialogueRound(
  attendees: ExecutiveId[],
  agenda: Agenda,
  ctx: BoardContext,
  roundNumber: 1 | 2 | 3,
  proposals: Proposal[], // R1/R2は全3案、R3はfinalist 2案
  r1Dialogues: ExecutiveDialogue[] = [],
  ceoSummary?: string,
): ExecutiveDialogue[] {
  const result: ExecutiveDialogue[] = [];

  for (const executiveId of attendees) {
    const karte    = ctx.kartes?.[executiveId];
    const supportId = defaultSupport(executiveId, ctx, proposals);
    let content: string;
    let referencedExecutiveId: ExecutiveId | undefined;
    let stance: "提案" | "賛成" | "反対" | "補足" | "代替案" = "提案";

    if (roundNumber === 1) {
      content = buildRound1(executiveId, karte, ctx, agenda, proposals, supportId);
      stance  = "提案";
    } else if (roundNumber === 2) {
      const disagreer = r1Dialogues.find(
        (d) => d.executiveId !== executiveId && d.supportedProposalId !== supportId,
      );
      referencedExecutiveId = disagreer?.executiveId;
      content = buildRound2(executiveId, karte, ctx, agenda, proposals, r1Dialogues, supportId);
      stance  = "賛成";
    } else {
      content = buildRound3(executiveId, karte, ctx, agenda, proposals, supportId, ceoSummary ?? "");
      stance  = "賛成";
    }

    result.push({
      executiveId,
      stance,
      referencedExecutiveId,
      supportedProposalId: supportId,
      content,
    });
  }

  return result;
}
