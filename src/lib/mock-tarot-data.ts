export type TarotCategoryId =
  | "love"
  | "career"
  | "self"
  | "decision"
  | "timing";

export type TarotOrientation = "upright" | "reversed";

export type TarotCard = {
  id: string;
  name: string;
  sigil: string;
  arcana: string;
  tone: string;
  uprightText: string;
  reversedText: string;
  keywords: [string, string, string];
};

export type SelectedTarotCard = TarotCard & {
  orientation: TarotOrientation;
  slot: number;
  role: string;
  roleSubtitle: string;
};

export type ReadingSection = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
};

export const defaultQuestion =
  "What is quietly shifting beneath the surface of my current season?";

export const tarotCategories = [
  {
    id: "love",
    label: "Love",
    description: "Attachment, tenderness, and emotional clarity.",
  },
  {
    id: "career",
    label: "Career",
    description: "Direction, work, and material momentum.",
  },
  {
    id: "self",
    label: "Self",
    description: "Identity, healing, and inner alignment.",
  },
  {
    id: "decision",
    label: "Decision",
    description: "Crossroads, tradeoffs, and what to choose next.",
  },
  {
    id: "timing",
    label: "Timing",
    description: "When to move, wait, or let a cycle complete.",
  },
] as const;

export const cardRoles = [
  {
    role: "Threshold",
    roleSubtitle: "What the reading opens with",
  },
  {
    role: "Mirror",
    roleSubtitle: "What the situation reflects back",
  },
  {
    role: "Horizon",
    roleSubtitle: "What the next movement is asking for",
  },
] as const;

export const tarotDeck: TarotCard[] = [
  {
    id: "high-priestess",
    name: "The High Priestess",
    sigil: "II",
    arcana: "Major Arcana",
    tone: "Quiet knowledge already lives underneath the noise.",
    uprightText: "Trust the subtler signal instead of forcing clarity too early.",
    reversedText: "What is hidden becomes harder to hear when you rush for certainty.",
    keywords: ["intuition", "silence", "inner truth"],
  },
  {
    id: "empress",
    name: "The Empress",
    sigil: "III",
    arcana: "Major Arcana",
    tone: "Something fertile is asking to be nurtured with patience.",
    uprightText: "Growth comes through softness, care, and embodied attention.",
    reversedText: "You may be overgiving or disconnected from what truly replenishes you.",
    keywords: ["nurture", "abundance", "embodiment"],
  },
  {
    id: "lovers",
    name: "The Lovers",
    sigil: "VI",
    arcana: "Major Arcana",
    tone: "A choice becomes clearer when it is aligned with your values.",
    uprightText: "Connection deepens when honesty and desire are allowed in the same room.",
    reversedText: "Distraction appears when the heart and the decision are out of sync.",
    keywords: ["alignment", "choice", "bond"],
  },
  {
    id: "hermit",
    name: "The Hermit",
    sigil: "IX",
    arcana: "Major Arcana",
    tone: "Stepping back reveals what noise was covering.",
    uprightText: "Solitude becomes useful when it makes space for a truer signal.",
    reversedText: "Withdrawal can turn into delay when reflection never returns to action.",
    keywords: ["solitude", "clarity", "search"],
  },
  {
    id: "wheel",
    name: "Wheel of Fortune",
    sigil: "X",
    arcana: "Major Arcana",
    tone: "A cycle is turning even if you cannot feel the full movement yet.",
    uprightText: "Momentum returns when you cooperate with timing instead of resisting it.",
    reversedText: "What feels stuck may actually be a delayed turn rather than a final no.",
    keywords: ["timing", "cycle", "shift"],
  },
  {
    id: "justice",
    name: "Justice",
    sigil: "XI",
    arcana: "Major Arcana",
    tone: "A clear-eyed response matters more than an emotional reaction.",
    uprightText: "Balance is restored by naming what is true and acting accordingly.",
    reversedText: "Imbalance lingers when you avoid the cleanest version of the truth.",
    keywords: ["truth", "balance", "discernment"],
  },
  {
    id: "moon",
    name: "The Moon",
    sigil: "XVIII",
    arcana: "Major Arcana",
    tone: "Uncertainty is present, but it is not the same as danger.",
    uprightText: "Let ambiguity unfold before trying to pin it into a final answer.",
    reversedText: "What confuses you now may simply need more grounding and less projection.",
    keywords: ["mystery", "emotion", "shadow"],
  },
  {
    id: "star",
    name: "The Star",
    sigil: "XVII",
    arcana: "Major Arcana",
    tone: "Hope returns through honesty, not performance.",
    uprightText: "Healing begins when you stop bracing against what wants to soothe you.",
    reversedText: "Faith weakens when you measure progress only through immediate proof.",
    keywords: ["healing", "hope", "clarity"],
  },
  {
    id: "sun",
    name: "The Sun",
    sigil: "XIX",
    arcana: "Major Arcana",
    tone: "Warmth and truth become easier to receive together.",
    uprightText: "Visibility brings relief when you allow joy to be simple.",
    reversedText: "Brightness is available, but doubt may still be shading your view.",
    keywords: ["joy", "exposure", "vitality"],
  },
  {
    id: "temperance",
    name: "Temperance",
    sigil: "XIV",
    arcana: "Major Arcana",
    tone: "The right pace is often slower than the fear in the body wants.",
    uprightText: "Harmony returns through measured steps and thoughtful blending.",
    reversedText: "Too much force or urgency can disturb what needed a gentler hand.",
    keywords: ["balance", "pace", "integration"],
  },
];

