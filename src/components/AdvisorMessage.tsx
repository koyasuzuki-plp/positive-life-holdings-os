"use client";

import { useState } from "react";
import { getAdvisorBriefing } from "@/lib/advisor";
import type { DailyLog, Habit, PriorityAction } from "@/lib/types";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";

type AdvisorMessageProps = {
  monthlyFocus: string;
  habits: Habit[];
  habitChecks: Record<string, boolean>;
  today: string;
  habitDoneCount: number;
  todayLog: DailyLog | undefined;
  priorityAction: PriorityAction;
  nextHabitName?: string;
};

export function AdvisorMessage(props: AdvisorMessageProps) {
  const [expanded, setExpanded] = useState(false);
  const { sections } = getAdvisorBriefing(props);

  const judgment = sections.find((s) => s.id === "judgment");
  const energy = sections.find((s) => s.id === "energy");
  const hidden = sections.filter(
    (s) => !["judgment", "energy"].includes(s.id),
  );

  const missionLine = props.priorityAction.action
    ? `「${props.priorityAction.action}」${
        props.priorityAction.duration
          ? ` · ${props.priorityAction.duration}`
          : ""
      }`
    : sections.find((s) => s.id === "priority")?.body ?? "作戦カードで宣言してください。";

  const missionReason = props.priorityAction.reason;

  return (
    <Card variant="advisor" className="!p-0">
      <div className="border-b border-stone-700/80 px-3.5 py-3">
        <CardHeader
          label="AI参謀"
          title="今日のブリーフィング"
          dark
          action={
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600/90 text-xs font-bold text-white">
              参
            </span>
          }
        />
      </div>

      <div className="space-y-2 px-3.5 py-3">
        {judgment && (
          <BriefRow dark label="今日の判断" body={judgment.body} highlight />
        )}
        <BriefRow
          dark
          label="今日の最重要行動"
          body={missionLine}
          sub={missionReason}
        />
        {energy && (
          <BriefRow dark label="エネルギー状態" body={energy.body} />
        )}

        {expanded && (
          <ul className="space-y-2 border-t border-stone-700/60 pt-2">
            {hidden.map((section) => (
              <li key={section.id}>
                <BriefRow
                  dark
                  label={section.title}
                  body={section.body}
                  compact
                />
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-h-10 w-full items-center justify-center rounded-lg border border-stone-600/80 bg-stone-800/50 text-xs font-medium text-stone-300 active:bg-stone-700/50"
        >
          {expanded ? "詳細を閉じる" : "詳細を見る"}
        </button>
      </div>
    </Card>
  );
}

function BriefRow({
  label,
  body,
  sub,
  dark,
  highlight,
  compact,
}: {
  label: string;
  body: string;
  sub?: string;
  dark?: boolean;
  highlight?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-2.5 py-2 ${
        highlight
          ? "border border-teal-500/30 bg-teal-500/10"
          : dark
            ? "bg-stone-800/40"
            : "bg-stone-50"
      }`}
    >
      <p
        className={`text-[10px] font-medium tracking-wide uppercase ${
          dark ? "text-teal-400/90" : "text-teal-700"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-0.5 leading-snug text-stone-200 ${
          compact ? "text-[11px]" : "text-[13px]"
        } ${highlight ? "font-medium text-teal-50" : ""}`}
      >
        {body}
      </p>
      {sub && (
        <p className="mt-1 text-[11px] leading-snug text-stone-500">{sub}</p>
      )}
    </div>
  );
}
