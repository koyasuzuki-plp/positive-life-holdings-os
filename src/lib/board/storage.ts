import type { BoardSession, BoardState } from "./types";

const BOARD_KEY = "positive-life-os-board";

export const defaultBoardState: BoardState = {
  sessions: [],
};

export function loadBoardState(): BoardState {
  if (typeof window === "undefined") return defaultBoardState;
  try {
    const raw = localStorage.getItem(BOARD_KEY);
    if (!raw) return defaultBoardState;
    const parsed = JSON.parse(raw) as Partial<BoardState>;
    return {
      sessions: Array.isArray(parsed.sessions) ? (parsed.sessions as BoardSession[]) : [],
    };
  } catch {
    return defaultBoardState;
  }
}

export function saveBoardState(state: BoardState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BOARD_KEY, JSON.stringify(state));
}