const sectionBlueprints = [
  {
    id: "present",
    eyebrow: "I. Present Tide",
    title: "Where your energy is standing tonight",
  },
  {
    id: "hidden",
    eyebrow: "II. Hidden Pressure",
    title: "What is shaping events behind the surface",
  },
  {
    id: "emotional",
    eyebrow: "III. Inner Weather",
    title: "What your emotional body is processing",
  },
  {
    id: "release",
    eyebrow: "IV. Release",
    title: "What becomes lighter when you stop holding it",
  },
  {
    id: "choice",
    eyebrow: "V. Choice",
    title: "What wants to be chosen with intention",
  },
  {
    id: "timing",
    eyebrow: "VI. Next Seven Days",
    title: "How to move with better timing",
  },
  {
    id: "closing",
    eyebrow: "VII. Closing Omen",
    title: "The note this reading leaves in your hands",
  },
] as const;

export function getCategoryMeta(categoryId: TarotCategoryId) {
  return (
    tarotCategories.find((category) => category.id === categoryId) ??
    tarotCategories[0]
  );
}

export function buildSpread(seed: number) {
  const offset = Math.abs(seed) % tarotDeck.length;

  return Array.from({ length: 9 }, (_, index) => {
    return tarotDeck[(offset + index) % tarotDeck.length];
  });
}

export function buildSelectedCard(card: TarotCard, slot: number): SelectedTarotCard {
  const orientationScore =
    card.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), slot * 17) %
    4;
  const orientation: TarotOrientation =
    orientationScore === 0 ? "reversed" : "upright";
  const roleMeta = cardRoles[slot];

  return {
    ...card,
    orientation,
    slot,
    role: roleMeta.role,
    roleSubtitle: roleMeta.roleSubtitle,
  };
}

export function buildReadingSections(args: {
  question: string;
  categoryId: TarotCategoryId;
  cards: SelectedTarotCard[];
}) {
  const category = getCategoryMeta(args.categoryId);
  const [first, second, third] = args.cards;
  const focusQuestion = args.question.trim() || defaultQuestion;

  return sectionBlueprints.map((section, index) => {
    const anchorCard = args.cards[index % args.cards.length] ?? first;
    const cardLine =
      anchorCard.orientation === "upright"
        ? anchorCard.uprightText
        : anchorCard.reversedText;

    const bodyBySection = [
      `${first.name} sets the opening tone for "${focusQuestion}". The cards suggest that this chapter is less about immediate control and more about noticing what has already begun to move.`,
      `${second.name} shows the quieter pressure around your ${category.label.toLowerCase()} concerns. ${cardLine}`,
      `${third.name} reveals how your inner weather is reacting beneath the composed surface. The nervous system wants reassurance, but the spread asks for steadiness before conclusion.`,
      `The spread implies that part of the strain comes from staying loyal to an older interpretation. ${first.name} invites you to release the version of the story that only survives through repetition.`,
      `${second.name} turns the focus toward conscious choice. Small honest decisions matter more here than dramatic declarations, especially where ${category.label.toLowerCase()} is involved.`,
      `${third.name} frames the next stretch of time as responsive rather than fixed. Move with rhythm, not urgency, and let the pace of the week reveal what should be answered first.`,
      `Taken together, the spread closes on a quiet instruction: let ${first.name}, ${second.name}, and ${third.name} work as one sentence. The clearest next step is the one that leaves your body less divided afterward.`,
    ] as const;

    return {
      id: section.id,
      eyebrow: section.eyebrow,
      title: section.title,
      body: bodyBySection[index],
      accent: anchorCard.keywords[index % anchorCard.keywords.length],
    } satisfies ReadingSection;
  });
}
