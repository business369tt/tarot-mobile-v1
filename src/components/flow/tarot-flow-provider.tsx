"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  buildSelectedCard,
  cardRoles,
  getCategoryMeta,
  type SelectedTarotCard,
  type TarotCard,
  type TarotCategoryId,
} from "@/lib/mock-tarot-data";
import {
  defaultTarotDraft,
  getSessionResumeRoute,
  isSessionOwnedByViewer,
  normalizeTarotDraft,
  normalizeTarotSession,
  type TarotDraft,
  type TarotFlowStep,
  type TarotSession,
} from "@/lib/tarot-session";

type TarotFlowContextValue = {
  isHydrated: boolean;
  session: TarotSession | null;
  ownsCurrentSession: boolean;
  question: string;
  categoryId: TarotCategoryId;
  categoryMeta: ReturnType<typeof getCategoryMeta>;
  sessionCategoryMeta: ReturnType<typeof getCategoryMeta>;
  spreadCards: TarotCard[];
  selectedCards: SelectedTarotCard[];
  revealedCount: number;
  setQuestion: (value: string) => void;
  setCategoryId: (value: TarotCategoryId) => void;
  createSessionFromDraft: () => Promise<TarotSession | null>;
  beginShuffle: () => void;
  toggleCardSelection: (cardId: string) => void;
  removeSelectedCard: (cardId: string) => void;
  resetSelection: () => void;
  revealNextCard: () => void;
  resetReveal: () => void;
  startNewReading: () => Promise<void>;
  getResumeRoute: () => string;
  setCurrentStep: (step: TarotFlowStep) => void;
};

type SessionApiResponse = {
  session: TarotSession | null;
};

const TarotFlowContext = createContext<TarotFlowContextValue | null>(null);

