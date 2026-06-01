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
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    setLocal(value);
    if (value.action) setEditing(false);
  }, [value]);

  const isDirty =
    editing &&
    (local.action !== value.action ||
      local.duration !== value.duration ||
      local.reason !== value.reason);

  function update(patch: Partial<PriorityAction>) {
    setLocal((prev) => ({ ...prev, ...patch }));
  }

  function handleToggleDone() {
    const next = { ...local, done: !local.done };
    setLocal(next);
    onChange(next);
  }

  function handleConfirm() {
    onChange(local);
    setEditing(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
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
            onClick={handleToggleDone}
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setEditing(true); setSavedMsg(false); }}
              className="text-xs font-medium text-primary active:opacity-70"
            >
              作戦を編集
            </button>
            {savedMsg && (
              <span className="text-xs text-primary">保存しました ✓</span>
            )}
          </div>
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
            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
            placeholder="例：中村さんへのフォロー"
            maxLength={MAX_PRIORITY_ACTION_LENGTH}
            className="w-full border-0 border-b border-border bg-transparent py-2 text-base font-medium text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <div className="flex gap-3">
            <input
              type="text"
              value={local.duration}
              onChange={(e) => update({ duration: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
              placeholder="15分"
              maxLength={20}
              className="w-16 border-0 border-b border-border bg-transparent py-1 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <input
              type="text"
              value={local.reason}
              onChange={(e) => update({ reason: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
              placeholder="優先理由（Visionとの接続）"
              maxLength={MAX_PRIORITY_REASON_LENGTH}
              className="min-w-0 flex-1 border-0 border-b border-border bg-transparent py-1 text-xs text-muted-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            {isDirty ? (
              <span className="text-[11px] text-amber-500">● 未保存</span>
            ) : (
              <span />
            )}
            {hasMission && (
              <button
                type="button"
                onClick={handleConfirm}
                className="min-h-10 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground active:opacity-90"
              >
                作戦を確定・保存
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
