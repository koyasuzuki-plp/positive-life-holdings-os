"use client";

import { useEffect, useState } from "react";
import type { PriorityAction } from "@/lib/types";
import {
  MAX_PRIORITY_ACTION_LENGTH,
  MAX_PRIORITY_REASON_LENGTH,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";

type PriorityActionCardProps = {
  value: PriorityAction;
  onChange: (action: PriorityAction) => void;
};

export function PriorityActionCard({ value, onChange }: PriorityActionCardProps) {
  const [local, setLocal] = useState(value);
  const [editing, setEditing] = useState(!value.action);

  useEffect(() => {
    setLocal(value);
    if (value.action) setEditing(false);
  }, [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (JSON.stringify(local) !== JSON.stringify(value)) {
        onChange(local);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [local, onChange, value]);

  function update(patch: Partial<PriorityAction>) {
    setLocal((prev) => ({ ...prev, ...patch }));
  }

  const hasMission = Boolean(local.action.trim());

  return (
    <Card variant="mission">
      <CardHeader
        label="本日の作戦"
        title="最重要行動"
        action={
          <button
            type="button"
            onClick={() => update({ done: !local.done })}
            aria-pressed={local.done}
            className={cn(
              "flex min-h-9 min-w-9 items-center justify-center rounded-full border-2 transition-colors",
              local.done
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted text-transparent",
            )}
            aria-label={local.done ? "完了を解除" : "完了にする"}
          >
            ✓
          </button>
        }
      />

      {!editing && hasMission ? (
        <div className="space-y-2">
          <p
            className={cn(
              "text-base font-semibold leading-snug",
              local.done
                ? "text-muted-foreground line-through"
                : "text-card-foreground",
            )}
          >
            {local.action}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {local.duration && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {local.duration}
              </span>
            )}
            {local.done && (
              <span className="text-xs font-medium text-primary">完了</span>
            )}
          </div>
          {local.reason && (
            <p className="text-[11px] leading-snug text-muted-foreground">
              {local.reason}
            </p>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-primary active:opacity-70"
          >
            作戦を編集
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {!hasMission && (
            <p className="text-xs text-muted-foreground">
              今日の勝ち筋を1つだけ宣言してください。
            </p>
          )}
          <input
            type="text"
            value={local.action}
            onChange={(e) => update({ action: e.target.value })}
            placeholder="例：中村さんへのフォロー"
            maxLength={MAX_PRIORITY_ACTION_LENGTH}
            className="w-full border-0 border-b border-border bg-transparent py-2 text-base font-medium text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <div className="flex gap-3">
            <input
              type="text"
              value={local.duration}
              onChange={(e) => update({ duration: e.target.value })}
              placeholder="15分"
              maxLength={20}
              className="w-16 border-0 border-b border-border bg-transparent py-1 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <input
              type="text"
              value={local.reason}
              onChange={(e) => update({ reason: e.target.value })}
              placeholder="優先理由（Visionとの接続）"
              maxLength={MAX_PRIORITY_REASON_LENGTH}
              className="min-w-0 flex-1 border-0 border-b border-border bg-transparent py-1 text-xs text-muted-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          {hasMission && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="min-h-10 w-full rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground active:opacity-90"
            >
              作戦を確定
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
