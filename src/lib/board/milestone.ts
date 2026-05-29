import type { MilestoneItem } from "./context";

export type NextMilestone = {
  item: MilestoneItem;
  monthsAway: number;
};

export function getNextMilestone(
  milestones: MilestoneItem[],
  today: string,
): NextMilestone | null {
  const unachieved = milestones
    .filter((m) => !m.achieved && m.targetDate)
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate));

  if (unachieved.length === 0) return null;

  const next = unachieved[0];
  const todayDate = new Date(`${today}T12:00:00`);
  const targetDate = new Date(`${next.targetDate}-01T12:00:00`);
  const diffMs = targetDate.getTime() - todayDate.getTime();
  const monthsAway = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30)));

  return { item: next, monthsAway };
}
