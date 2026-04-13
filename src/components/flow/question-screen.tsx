"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTarotFlow } from "@/components/flow/tarot-flow-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import { type TarotCategoryId } from "@/lib/mock-tarot-data";

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
    setQuestion,
    setCategoryId,
    createSessionFromDraft,
    startNewReading,
  } = useTarotFlow();
  const canContinue = question.trim().length > 0;
  const prompts = sparkPrompts[locale];

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
        <div className="space-y-4 pt-6">
          <span className="inline-flex items-center rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
            {t("THREE CARD READING", "THREE CARD READING")}
          </span>
          <div className="space-y-3">
            <h1 className="max-w-[15rem] text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
              {t("先登入，再開始這次三張牌解讀", "Sign in to begin")}
            </h1>
            <p className="max-w-[19rem] text-base leading-7 text-foreground/62">
              {t(
                "登入後才能開始這次占卜、使用點數，並順利完成完整解讀。",
                "Sign in first to start the reading and use points.",
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
        </div>
      </section>
    );
  }

  if (session && !ownsCurrentSession) {
    return (
      <section className="flex flex-1 flex-col justify-between gap-8 py-6">
        <div className="space-y-4 pt-6">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-foreground/60">
            {t("CURRENT SESSION", "CURRENT SESSION")}
          </span>
          <div className="space-y-3">
            <h1 className="max-w-[15rem] text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
              {t("先清掉目前流程，再開始新問題", "Clear the current flow first")}
            </h1>
            <p className="max-w-[19rem] text-base leading-7 text-foreground/62">
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
    <section className="flex flex-1 flex-col justify-between gap-8 py-6">
      <div className="space-y-4 pt-6">
        <span className="inline-flex items-center rounded-full border border-[#f1c98d]/18 bg-[#f1c98d]/8 px-3 py-1 text-[0.72rem] font-medium tracking-[0.18em] text-[#f3d4a7]">
          {t("THREE CARD READING", "THREE CARD READING")}
        </span>
        <div className="space-y-3">
          <h1 className="max-w-[15rem] text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-card-foreground">
            {t("你現在最想問什麼？", "What do you most want to ask?")}
          </h1>
          <p className="max-w-[19rem] text-base leading-7 text-foreground/62">
            {t(
              "帶著一個清楚問題進來，系統會直接帶你完成直答三張牌與完整解讀。",
              "Bring one clear question and we will guide you through the full three-card reading.",
            )}
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-card-foreground">
            {t("一句話就夠了", "One sentence is enough")}
          </p>
          <button
            type="button"
            onClick={handleUsePromptSpark}
            className="shrink-0 rounded-full border border-[#f0cb97]/18 bg-[#f0cb97]/8 px-3 py-2 text-xs font-medium text-[#f3d4a7] transition hover:border-[#f0cb97]/30 hover:bg-[#f0cb97]/12"
          >
            {t("給我靈感", "Need inspiration")}
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
          className="mt-4 h-44 w-full resize-none rounded-[1.55rem] border border-white/10 bg-black/20 px-4 py-4 text-[1rem] leading-7 text-card-foreground outline-none transition placeholder:text-muted/70 focus:border-line-strong"
        />

        <div className="mt-3 flex items-center justify-between gap-4 text-xs text-foreground/46">
          <p>
            {t(
              "系統會自動判斷題目脈絡，並直接進入直答三張牌。",
              "We will infer the focus and guide you into the three-card spread.",
            )}
          </p>
          <p>{question.trim().length}/180</p>
        </div>

        <div className="mt-4 grid gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => applyQuestion(prompt)}
              className="rounded-[1.15rem] border border-white/10 bg-black/18 px-4 py-3 text-left text-sm leading-6 text-foreground/72 transition hover:border-line-strong hover:text-card-foreground"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
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
      </div>
    </section>
  );
}
