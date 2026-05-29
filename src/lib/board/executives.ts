import type { Executive, ExecutiveId } from "./types";

export const EXECUTIVES: Executive[] = [
  {
    id: "future-kouya",
    name: "未来のこうや",
    role: "代表取締役CEO（未来）",
    colorClass: "bg-amber-500",
    initial: "未",
  },
  {
    id: "cfo",
    name: "CFO",
    role: "最高財務責任者",
    colorClass: "bg-blue-500",
    initial: "財",
  },
  {
    id: "coo",
    name: "COO",
    role: "最高執行責任者",
    colorClass: "bg-green-600",
    initial: "執",
  },
  {
    id: "cho",
    name: "CHO",
    role: "最高健康責任者",
    colorClass: "bg-rose-500",
    initial: "健",
  },
  {
    id: "orivis",
    name: "OriVis事業部長",
    role: "OriVis事業部長",
    colorClass: "bg-purple-500",
    initial: "O",
  },
  {
    id: "diet",
    name: "ダイエット事業部長",
    role: "ダイエット事業部長",
    colorClass: "bg-orange-500",
    initial: "D",
  },
  {
    id: "ai",
    name: "AI事業部長",
    role: "AI事業部長",
    colorClass: "bg-cyan-500",
    initial: "A",
  },
  {
    id: "kirei",
    name: "キレイデザイン事業部長",
    role: "キレイデザイン事業部長",
    colorClass: "bg-pink-500",
    initial: "K",
  },
  {
    id: "publishing",
    name: "出版編集長",
    role: "出版部門編集長",
    colorClass: "bg-yellow-600",
    initial: "編",
  },
  {
    id: "strategy",
    name: "未来戦略室",
    role: "未来戦略室長",
    colorClass: "bg-indigo-500",
    initial: "戦",
  },
];

export function getExecutive(id: ExecutiveId | string): Executive | undefined {
  return EXECUTIVES.find((e) => e.id === id);
}

export const FUTURE_KOUYA_QUOTES: string[] = [
  "迷ったら、より大きな自分が選ぶほうへ。恐れではなく、ビジョンで判断してください。",
  "今日の習慣が、5年後のあなたの会社をつくっています。小さな一手を誇りに思ってください。",
  "資源は常に有限。だからこそ、何をやらないかを先に決める経営者が最後に勝ちます。",
  "健康は事業の土台。売上より先に、あなた自身のエネルギーを経営してください。",
  "意思決定の質は、問いの質で決まります。今日の議題は正しい問いを立てていますか？",
  "失敗を恐れる必要はありません。小さく試して、速く学ぶ。それが最速の成長です。",
  "あなたが今日下す決断が、未来の私をつくります。胸を張って選んでください。",
];
