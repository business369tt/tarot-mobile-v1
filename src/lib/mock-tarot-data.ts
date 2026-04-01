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

export const defaultQuestionDisplay = {
  zh: "我目前這段人生節奏的底層，正安靜發生什麼轉變？",
  en: defaultQuestion,
} as const;

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

const categoryDisplayMeta = {
  love: {
    labelZh: "感情",
    labelEn: "Love",
    descriptionZh: "關係、情感流動，以及更清楚的心意。",
    descriptionEn: "Attachment, tenderness, and emotional clarity.",
  },
  career: {
    labelZh: "事業",
    labelEn: "Career",
    descriptionZh: "方向、工作節奏，以及現實層面的推進。",
    descriptionEn: "Direction, work, and material momentum.",
  },
  self: {
    labelZh: "自我",
    labelEn: "Self",
    descriptionZh: "自我認同、療癒過程，以及內在對齊。",
    descriptionEn: "Identity, healing, and inner alignment.",
  },
  decision: {
    labelZh: "抉擇",
    labelEn: "Decision",
    descriptionZh: "岔路、取捨，以及下一步的選擇。",
    descriptionEn: "Crossroads, tradeoffs, and what to choose next.",
  },
  timing: {
    labelZh: "時機",
    labelEn: "Timing",
    descriptionZh: "何時前進、等待，或讓一個循環自然結束。",
    descriptionEn: "When to move, wait, or let a cycle complete.",
  },
} as const satisfies Record<
  TarotCategoryId,
  {
    labelZh: string;
    labelEn: string;
    descriptionZh: string;
    descriptionEn: string;
  }
>;

const cardRoleDisplayMeta = {
  Threshold: {
    labelZh: "門檻位",
    labelEn: "Threshold",
    subtitleZh: "解讀從這裡開場",
    subtitleEn: "What the reading opens with",
  },
  Mirror: {
    labelZh: "映照位",
    labelEn: "Mirror",
    subtitleZh: "情勢映回來的那一面",
    subtitleEn: "What the situation reflects back",
  },
  Horizon: {
    labelZh: "地平位",
    labelEn: "Horizon",
    subtitleZh: "下一步正在要求的動作",
    subtitleEn: "What the next movement is asking for",
  },
} as const;

