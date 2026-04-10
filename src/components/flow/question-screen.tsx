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
  type TarotCategoryId,
} from "@/lib/mock-tarot-data";

const sparkPrompts = {
  "zh-TW": [
    "我應不應該在這個月主動提出合作邀請？",
    "這段關係裡，我現在最需要看清的是什麼？",
    "我該再觀望一下，還是現在就做決定？",
  ],
  en: [
    "Should I actively propose the collaboration this month?",
    "What do I most need to see clearly about this relationship?",
    "Should I wait a little longer or make the decision now?",
  ],
} as const;

const entrySignals = [
  {
    zhTitle: "一個問題",
    enTitle: "One question",
    zhBody: "先把你最想釐清的核心問題說清楚，不需要一次塞進所有背景。",
    enBody: "Start with one clear question.",
  },
  {
    zhTitle: "直答三張牌",
    enTitle: "Three cards",
    zhBody: "用現況核心、隱藏阻力、最佳走向三個位置，把答案先收斂起來。",
    enBody: "Use three positions to narrow the answer.",
  },
  {
    zhTitle: "約一分鐘",
    enTitle: "About one minute",
    zhBody: "提問、進入儀式、抽牌到讀取 AI 解讀，會在同一條流裡完成。",
    enBody: "Draw, reveal, and read in one flow.",
  },
] as const;

const categoryKeywordMap: Array<{
  category: TarotCategoryId;
  keywords: string[];
}> = [
  {
    category: "timing",
    keywords: ["什麼時候", "何時", "時間", "when", "timing", "wait"],
  },
  {
    category: "decision",
    keywords: ["要不要", "該不該", "是否", "選擇", "決定", "choice", "decide", "should i"],
  },
  {
    category: "career",
    keywords: [
      "工作",
      "事業",
      "合作",
      "職涯",
      "面試",
      "升遷",
      "收入",
      "career",
      "job",
      "work",
      "business",
      "money",
    ],
  },
  {
    category: "love",
    keywords: [
      "感情",
      "愛情",
      "關係",
      "曖昧",
      "對方",
      "伴侶",
      "婚姻",
      "marriage",
      "relationship",
      "love",
      "partner",
    ],
  },
] as const;

