import { lastNDays } from "./date";
import {
  MOOD_LABELS,
  type DailyLog,
  type Habit,
  type PriorityAction,
} from "./types";

export type AdvisorSection = {
  id: string;
  title: string;
  body: string;
};

export type AdvisorBriefing = {
  sections: AdvisorSection[];
};

type AdvisorInput = {
  monthlyFocus: string;
  habits: Habit[];
  habitChecks: Record<string, boolean>;
  today: string;
  habitDoneCount: number;
  todayLog: DailyLog | undefined;
  priorityAction: PriorityAction;
  nextHabitName?: string;
};

function weekHabitRate(
  habits: Habit[],
  habitChecks: Record<string, boolean>,
  today: string,
): number {
  const dates = lastNDays(today, 7);
  let done = 0;
  let total = 0;
  for (const date of dates) {
    for (const habit of habits) {
      total++;
      if (habitChecks[`${date}:${habit.id}`]) done++;
    }
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function todayJudgment(input: AdvisorInput, habitRate: number): string {
  const { monthlyFocus, habitDoneCount, todayLog, priorityAction, habits } =
    input;
  const focus = monthlyFocus || "今月の重点";
  const total = habits.length;
  const energy = todayLog?.energy;
  const mood = todayLog?.mood;

  if (priorityAction.done && priorityAction.action) {
    return `判断：最重要行動「${priorityAction.action}」は完了。重点「${focus}」に対し、今日の主戦場はクリアです。余力は明日の一手の設計に回してください。`;
  }

  if (!priorityAction.action) {
    return `判断：最重要行動が未設定。参謀として、記録を読む前に「今日の1手」を宣言してください。重点「${focus}」から逆算するのが先です。`;
  }

  if (habitRate < 35 && (energy ?? 3) <= 2) {
    return "判断：回復と再現の仕組みを優先。成果拡大は止め、エネルギー回復と習慣1つの死守に資源を集中させてください。";
  }

  if (habitDoneCount === total && mood != null && mood >= 4) {
    return `判断：好調かつ習慣${total}/${total}。攻めの配置が可能ですが、最重要行動「${priorityAction.action}」以外の新規コミットは禁止します。`;
  }

  return `判断：重点「${focus}」の実行日。習慣 ${habitDoneCount}/${total}・週間率${habitRate}%。分散を切り、最重要行動に午前の黄金時間を割り当ててください。`;
}

function suggestPriorityAction(input: AdvisorInput): string {
  const { monthlyFocus, priorityAction, todayLog, nextHabitName } = input;
  const focus = monthlyFocus || "今月の重点";

  if (priorityAction.action) {
    const time = priorityAction.duration || "所要時間未設定";
    const status = priorityAction.done ? "完了済み" : "未完了・最優先";
    return `登録済み：「${priorityAction.action}」（${time}）— ${status}。理由：${priorityAction.reason || "未記入"}。${priorityAction.done ? "次は夜の振り返りで学びを1行残してください。" : "今すぐ着手。他タスクは保留。"}`;
  }

  const text = `${todayLog?.progress ?? ""} ${todayLog?.gratitude ?? ""}`;
  if (text.includes("フォロー") || text.includes("クライアント")) {
    return `提案：重点「${focus}」に沿い、キーパーソンへのフォローを15分で1件。関係資本が収益の先行指標です。`;
  }

  if (nextHabitName) {
    return `提案：「${nextHabitName}」を最重要行動に設定（目安15分）。重点「${focus}」に直結する習慣ベースの一手です。`;
  }

  return `提案：重点「${focus}」から逆算し、「未来に効く行動」を1件だけ宣言してください（例：主要顧客フォロー／提案送付）。`;
}

function energyComment(todayLog: DailyLog | undefined, habitRate: number): string {
  const energy = todayLog?.energy;
  if (energy == null) {
    return "エネルギー未記録。夜の振り返りで1〜5を入力してください。不明なまま長時間労働に入るのは経営判断として危険です。";
  }
  if (energy <= 2) {
    return `エネルギー ${energy}/5 — 回復モード。会議短縮、深い仕事は25分×1まで。睡眠と水分を先に確保し、最重要行動も「最小単位」に落としてください。`;
  }
  if (energy >= 4 && habitRate < 50) {
    return `エネルギー ${energy}/5 だが週間習慣率 ${habitRate}% と再現性が低い。体力を習慣の固定時間に投下し、成果より仕組みを優先してください。`;
  }
  if (energy === 3) {
    return `エネルギー ${energy}/5 — 中位帯。午前に判断・午後に実行。15時以降の新規タスクは原則持ち越し。`;
  }
  return `エネルギー ${energy}/5 — 攻め可能。最重要行動完了後は意図的にオフを入れ、燃え尽きを防いでください。`;
}

function tomorrowStep(input: AdvisorInput, habitRate: number): string {
  const { todayLog, priorityAction, habits, habitDoneCount } = input;
  const total = habits.length;

  if (todayLog?.tomorrowStep?.trim()) {
    return `記録より：「${todayLog.tomorrowStep.trim()}」— これを明日の最初の15分にブロックしてください。`;
  }

  if (priorityAction.action && !priorityAction.done) {
    return `明日の一手：今日未完了の「${priorityAction.action}」を午前最優先で完了。持ち越しは1件のみ。`;
  }

  if (habitRate < 40) {
    return `明日の一手：週間習慣率${habitRate}%の改善—開始時刻を1つ固定。新しい習慣の追加は禁止。`;
  }

  if (habitDoneCount < total) {
    return `明日の一手：未完了習慣${total - habitDoneCount}件を午前中に前倒し。午後の意思決定疲れで落ちるパターンを断ち切る。`;
  }

  return "明日の一手：今月の重点に直結する行動を1つだけカレンダーにブロック。就寝前に記録の「明日の一歩」へ書き残してください。";
}

function visionConnection(
  focus: string,
  todayLog: DailyLog | undefined,
  priorityAction: PriorityAction,
): string {
  const progress = todayLog?.progress?.trim() ?? "";
  const keywords = focus.split(/[\s、。・]/).filter((w) => w.length >= 2);
  const aligned =
    keywords.length > 0 && keywords.some((kw) => progress.includes(kw));

  if (priorityAction.action && priorityAction.reason) {
    return `Vision接続：重点「${focus}」← 最重要行動「${priorityAction.action}」の理由「${priorityAction.reason}」。${aligned ? "進捗記録とも整合あり。" : "夜の振り返りで進捗を重点キーワード付きで1行追記せよ。"}`;
  }

  if (aligned) {
    return `Vision接続：重点「${focus}」と今日の進捗が一致。戦略と実行が同じレール上にあります。この連続性を維持してください。`;
  }

  return `Vision接続：重点「${focus}」に対し、今日の実行がまだ抽象度が高い。最重要行動の「優先理由」に重点のキーワードを必ず含めてください。`;
}

/** 将来は AI API に差し替え */
export function getAdvisorBriefing(input: AdvisorInput): AdvisorBriefing {
  const focus = input.monthlyFocus || "今月の重点";
  const habitRate = weekHabitRate(
    input.habits,
    input.habitChecks,
    input.today,
  );
  const mood = input.todayLog?.mood;
  const moodNote =
    mood != null ? `（気分 ${mood}/5・${MOOD_LABELS[mood]}）` : "";

  return {
    sections: [
      {
        id: "judgment",
        title: "今日の判断",
        body: todayJudgment(input, habitRate) + moodNote,
      },
      {
        id: "priority",
        title: "最重要行動の提案",
        body: suggestPriorityAction(input),
      },
      {
        id: "energy",
        title: "エネルギー管理",
        body: energyComment(input.todayLog, habitRate),
      },
      {
        id: "tomorrow",
        title: "明日の一手",
        body: tomorrowStep(input, habitRate),
      },
      {
        id: "vision",
        title: "Visionとの接続",
        body: visionConnection(focus, input.todayLog, input.priorityAction),
      },
    ],
  };
}
