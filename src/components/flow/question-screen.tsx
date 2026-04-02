"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  defaultQuestion,
  getCategoryDisplayMeta,
  tarotCategories,
} from "@/lib/mock-tarot-data";

const sparkPrompts = {
  "zh-TW": [
    "我現在最需要看清楚的是什麼？",
    "這段關係接下來會怎麼發展？",
    "我現在該怎麼做決定？",
  ],
  en: [
    "What do I most need to see clearly right now?",
    "Where is this relationship heading next?",
    "What is the clearest decision for me now?",
  ],
} as const;

export function QuestionScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, isHydrated: isAuthHydrated } = useAuth();
  const { locale, t } = useLocale();
  const {
    session,
    ownsCurrentSession,
    question,
    categoryId,
    saveToHistory,
    setQuestion,
    setCategoryId,
    setSaveToHistory,
    createSessionFromDraft,
    startNewReading,
  } = useTarotFlow();
  const previewQuestion = useDeferredValue(question.trim() || defaultQuestion);
  const selectedCategory = getCategoryDisplayMeta(categoryId);
  const canContinue = question.trim().length > 0;
  const prompts = sparkPrompts[locale];

  if (!isAuthHydrated) {
    return (
      <section className="flex flex-1 flex-col justify-center py-8">
        <div className="space-y-3 rounded-[2rem] bg-white/[0.04] px-5 py-6">
          <p className="text-sm text-foreground/56">{t("準備中", "Preparing")}</p>
          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-card-foreground">
            {t("正在確認你的身份。", "Checking your profile.")}
          </h1>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="flex flex-1 flex-col justify-between gap-8 py-6">
        <div className="space-y-3 pt-6">
          <p className="text-sm text-foreground/56">{t("開始前", "Before you begin")}</p>
          <h1 className="max-w-[13rem] text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
            {t("先登入再抽牌", "Sign in first")}
          </h1>
          <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
            {t(
              "登入後才能開始流程，並保存你的解讀、點數與紀錄。",
              "Sign in before starting so your reading, points, and history can be kept.",
            )}
          </p>
        </div>

        <div className="grid gap-3">
          <Link
            href="/auth/line"
            className="min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-center text-base font-semibold text-black transition hover:opacity-92"
          >
            {t("使用 LINE 登入", "Continue with LINE")}
          </Link>
          <Link
            href="/"
            className="min-h-[3.75rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
          >
            {t("回到首頁", "Back to home")}
          </Link>
        </div>
      </section>
    );
  }

  if (session && !ownsCurrentSession) {
    return (
      <section className="flex flex-1 flex-col justify-between gap-8 py-6">
        <div className="space-y-3 pt-6">
          <p className="text-sm text-foreground/56">{t("目前狀態", "Current state")}</p>
          <h1 className="max-w-[14rem] text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
            {t("先清空目前進度", "Start fresh here")}
          </h1>
          <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
            {t(
              "這個瀏覽器目前有別的解讀進度。要開始新的問題，請先清空再繼續。",
              "This browser already holds a different reading. Clear it first before starting a new one.",
            )}
          </p>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => {
              void startNewReading();
            }}
            className="min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-92"
          >
            {t("清空並開始", "Clear and begin")}
          </button>
          <Link
            href="/auth/line"
            className="min-h-[3.75rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
          >
            {t("回到登入頁", "Back to sign in")}
          </Link>
        </div>
      </section>
    );
  }

  async function handleBegin() {
    if (!canContinue || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      const nextSession = await createSessionFromDraft();

      if (!nextSession) {
        return;
      }

      startTransition(() => {
        router.push("/ritual");
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-5 py-6">
      <div className="space-y-3 pt-4">
        <p className="text-sm text-foreground/56">{t("第一步", "Step one")}</p>
        <h1 className="max-w-[12rem] text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
          {t("你想問什麼？", "What do you want to ask?")}
        </h1>
        <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
          {t(
            "一句話就夠了，越具體越好。",
            "One sentence is enough. The clearer it is, the better the reading will be.",
          )}
        </p>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <textarea
          value={question}
          maxLength={180}
          placeholder={t("例如：我現在該不該換工作？", "For example: Should I change jobs right now?")}
          onChange={(event) => setQuestion(event.target.value)}
          className="h-36 w-full resize-none rounded-[1.4rem] border border-white/10 bg-black/20 px-4 py-4 text-[0.95rem] leading-7 text-card-foreground outline-none transition placeholder:text-muted/70 focus:border-line-strong"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setQuestion(prompt)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-xs text-foreground/66 transition hover:border-line-strong hover:text-card-foreground"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-card-foreground">
            {t("主題", "Category")}
          </h2>
          <p className="text-sm leading-6 text-foreground/56">
            {locale === "zh-TW"
              ? selectedCategory.descriptionZh
              : selectedCategory.descriptionEn}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {tarotCategories.map((category) => {
            const display = getCategoryDisplayMeta(category.id);
            const isActive = category.id === categoryId;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                className={`rounded-[1.3rem] border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-line-strong bg-brand-soft"
                    : "border-white/10 bg-black/18 hover:border-white/16 hover:bg-white/[0.04]"
                }`}
              >
                <p className="text-sm font-semibold text-card-foreground">
                  {locale === "zh-TW" ? display.labelZh : display.labelEn}
                </p>
                <p className="mt-2 text-xs leading-5 text-foreground/56">
                  {locale === "zh-TW" ? display.descriptionZh : display.descriptionEn}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[1.8rem] bg-white/[0.04] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              {t("保存紀錄", "Save history")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground/56">
              {t("開啟後，完成的解讀會留在紀錄裡。", "When enabled, finished readings stay in your history.")}
            </p>
          </div>

          <button
            type="button"
            aria-pressed={saveToHistory}
            onClick={() => setSaveToHistory(!saveToHistory)}
            className={`relative flex h-8 w-14 items-center rounded-full border transition ${
              saveToHistory
                ? "border-line-strong bg-brand-soft"
                : "border-white/10 bg-black/24"
            }`}
          >
            <span
              className={`mx-1 block h-5 w-5 rounded-full bg-card-foreground transition ${
                saveToHistory ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-black/18 p-4">
          <p className="text-sm leading-7 text-card-foreground">
            &ldquo;{previewQuestion}&rdquo;
          </p>
        </div>
      </div>

      <div className="mt-auto grid gap-3">
        <button
          type="button"
          onClick={() => {
            void handleBegin();
          }}
          disabled={!canContinue || isSubmitting}
          className="min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? t("準備中", "Preparing") : t("下一步", "Continue")}
        </button>

        <Link
          href="/"
          className="min-h-[3.75rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
        >
          {t("回到首頁", "Back to home")}
        </Link>
      </div>
    </section>
  );
}