function inferCategoryId(question: string): TarotCategoryId {
  const normalized = question.trim().toLowerCase();

  if (!normalized) {
    return "self";
  }

  for (const entry of categoryKeywordMap) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.category;
    }
  }

  return "self";
}

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
  const canContinue = question.trim().length > 0;
  const prompts = sparkPrompts[locale];
  const categoryDisplay = getCategoryDisplayMeta(categoryId);

  function applyQuestion(nextQuestion: string) {
    setQuestion(nextQuestion);
    setCategoryId(inferCategoryId(nextQuestion));
  }

  function handleUsePromptSpark() {
    const currentIndex = prompts.findIndex((prompt) => prompt === question.trim());
    const nextPrompt =
      currentIndex >= 0
        ? prompts[(currentIndex + 1) % prompts.length]
        : prompts[Date.now() % prompts.length];

    applyQuestion(nextPrompt);
  }

  if (!isAuthHydrated) {
    return (
      <section className="flex flex-1 flex-col justify-center py-8">
        <div className="space-y-3 rounded-[2rem] bg-white/[0.04] px-5 py-6">
          <p className="text-sm text-foreground/56">{t("正在確認狀態", "Preparing")}</p>
          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-card-foreground">
            {t("正在檢查你的占卜進度。", "Checking your reading state.")}
          </h1>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="flex flex-1 flex-col justify-between gap-8 py-6">
        <div className="space-y-4 pt-3">
          <span className="inline-flex items-center rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
            {t("THREE CARD READING", "THREE CARD READING")}
          </span>
          <div className="space-y-3">
            <h1 className="max-w-[14rem] text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
              {t("登入後，就能開始這次三張牌解讀", "Sign in first")}
            </h1>
            <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
              {t(
                "登入後才能保留你的提問、點數、主解讀與追問紀錄，之後也能回到同一條答案繼續看。",
                "Sign in first so your reading, points, and history can be kept.",
              )}
            </p>
          </div>
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
            {t("返回首頁", "Back to home")}
          </Link>
        </div>
      </section>
    );
  }

  if (session && !ownsCurrentSession) {
    return (
      <section className="flex flex-1 flex-col justify-between gap-8 py-6">
        <div className="space-y-4 pt-3">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-foreground/60">
            {t("CURRENT SESSION", "CURRENT SESSION")}
          </span>
          <div className="space-y-3">
            <h1 className="max-w-[14rem] text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
              {t("這裡已經有一條進行中的占卜流程", "Start fresh here")}
            </h1>
            <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
              {t(
                "這個裝置目前保留了另一份進行中的解讀。先清掉它，再開始新的問題，整條流程會更乾淨。",
                "This browser already holds a different reading. Clear it first before starting a new one.",
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => {
              void startNewReading();
            }}
            className="min-h-[3.75rem] rounded-[1.5rem] bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-92"
          >
            {t("清空後重新開始", "Clear and begin")}
          </button>
          <Link
            href="/"
            className="min-h-[3.75rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
          >
            {t("返回首頁", "Back to home")}
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
      <div className="space-y-4 pt-3">
        <span className="inline-flex items-center rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
          {t("THREE CARD READING", "THREE CARD READING")}
        </span>
        <div className="space-y-3">
          <h1 className="max-w-[14rem] text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
            {t("先把問題說清楚，再讓三張牌回答你", "Start with one question")}
          </h1>
          <p className="max-w-[18rem] text-base leading-7 text-foreground/62">
            {t(
              "這次我們只做直答三張牌。你只需要帶著一個清楚問題進來，其他交給儀式、抽牌與 AI 解讀。",
              "One clear question is enough to begin.",
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {entrySignals.map((item) => (
          <div
            key={item.zhTitle}
            className="rounded-[1.35rem] border border-white/8 bg-white/[0.04] px-3 py-4"
          >
            <p className="text-sm font-semibold text-card-foreground">
              {t(item.zhTitle, item.enTitle)}
            </p>
            <p className="mt-2 text-[11px] leading-5 text-foreground/56">
              {t(item.zhBody, item.enBody)}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-[1.9rem] border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-card-foreground">
              {t("把問題收成一句話", "Put it into one sentence")}
            </h2>
            <p className="text-sm leading-6 text-foreground/56">
              {t(
                "問題越聚焦，後面的三張牌與 AI 解讀就越容易直接回答你，而不是只給你泛泛建議。",
                "The clearer the question, the stronger the reading.",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleUsePromptSpark}
            className="shrink-0 rounded-full border border-[#f0cb97]/18 bg-[#f0cb97]/8 px-3 py-2 text-xs font-medium text-[#f3d4a7] transition hover:border-[#f0cb97]/30 hover:bg-[#f0cb97]/12"
          >
            {t("需要靈感", "Need inspiration")}
          </button>
        </div>

        <textarea
          value={question}
          maxLength={180}
          placeholder={t(
            "例如：我應不應該在這個月主動提出合作邀請？",
            "For example: Should I propose the collaboration this month?",
          )}
          onChange={(event) => applyQuestion(event.target.value)}
          className="mt-4 h-36 w-full resize-none rounded-[1.45rem] border border-white/10 bg-black/20 px-4 py-4 text-[0.98rem] leading-7 text-card-foreground outline-none transition placeholder:text-muted/70 focus:border-line-strong"
        />

        <div className="mt-3 flex items-center justify-between gap-4 text-xs text-foreground/46">
          <p>{t("先聚焦在一個主題上就好", "Keep it focused on one theme")}</p>
          <p>{question.trim().length}/180</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => applyQuestion(prompt)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-xs text-foreground/66 transition hover:border-line-strong hover:text-card-foreground"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.9rem] border border-white/8 bg-white/[0.04] p-5 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-card-foreground">
              {t(`這次會聚焦在 ${categoryDisplay.labelZh}`, `Focus: ${categoryDisplay.labelEn}`)}
            </h2>
            <p className="text-sm leading-6 text-foreground/56">
              {t(categoryDisplay.descriptionZh, categoryDisplay.descriptionEn)}
            </p>
          </div>

          <button
            type="button"
            aria-pressed={saveToHistory}
            onClick={() => setSaveToHistory(!saveToHistory)}
            className={`relative mt-1 flex h-8 w-14 items-center rounded-full border transition ${
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

        <div className="mt-4 rounded-[1.45rem] border border-white/10 bg-black/18 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/42">
            {t("問題預覽", "Question preview")}
          </p>
          <p className="mt-3 text-sm leading-7 text-card-foreground">
            &ldquo;{previewQuestion}&rdquo;
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-foreground/54">
            <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5">
              {t("牌陣：直答三張牌", "Spread: three-card")}
            </span>
            <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5">
              {t(
                "牌位：現況核心 / 隱藏阻力 / 最佳走向",
                "Core / Resistance / Direction",
              )}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 text-sm">
          <p className="text-foreground/56">
            {t("把這次解讀保留在歷史紀錄", "Keep this reading in history")}
          </p>
          <p className="font-medium text-card-foreground">
            {saveToHistory ? t("開啟", "On") : t("關閉", "Off")}
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
          className="min-h-[4.1rem] rounded-[1.7rem] border border-[#f7d9b2]/55 bg-[linear-gradient(180deg,#f5d49f_0%,#eabf80_46%,#d89e58_100%)] px-5 py-4 text-base font-semibold text-[#1b1209] shadow-[0_18px_52px_rgba(225,166,92,0.26),inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:-translate-y-px hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting
            ? t("正在整理這次牌陣", "Preparing the spread")
            : t("開始這次直答三張牌", "Begin the three-card reading")}
        </button>

        <Link
          href="/"
          className="min-h-[3.75rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-base font-medium text-card-foreground transition hover:border-white/16 hover:bg-white/[0.06]"
        >
          {t("返回首頁", "Back to home")}
        </Link>
      </div>
    </section>
  );
}
