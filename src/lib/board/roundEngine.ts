import type { ExecutiveId } from "./types";

export type CEOIntent = {
  focusShortTerm: boolean;
  focusRevenue: boolean;
  focusHealth: boolean;
  seekAlternatives: boolean;
  focusExecution: boolean;
};

export function detectCEOIntent(comment: string): CEOIntent {
  return {
    focusShortTerm: /短期|今月|今週|すぐ|早め|急ぎ|今日中|今すぐ/.test(comment),
    focusRevenue: /売上|収益|稼ぎ|利益|お金|売り上げ|財務|資金|マネタイズ/.test(comment),
    focusHealth: /健康|体|疲|休|エネルギー|体調|睡眠|無理/.test(comment),
    seekAlternatives: /別の|他の|違う|代替|選択肢|別案|違うアプローチ/.test(comment),
    focusExecution: /実行|具体|行動|やる|進める|実践|動く|手を動かす|着手/.test(comment),
  };
}

// Round 2/3 で発言する役員を3名選定する
export function selectRoundExecutives(intent: CEOIntent): ExecutiveId[] {
  if (intent.focusRevenue)     return ["future-kouya", "cfo", "strategy"];
  if (intent.focusHealth)      return ["future-kouya", "cho", "coo"];
  if (intent.focusShortTerm)   return ["coo", "cfo", "strategy"];
  if (intent.seekAlternatives) return ["future-kouya", "strategy", "ai"];
  if (intent.focusExecution)   return ["coo", "future-kouya", "strategy"];
  return ["future-kouya", "coo", "strategy"];
}

// 各ラウンドの冒頭プレフィックスを生成する
export function buildRoundPrefix(ceoComment: string, roundNumber: number): string {
  const short = ceoComment.trim().length > 0
    ? (ceoComment.length > 28 ? `${ceoComment.slice(0, 28)}…` : ceoComment)
    : "CEOの追加指示";
  return roundNumber >= 3
    ? `最終ラウンドです。「${short}」を踏まえた最終見解をお伝えします。`
    : `「${short}」というCEOのご指摘を受け、改めて検討します。`;
}