const cardDisplayMeta = {
  "high-priestess": {
    nameZh: "女祭司",
    nameEn: "The High Priestess",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    toneZh: "安靜的知識早已藏在喧囂之下。",
    toneEn: "Quiet knowledge already lives underneath the noise.",
    uprightZh: "與其太早逼出答案，不如先相信更細微的訊號。",
    uprightEn: "Trust the subtler signal instead of forcing clarity too early.",
    reversedZh: "當你急著求得確定，真正隱藏的訊息反而更難被聽見。",
    reversedEn: "What is hidden becomes harder to hear when you rush for certainty.",
    keywordsZh: ["直覺", "靜默", "內在真相"],
    keywordsEn: ["intuition", "silence", "inner truth"],
  },
  empress: {
    nameZh: "皇后",
    nameEn: "The Empress",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    toneZh: "有某件正在孕育的事，需要你以耐心照料。",
    toneEn: "Something fertile is asking to be nurtured with patience.",
    uprightZh: "成長來自柔軟、照顧與身體感受。",
    uprightEn: "Growth comes through softness, care, and embodied attention.",
    reversedZh: "你可能給得太多，或與真正能滋養自己的事物失去連結。",
    reversedEn: "You may be overgiving or disconnected from what truly replenishes you.",
    keywordsZh: ["滋養", "豐盛", "落地"],
    keywordsEn: ["nurture", "abundance", "embodiment"],
  },
  lovers: {
    nameZh: "戀人",
    nameEn: "The Lovers",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    toneZh: "當選擇與價值一致時，答案會更清楚。",
    toneEn: "A choice becomes clearer when it is aligned with your values.",
    uprightZh: "當誠實與渴望能待在同一個空間，連結就會加深。",
    uprightEn: "Connection deepens when honesty and desire are allowed in the same room.",
    reversedZh: "當內心與決定不同步時，分心就會出現。",
    reversedEn: "Distraction appears when the heart and the decision are out of sync.",
    keywordsZh: ["一致", "選擇", "連結"],
    keywordsEn: ["alignment", "choice", "bond"],
  },
  hermit: {
    nameZh: "隱者",
    nameEn: "The Hermit",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    toneZh: "後退一步，才看得見原本被雜音蓋住的東西。",
    toneEn: "Stepping back reveals what noise was covering.",
    uprightZh: "當獨處能騰出空間給更真實的訊號時，它就有意義。",
    uprightEn: "Solitude becomes useful when it makes space for a truer signal.",
    reversedZh: "如果反思始終沒有回到行動，抽離就可能變成拖延。",
    reversedEn: "Withdrawal can turn into delay when reflection never returns to action.",
    keywordsZh: ["獨處", "清明", "尋找"],
    keywordsEn: ["solitude", "clarity", "search"],
  },
  wheel: {
    nameZh: "命運之輪",
    nameEn: "Wheel of Fortune",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    toneZh: "就算你還沒感覺到全貌，循環也已經在轉動。",
    toneEn: "A cycle is turning even if you cannot feel the full movement yet.",
    uprightZh: "當你順著時機合作，而不是抗拒它，動能就會回來。",
    uprightEn: "Momentum returns when you cooperate with timing instead of resisting it.",
    reversedZh: "看似卡住的局面，未必是否定，也可能只是延後的轉向。",
    reversedEn: "What feels stuck may actually be a delayed turn rather than a final no.",
    keywordsZh: ["時機", "循環", "轉變"],
    keywordsEn: ["timing", "cycle", "shift"],
  },
  justice: {
    nameZh: "正義",
    nameEn: "Justice",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    toneZh: "看清事實後的回應，比情緒性的反應更重要。",
    toneEn: "A clear-eyed response matters more than an emotional reaction.",
    uprightZh: "當你說出真相並依此行動，平衡就會回來。",
    uprightEn: "Balance is restored by naming what is true and acting accordingly.",
    reversedZh: "若你迴避最乾淨的真相，不平衡就會持續停留。",
    reversedEn: "Imbalance lingers when you avoid the cleanest version of the truth.",
    keywordsZh: ["真相", "平衡", "判斷"],
    keywordsEn: ["truth", "balance", "discernment"],
  },
  moon: {
    nameZh: "月亮",
    nameEn: "The Moon",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    toneZh: "不確定正在發生，但那不等於危險。",
    toneEn: "Uncertainty is present, but it is not the same as danger.",
    uprightZh: "先讓模糊展開，再決定要不要把它釘成最後答案。",
    uprightEn: "Let ambiguity unfold before trying to pin it into a final answer.",
    reversedZh: "此刻讓你混亂的事，也許只是需要更多著地，而不是更多投射。",
    reversedEn: "What confuses you now may simply need more grounding and less projection.",
    keywordsZh: ["迷霧", "情緒", "陰影"],
    keywordsEn: ["mystery", "emotion", "shadow"],
  },
  star: {
    nameZh: "星星",
    nameEn: "The Star",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    toneZh: "希望回來的方式，是誠實，而不是表演。",
    toneEn: "Hope returns through honesty, not performance.",
    uprightZh: "當你不再對抗那些想安撫你的事物，療癒就會開始。",
    uprightEn: "Healing begins when you stop bracing against what wants to soothe you.",
    reversedZh: "如果你只用立刻見效來衡量進展，信心就會變弱。",
    reversedEn: "Faith weakens when you measure progress only through immediate proof.",
    keywordsZh: ["療癒", "希望", "清澈"],
    keywordsEn: ["healing", "hope", "clarity"],
  },
  sun: {
    nameZh: "太陽",
    nameEn: "The Sun",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    toneZh: "當溫暖與真相一起被接住，事情會更容易明朗。",
    toneEn: "Warmth and truth become easier to receive together.",
    uprightZh: "當你允許喜悅保持簡單，可見性就會帶來鬆動。",
    uprightEn: "Visibility brings relief when you allow joy to be simple.",
    reversedZh: "光亮其實已經在場，只是懷疑還在替你的視線罩上一層影子。",
    reversedEn: "Brightness is available, but doubt may still be shading your view.",
    keywordsZh: ["喜悅", "曝光", "生命力"],
    keywordsEn: ["joy", "exposure", "vitality"],
  },
  temperance: {
    nameZh: "節制",
    nameEn: "Temperance",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    toneZh: "真正合適的節奏，往往比身體裡的恐懼更慢一些。",
    toneEn: "The right pace is often slower than the fear in the body wants.",
    uprightZh: "透過節制、調和與穩定步伐，和諧會慢慢回來。",
    uprightEn: "Harmony returns through measured steps and thoughtful blending.",
    reversedZh: "當力道太猛、太急，原本需要柔和對待的事情就會被攪亂。",
    reversedEn: "Too much force or urgency can disturb what needed a gentler hand.",
    keywordsZh: ["節奏", "調和", "整合"],
    keywordsEn: ["balance", "pace", "integration"],
  },
} as const satisfies Record<
  string,
  {
    nameZh: string;
    nameEn: string;
    arcanaZh: string;
    arcanaEn: string;
    toneZh: string;
    toneEn: string;
    uprightZh: string;
    uprightEn: string;
    reversedZh: string;
    reversedEn: string;
    keywordsZh: [string, string, string];
    keywordsEn: [string, string, string];
  }
