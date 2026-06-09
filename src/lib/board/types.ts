export type ExecutiveId =
  | "future-kouya"
  | "cfo"
  | "coo"
  | "cho"
  | "orivis"
  | "diet"
  | "ai"
  | "kirei"
  | "publishing"
  | "strategy";

export type Executive = {
  id: ExecutiveId;
  name: string;
  role: string;
  colorClass: string;
  initial: string;
  businessLabel: string;
};

export type Agenda = {
  topic: string;
  background: string;
  situation: string;
  decision: string;
};

export type ExecutiveStatement = {
  executiveId: ExecutiveId;
  content: string;
};

export type MeetingRound = {
  roundNumber: number;
  statements: ExecutiveStatement[];
  resolution: string;
  nextAction: string;
  ceoContinueComment?: string;
};

export type BoardSession = {
  id: string;
  date: string;
  agenda: Agenda;
  attendees?: ExecutiveId[];
  // Multi-round fields (legacy)
  rounds?: MeetingRound[];
  finalResolution?: string;
  finalNextAction?: string;
  // Legacy fields (existing sessions before Phase C)
  statements?: ExecutiveStatement[];
  resolution?: string;
  nextAction?: string;
  // Dialogue/voting fields (new sessions)
  dialogueRounds?: DialogueRound[];
  proposals?: Proposal[];
  votingResult?: VotingResult;
};

export type BoardState = {
  sessions: BoardSession[];
};

export type ExecutiveKarte = {
  currentStatus: string;
  goal: string;
  kpis: string;
  challenges: string;
  questionsForCEO: string;
  updatedAt: string;
};

export type KarteMap = Partial<Record<ExecutiveId, ExecutiveKarte>>;

// ── 対話・投票システム ──────────────────────────────────────────────

export type DialogueStance = "提案" | "賛成" | "反対" | "補足" | "代替案";

export type ExecutiveDialogue = {
  executiveId: ExecutiveId;
  stance: DialogueStance;
  referencedExecutiveId?: ExecutiveId;
  supportedProposalId?: string; // 支持する提案ID（投票判断に使用）
  content: string;
};

export type ProposalMetric = {
  label: string;
  value: string;
  tone: "good" | "caution" | "risk";
};

export type Proposal = {
  id: string;
  title: string;
  detail: string;
  proposedBy: ExecutiveId;
  assignee: string;
  deadline: string;
  kpi: string;
  metrics: ProposalMetric[];
};

export type Vote = {
  executiveId: ExecutiveId;
  proposalId: string;
};

export type VotingResult = {
  proposals: Proposal[];
  votes: Vote[];
  winnerId: string;
};

export type DialogueRound = {
  roundNumber: number;
  dialogues: ExecutiveDialogue[];
  ceoSummary?: string;
};
