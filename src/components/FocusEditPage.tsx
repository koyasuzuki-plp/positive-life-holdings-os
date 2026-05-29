"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "./AppShell";
import { BackLink } from "./BackLink";
import { StickyFooter } from "./StickyFooter";
import { useAppState } from "@/hooks/useAppState";
import { MAX_FOCUS_LENGTH } from "@/lib/types";
import { inputClassName } from "./ui/inputStyles";

export function FocusEditPage() {
  const router = useRouter();
  const { state, ready, updateMonthlyFocus } = useAppState();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready) setValue(state.monthlyFocus);
  }, [ready, state.monthlyFocus]);

  function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("重点を入力してください");
      return;
    }
    updateMonthlyFocus(trimmed);
    router.push("/");
  }

  if (!ready) {
    return (
      <AppShell title="重点を編集" hideNav>
        <div className="flex min-h-40 items-center justify-center text-muted-foreground">
          …
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="重点を編集" subtitle="今月の重点" hideNav>
      <BackLink />
      <form
        className="pb-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <label htmlFor="focus" className="mb-2 block text-sm font-medium text-card-foreground">
          今月の重点
        </label>
        <input
          id="focus"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          maxLength={MAX_FOCUS_LENGTH}
          placeholder="例：売上と健康のバランスを整える"
          autoFocus
          className={inputClassName}
        />
        <p className="mt-1.5 text-right text-xs text-muted-foreground">
          {value.length}/{MAX_FOCUS_LENGTH}
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          短く、具体的に。今日の行動の判断基準になる言葉にしましょう。
        </p>
      </form>

      <StickyFooter>
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground active:opacity-90"
        >
          保存して今日に戻る
        </button>
      </StickyFooter>
    </AppShell>
  );
}
