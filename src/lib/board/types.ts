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

export type BoardSession = {
  id: string;
  date: string;
  agenda: Agenda;
  statements: ExecutiveStatement[];
  resolution: string;
  nextAction: string;
};

export type BoardState = {
  sessions: BoardSession[];
};