>;

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

export function getCategoryDisplayMeta(categoryId: TarotCategoryId) {
  return categoryDisplayMeta[categoryId] ?? categoryDisplayMeta.love;
}

export function getCardRoleDisplayMeta(role: string) {
  return (
    cardRoleDisplayMeta[role as keyof typeof cardRoleDisplayMeta] ?? {
      labelZh: role,
      labelEn: role,
      subtitleZh: role,
      subtitleEn: role,
    }
  );
}

export function getOrientationDisplayMeta(orientation: TarotOrientation) {
  return orientation === "upright"
    ? {
        zh: "正位",
        en: "Upright",
      }
    : {
        zh: "逆位",
        en: "Reversed",
      };
}

export function getCardDisplayMeta(cardId: string) {
  const mapped = cardDisplayMeta[cardId as keyof typeof cardDisplayMeta];

  if (mapped) {
    return mapped;
  }

  const fallbackCard = tarotDeck.find((card) => card.id === cardId);
  const fallbackKeywords = fallbackCard?.keywords ?? ["keyword", "keyword", "keyword"];

  return {
    nameZh: fallbackCard?.name ?? "牌卡",
    nameEn: fallbackCard?.name ?? "Card",
    arcanaZh: "阿爾克那",
    arcanaEn: fallbackCard?.arcana ?? "Arcana",
    toneZh: fallbackCard?.tone ?? "",
    toneEn: fallbackCard?.tone ?? "",
    uprightZh: fallbackCard?.uprightText ?? "",
    uprightEn: fallbackCard?.uprightText ?? "",
    reversedZh: fallbackCard?.reversedText ?? "",
    reversedEn: fallbackCard?.reversedText ?? "",
    keywordsZh: [
      fallbackKeywords[0],
      fallbackKeywords[1],
      fallbackKeywords[2],
    ] as [string, string, string],
    keywordsEn: [
      fallbackKeywords[0],
      fallbackKeywords[1],
      fallbackKeywords[2],
    ] as [string, string, string],
  };
}

export function buildSpread(seed: number) {
  const offset = Math.abs(seed) % tarotDeck.length;

  return Array.from({ length: 9 }, (_, index) => {
    return tarotDeck[(offset + index) % tarotDeck.length];
  });
}

export function buildSelectedCard(card: TarotCard, slot: number): SelectedTarotCard {
  const orientationScore =
    card.id
      .split("")
      .reduce((acc: number, char: string) => acc + char.charCodeAt(0), slot * 17) %
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

  return sectionBlueprints.map((section: (typeof sectionBlueprints)[number], index: number) => {
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
