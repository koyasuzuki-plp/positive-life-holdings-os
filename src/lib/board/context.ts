// ── マイルストーン ───────────────────────────────────────────
export type MilestoneHorizon = "3m" | "6m" | "1y" | "2y" | "3y" | "5y" | "10y";

export const HORIZON_LABELS: Record<MilestoneHorizon, string> = {
  "3m": "3ヶ月",
  "6m": "半年",
  "1y": "1年",
  "2y": "2年",
  "3y": "3年",
  "5y": "5年",
  "10y": "10年",
};

export const HORIZONS: MilestoneHorizon[] = ["3m", "6m", "1y", "2y", "3y", "5y", "10y"];

export type MilestoneItem = {
  id: string;
  horizon: MilestoneHorizon;
  title: string;
  detail: string;
  targetDate: string; // YYYY-MM
  achieved: boolean;
};

// ── ビジョンマップ ────────────────────────────────────────────
export type VisionMap = {
  ultimateVision: string;
  visionKeywords: string[]; // 例: ["ハワイ移住", "ベストセラー作家", "年商10億円"]
  milestones: MilestoneItem[];
};

// ── 現在地 ────────────────────────────────────────────────────
export type ProgressLevel = 1 | 2 | 3 | 4 | 5;

export type CurrentPosition = {
  updatedAt: string; // YYYY-MM-DD
  monthlyRevenue: string;
  mainChallenge: string;
  biggestWin: string;
  overallProgress: ProgressLevel;
};

// ── 事業スコア ────────────────────────────────────────────────
export type BusinessId = "orivis" | "diet" | "ai" | "kirei" | "publishing";

export const BUSINESS_IDS: BusinessId[] = ["orivis", "diet", "ai", "kirei", "publishing"];

export const BUSINESS_LABELS: Record<BusinessId, string> = {
  orivis: "OriVis",
  diet: "ダイエット",
  ai: "AI事業",
  kirei: "キレイデザイン",
  publishing: "発信出版",
};

export type BusinessScore = {
  businessId: BusinessId;
  score: number; // 0〜100
  monthlyFocus: string;
  nextAction: string;
  updatedAt: string; // YYYY-MM-DD
};

export type BusinessScores = Record<BusinessId, BusinessScore>;

// ── デフォルト値 ──────────────────────────────────────────────
export const defaultVisionMap: VisionMap = {
  ultimateVision: "",
  visionKeywords: ["ハワイ移住", "ベストセラー作家", "年商10億円"],
  milestones: [],
};

export const defaultCurrentPosition: CurrentPosition = {
  updatedAt: "",
  monthlyRevenue: "",
  mainChallenge: "",
  biggestWin: "",
  overallProgress: 3,
};

function emptyScore(id: BusinessId): BusinessScore {
  return { businessId: id, score: 0, monthlyFocus: "", nextAction: "", updatedAt: "" };
}

export const defaultBusinessScores: BusinessScores = {
  orivis: emptyScore("orivis"),
  diet: emptyScore("diet"),
  ai: emptyScore("ai"),
  kirei: emptyScore("kirei"),
  publishing: emptyScore("publishing"),
};
