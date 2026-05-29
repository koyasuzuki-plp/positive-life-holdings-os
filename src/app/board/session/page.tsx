"use client";

import { SessionRoom } from "@/components/board/SessionRoom";
import { useBoardState } from "@/hooks/useBoardState";

export default function SessionPage() {
  const { saveSession } = useBoardState();
  return <SessionRoom onSave={saveSession} />;
}
