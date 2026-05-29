"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { inputClassName } from "@/components/ui/inputStyles";
import {
  HORIZON_LABELS,
  HORIZONS,
  type MilestoneHorizon,
  type MilestoneItem,
  type VisionMap,
} from "@/lib/board/context";
import { useVisionContext } from "@/hooks/useVisionContext";
import { todayKey } from "@/lib/date";

const EMPTY_FORM = {
  horizon: "3m" as MilestoneHorizon,
  title: "",
  targetDate: "",
  detail: "",
};

export function VisionPage() {
  const { vision, ready, updateVision } = useVisionContext();
  const [keywordsText, setKeywordsText] = useState("");
  const [editingKeywords, setEditingKeywords] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [showAddForm, setShowAddForm] = useState(false);

  if (!ready) {
    return (
      <AppShell title="ビジョン" subtitle="マイルストーン管理" hideNav>
        <div className="flex min-h-32 items-center justify-center text-muted-foreground">…</div>
      </AppShell>
    );
  }

  const unachieved = vision.milestones.filter((m) => !m.achieved);
  const achieved = vision.milestones.filter((m) => m.achieved);

  function handleSaveKeywords() {
    const keywords = keywordsText
      .split(/[,、\n]/)
      .map((k) => k.trim())
      .filter(Boolean);
    updateVision({ ...vision, visionKeywords: keywords });
    setEditingKeywords(false);
  }

  function handleAddMilestone() {
    if (!addForm.title.trim()) return;
    const item: MilestoneItem = {
      id: `${todayKey()}-${Date.now()}`,
      horizon: addForm.horizon,
      title: addForm.title.trim(),
      detail: addForm.detail.trim(),
      targetDate: addForm.targetDate,
      achieved: false,
    };
    updateVision({ ...vision, milestones: [...vision.milestones, item] });
    setAddForm(EMPTY_FORM);
    setShowAddForm(false);
  }

  function handleToggleAchieved(id: string) {
    const milestones = vision.milestones.map((m) =>
      m.id === id ? { ...m, achieved: !m.achieved } : m,
    );
    updateVision({ ...vision, milestones });
  }

  function handleDeleteMilestone(id: string) {
    const milestones = vision.milestones.filter((m) => m.id !== id);
    updateVision({ ...vision, milestones });
  }

  const sorted = [...unachieved].sort((a, b) =>
    HORIZONS.indexOf(a.horizon) - HORIZONS.indexOf(b.horizon),
  );

  return (
    <AppShell title="ビジョン" subtitle="マイルストーン管理" hideNav>
      <div className="space-y-3 pb-4">
        <BackLink href="/board" label="役員会に戻る" />

        {/* Vision keywords */}
        <Card>
          <CardHeader label="10年ビジョン" title="キーワード" />
          {editingKeywords ? (
            <div className="space-y-2">
              <textarea
                className={`${inputClassName} min-h-[4rem] resize-none`}
                placeholder="例: ハワイ移住、ベストセラー作家、年商10億円"
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">カンマ・改行で区切って入力</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveKeywords}
                  className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground active:opacity-90"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setEditingKeywords(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground active:opacity-90"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {vision.visionKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {vision.visionKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">ビジョンキーワードを設定してください</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setKeywordsText(vision.visionKeywords.join("、"));
                  setEditingKeywords(true);
                }}
                className="text-xs font-medium text-primary active:opacity-70"
              >
                編集
              </button>
            </div>
          )}
        </Card>

        {/* Milestones list */}
        <Card>
          <CardHeader label="MILESTONES" title="達成目標" />
          {sorted.length === 0 && !showAddForm && (
            <p className="mb-3 text-xs text-muted-foreground">
              マイルストーンを追加して、次の関門を設定しましょう
            </p>
          )}
          {sorted.length > 0 && (
            <ul className="mb-3 space-y-2">
              {sorted.map((m) => (
                <MilestoneRow
                  key={m.id}
                  item={m}
                  onToggle={handleToggleAchieved}
                  onDelete={handleDeleteMilestone}
                />
              ))}
            </ul>
          )}

          {showAddForm ? (
            <div className="space-y-2.5 border-t border-border pt-3">
              <p className="text-[11px] font-medium text-muted-foreground">新しいマイルストーン</p>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">期間</label>
                <select
                  className={inputClassName}
                  value={addForm.horizon}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, horizon: e.target.value as MilestoneHorizon }))
                  }
                >
                  {HORIZONS.map((h) => (
                    <option key={h} value={h}>
                      {HORIZON_LABELS[h]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">タイトル *</label>
                <input
                  type="text"
                  className={inputClassName}
                  placeholder="例: 月商100万円を安定達成"
                  value={addForm.title}
                  onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">目標年月</label>
                <input
                  type="month"
                  className={inputClassName}
                  value={addForm.targetDate}
                  onChange={(e) => setAddForm((f) => ({ ...f, targetDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">詳細（任意）</label>
                <textarea
                  className={`${inputClassName} min-h-[3.5rem] resize-none`}
                  placeholder="達成の定義・条件"
                  value={addForm.detail}
                  onChange={(e) => setAddForm((f) => ({ ...f, detail: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  disabled={!addForm.title.trim()}
                  className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground active:opacity-90 disabled:opacity-40"
                >
                  追加
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex w-full items-center justify-center rounded-lg border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground active:opacity-70"
            >
              + マイルストーンを追加
            </button>
          )}
        </Card>

        {/* Achieved milestones */}
        {achieved.length > 0 && (
          <Card>
            <CardHeader label="ACHIEVED" title={`達成済み ${achieved.length}件`} />
            <ul className="space-y-2">
              {achieved.map((m) => (
                <MilestoneRow
                  key={m.id}
                  item={m}
                  onToggle={handleToggleAchieved}
                  onDelete={handleDeleteMilestone}
                />
              ))}
            </ul>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function MilestoneRow({
  item,
  onToggle,
  onDelete,
}: {
  item: MilestoneItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] transition-colors ${
          item.achieved
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-transparent"
        }`}
      >
        ✓
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {HORIZON_LABELS[item.horizon]}
          </span>
          {item.targetDate && (
            <span className="text-[10px] text-muted-foreground">{item.targetDate}</span>
          )}
        </div>
        <p
          className={`mt-0.5 text-xs font-medium ${
            item.achieved ? "text-muted-foreground line-through" : "text-card-foreground"
          }`}
        >
          {item.title}
        </p>
        {item.detail && !item.achieved && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{item.detail}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="mt-0.5 shrink-0 text-[10px] text-muted-foreground active:text-red-400"
      >
        削除
      </button>
    </li>
  );
}
