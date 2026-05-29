import Link from "next/link";
import type { NextMilestone } from "@/lib/board/milestone";
import { HORIZON_LABELS } from "@/lib/board/context";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";

type MilestoneCardProps = {
  nextMilestone: NextMilestone | null;
  visionKeywords: string[];
};

export function MilestoneCard({ nextMilestone, visionKeywords }: MilestoneCardProps) {
  return (
    <Link href="/board/vision" className="block">
      <Card className="active:opacity-80">
        <CardHeader
          label="① VISION"
          title="ビジョン・マイルストーン"
          action={<span className="text-xs text-muted-foreground">編集 →</span>}
        />

        {visionKeywords.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {visionKeywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        {nextMilestone ? (
          <div className="rounded-lg bg-muted/60 px-2.5 py-2">
            <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
              次の関門 · {HORIZON_LABELS[nextMilestone.item.horizon]} ·{" "}
              {nextMilestone.monthsAway > 0
                ? `あと${nextMilestone.monthsAway}ヶ月`
                : "今月"}
            </p>
            <p className="mt-0.5 text-[13px] font-semibold text-card-foreground">
              {nextMilestone.item.title}
            </p>
            {nextMilestone.item.targetDate && (
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                目標: {nextMilestone.item.targetDate}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            マイルストーンを追加して次の関門を設定しましょう
          </p>
        )}
      </Card>
    </Link>
  );
}
