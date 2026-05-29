import { EditButton } from "./EditButton";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";

type MonthlyFocusProps = {
  focus: string;
};

export function MonthlyFocus({ focus }: MonthlyFocusProps) {
  return (
    <Card>
      <CardHeader
        label="Vision"
        title="今月の重点"
        action={<EditButton href="/edit/focus" />}
      />
      <p className="text-[15px] leading-snug font-medium text-card-foreground">
        {focus || "重点を設定しましょう"}
      </p>
    </Card>
  );
}
