"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { inputClassName } from "@/components/ui/inputStyles";

const MAX_ROUNDS = 3;

type CEOReplyFormProps = {
  currentRound: number;
  onContinue: (comment: string) => void;
  onDecide: () => void;
};

export function CEOReplyForm({ currentRound, onContinue, onDecide }: CEOReplyFormProps) {
  const [comment, setComment] = useState("");
  const nextRound = currentRound + 1;
  const isNextFinal = nextRound >= MAX_ROUNDS;

  return (
    <div className="space-y-3">
      {isNextFinal && (
        <Card variant="advisor">
          <p className="text-[12px] text-amber-300">
            ⚑ 次が最終ラウンドです。最後の指示を伝えて決着をつけましょう。
          </p>
        </Card>
      )}

      <Card>
        <CardHeader label="CEO" title="追加コメント" />
        <p className="mb-2 text-xs text-muted-foreground">
          議論の方向性や気になる点を役員に伝えてください
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={"例：もっと短期的な視点で考えたい\n例：売上への影響を重視したい\n例：健康面の観点も入れてほしい"}
          rows={4}
          className={`${inputClassName} min-h-[6rem] resize-none`}
        />
        {comment.trim().length > 0 && (
          <p className="mt-1 text-right text-[10px] text-muted-foreground">
            {comment.length}文字
          </p>
        )}
      </Card>

      <button
        type="button"
        onClick={() => onContinue(comment)}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:opacity-90"
      >
        追加議論を開始（Round {nextRound}{isNextFinal ? " 最終" : ""}）
      </button>

      <button
        type="button"
        onClick={onDecide}
        className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border text-sm text-muted-foreground active:opacity-80"
      >
        このまま決定する
      </button>
    </div>
  );
}
