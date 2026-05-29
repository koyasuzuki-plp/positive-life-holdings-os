"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultBoardState, loadBoardState, saveBoardState } from "@/lib/board/storage";
import type { BoardSession, BoardState } from "@/lib/board/types";

export function useBoardState() {
  const [state, setState] = useState<BoardState>(defaultBoardState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadBoardState());
    setReady(true);
  }, []);

  const persist = useCallback(
    (updater: BoardState | ((prev: BoardState) => BoardState)) => {
      setState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveBoardState(next);
        return next;
      });
    },
    [],
  );

  const saveSession = useCallback(
    (session: BoardSession) => {
      persist((prev) => {
        const idx = prev.sessions.findIndex((s) => s.id === session.id);
        if (idx >= 0) {
          const sessions = [...prev.sessions];
          sessions[idx] = session;
          return { ...prev, sessions };
        }
        return { ...prev, sessions: [...prev.sessions, session] };
      });
    },
    [persist],
  );

  return { state, ready, saveSession };
}