async function requestTarotSession(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: Record<string, unknown>,
) {
  const response = await fetch("/api/tarot-session", {
    method,
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Tarot session request failed: ${response.status}`);
  }

  return (await response.json()) as SessionApiResponse;
}

function toPatchPayload(session: TarotSession) {
  return {
    currentStep: session.currentStep,
    question: session.question,
    category: session.category,
    spreadCards: session.spreadCards,
    selectedCards: session.selectedCards,
    revealed: session.revealed,
    ritualStartedAt: session.ritualStartedAt,
  };
}

function rebuildSelection(cards: SelectedTarotCard[]) {
  return cards.map((card, index) => buildSelectedCard(card, index));
}

export function TarotFlowProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { isHydrated: isAuthHydrated, isAuthenticated, viewerId } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [draft, setDraft] = useState<TarotDraft>(defaultTarotDraft);
  const [session, setSession] = useState<TarotSession | null>(null);
  const sessionRef = useRef<TarotSession | null>(null);
  const mutationQueueRef = useRef(Promise.resolve());

  function applyServerSession(nextSession: TarotSession | null) {
    const normalized = nextSession ? normalizeTarotSession(nextSession) : null;

    sessionRef.current = normalized;
    setSession(normalized);
    setDraft(
      normalized
        ? {
            question: normalized.question,
            category: normalized.category,
          }
        : defaultTarotDraft,
    );

    return normalized;
  }

  async function refreshSession() {
    if (!isAuthenticated) {
      return applyServerSession(null);
    }

    const data = await requestTarotSession("GET");

    return applyServerSession(data.session);
  }

  function enqueueSessionPersist(nextSession: TarotSession) {
    mutationQueueRef.current = mutationQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const data = await requestTarotSession("PATCH", toPatchPayload(nextSession));

        applyServerSession(data.session);
      })
      .catch(async () => {
        try {
          await refreshSession();
        } catch {
          applyServerSession(null);
        }
      });
  }

  function updateCurrentSession(
    updater: (current: TarotSession) => TarotSession,
  ) {
    const currentSession = sessionRef.current;

    if (!currentSession) {
      return;
    }

    const optimisticSession = normalizeTarotSession(updater(currentSession));

    sessionRef.current = optimisticSession;
    setSession(optimisticSession);
    enqueueSessionPersist(optimisticSession);
  }

  useEffect(() => {
    let cancelled = false;

    async function restoreFlow() {
      if (!isAuthHydrated) {
        return;
      }

      if (!isAuthenticated) {
        if (!cancelled) {
          mutationQueueRef.current = Promise.resolve();
          applyServerSession(null);
          setIsHydrated(true);
        }

        return;
      }

      if (!cancelled) {
        setIsHydrated(false);
      }

      try {
        const data = await requestTarotSession("GET");
        const restoredSession = applyServerSession(data.session);

        if (!cancelled && !restoredSession) {
          setDraft(defaultTarotDraft);
        }
      } catch {
        if (!cancelled) {
          applyServerSession(null);
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    }

    void restoreFlow();

    return () => {
      cancelled = true;
    };
  }, [isAuthHydrated, isAuthenticated, viewerId]);

  const ownsCurrentSession = isSessionOwnedByViewer(session, viewerId);
  const question = draft.question;
  const categoryId = draft.category;
  const categoryMeta = getCategoryMeta(categoryId);
  const sessionCategoryMeta = getCategoryMeta(session?.category ?? categoryId);
  const spreadCards = session?.spreadCards ?? [];
  const selectedCards = session?.selectedCards ?? [];
  const revealedCount = session?.revealed ?? 0;

  return (
    <TarotFlowContext.Provider
      value={{
        isHydrated,
        session,
        ownsCurrentSession,
        question,
        categoryId,
        categoryMeta,
        sessionCategoryMeta,
        spreadCards,
        selectedCards,
        revealedCount,
        setQuestion: (value) => {
          setDraft((current) => ({
            ...current,
            question: value.slice(0, 180),
          }));
        },
        setCategoryId: (value) => {
          setDraft((current) => ({
            ...current,
            category: value,
          }));
        },
        createSessionFromDraft: async () => {
          if (!isAuthenticated) {
            return null;
          }

          const nextDraft = normalizeTarotDraft(draft);

          setDraft(nextDraft);

          const data = await requestTarotSession("POST", nextDraft);

          return applyServerSession(data.session);
        },
        beginShuffle: () => {
          updateCurrentSession((current) => ({
            ...current,
            ritualStartedAt: current.ritualStartedAt ?? new Date().toISOString(),
          }));
        },
        toggleCardSelection: (cardId) => {
          updateCurrentSession((current) => {
            const existingIndex = current.selectedCards.findIndex(
              (card) => card.id === cardId,
            );

            if (existingIndex >= 0) {
              const remainingCards = rebuildSelection(
                current.selectedCards.filter((card) => card.id !== cardId),
              );

              return {
                ...current,
                selectedCards: remainingCards,
                revealed: Math.min(current.revealed, remainingCards.length),
              };
            }

            if (current.selectedCards.length >= cardRoles.length) {
              return current;
            }

            const card = current.spreadCards.find((spreadCard) => spreadCard.id === cardId);

            if (!card) {
              return current;
            }

            return {
              ...current,
              selectedCards: [
                ...current.selectedCards,
                buildSelectedCard(card, current.selectedCards.length),
              ],
            };
          });
        },
        removeSelectedCard: (cardId) => {
          updateCurrentSession((current) => {
            const remainingCards = rebuildSelection(
              current.selectedCards.filter((card) => card.id !== cardId),
            );

            return {
              ...current,
              selectedCards: remainingCards,
              revealed: Math.min(current.revealed, remainingCards.length),
            };
          });
        },
        resetSelection: () => {
          updateCurrentSession((current) => ({
            ...current,
            selectedCards: [],
            revealed: 0,
          }));
        },
        revealNextCard: () => {
          updateCurrentSession((current) => ({
            ...current,
            revealed: Math.min(current.selectedCards.length, current.revealed + 1),
          }));
        },
        resetReveal: () => {
          updateCurrentSession((current) => ({
            ...current,
            revealed: 0,
          }));
        },
        startNewReading: async () => {
          mutationQueueRef.current = Promise.resolve();
          applyServerSession(null);

          if (!isAuthenticated) {
            return;
          }

          try {
            await requestTarotSession("DELETE");
          } catch {
            applyServerSession(null);
          }
        },
        getResumeRoute: () => getSessionResumeRoute(sessionRef.current),
        setCurrentStep: (step) => {
          updateCurrentSession((current) => {
            if (step === "ritual") {
              return {
                ...current,
                ritualStartedAt: null,
                selectedCards: [],
                revealed: 0,
              };
            }

            if (step === "draw") {
              return {
                ...current,
                ritualStartedAt: current.ritualStartedAt ?? new Date().toISOString(),
                selectedCards: [],
                revealed: 0,
              };
            }

            if (step === "reveal") {
              return {
                ...current,
                ritualStartedAt: current.ritualStartedAt ?? new Date().toISOString(),
                revealed: 0,
              };
            }

            if (step === "reading") {
              return {
                ...current,
                ritualStartedAt: current.ritualStartedAt ?? new Date().toISOString(),
                revealed: Math.max(current.revealed, current.selectedCards.length),
              };
            }

            return current;
          });
        },
      }}
    >
      {children}
    </TarotFlowContext.Provider>
  );
}

export function useTarotFlow() {
  const context = useContext(TarotFlowContext);

  if (!context) {
    throw new Error("useTarotFlow must be used inside TarotFlowProvider");
  }

  return context;
}
