export type TarotSpreadId =
  | "direct-answer-three"
  | "five-path-analysis"
  | "seven-star-horseshoe";

export type TarotSpreadRoleDefinition = {
  key: string;
  role: string;
  roleSubtitle: string;
  labelZh: string;
  labelEn: string;
  subtitleZh: string;
  subtitleEn: string;
};

export type TarotSpreadDefinition = {
  id: TarotSpreadId;
  nameZh: string;
  nameEn: string;
  descriptionZh: string;
  descriptionEn: string;
  cardCount: number;
  roles: TarotSpreadRoleDefinition[];
};

export const officialTarotSpreads: TarotSpreadDefinition[] = [
  {
    id: "direct-answer-three",
    nameZh: "直答三張牌",
    nameEn: "Direct Answer Three-Card Spread",
    descriptionZh:
      "用最短路徑回答問題：先看現況核心，再看隱藏阻力，最後收斂到最佳走向。",
    descriptionEn:
      "Answer the question directly through the present core, the hidden resistance, and the strongest next movement.",
    cardCount: 3,
    roles: [
      {
        key: "threshold",
        role: "Threshold",
        roleSubtitle: "What the reading opens with",
        labelZh: "現況核心",
        labelEn: "Present Core",
        subtitleZh: "先把局勢真正的起點講清楚",
        subtitleEn: "What the situation is really opening with",
      },
      {
        key: "mirror",
        role: "Mirror",
        roleSubtitle: "What the situation reflects back",
        labelZh: "隱藏阻力",
        labelEn: "Hidden Resistance",
        subtitleZh: "照出你還沒完全正視的卡點",
        subtitleEn: "What hidden friction or blind spot is shaping the question",
      },
      {
        key: "horizon",
        role: "Horizon",
        roleSubtitle: "What the next movement is asking for",
        labelZh: "最佳走向",
        labelEn: "Best Direction",
        subtitleZh: "指出接下來最值得採取的方向",
        subtitleEn: "What the strongest next move is asking for",
      },
    ],
  },
  {
    id: "five-path-analysis",
    nameZh: "五路剖析牌陣",
    nameEn: "Five-Path Analysis Spread",
    descriptionZh:
      "把問題拆成五層：核心、內在、外在、建議與近期結果，適合複雜情境。",
    descriptionEn:
      "Break the question into five layers: core, inner state, outer influence, guidance, and the near-term outcome.",
    cardCount: 5,
    roles: [
      {
        key: "core",
        role: "Core",
        roleSubtitle: "The heart of the question",
        labelZh: "問題核心",
        labelEn: "Core Issue",
        subtitleZh: "這題真正要處理的是什麼",
        subtitleEn: "What the heart of the question truly is",
      },
      {
        key: "inner-state",
        role: "InnerState",
        roleSubtitle: "What is happening inside you",
        labelZh: "內在狀態",
        labelEn: "Inner State",
        subtitleZh: "你的情緒、信念與心理位置",
        subtitleEn: "What is happening inside you emotionally and mentally",
      },
      {
        key: "outer-influence",
        role: "OuterInfluence",
        roleSubtitle: "What is pressing in from the outside",
        labelZh: "外在影響",
        labelEn: "Outer Influence",
        subtitleZh: "現實環境、人際與外部壓力",
        subtitleEn: "What the outer environment is doing to the situation",
      },
      {
        key: "guidance",
        role: "Guidance",
        roleSubtitle: "What the cards recommend next",
        labelZh: "關鍵建議",
        labelEn: "Guidance",
        subtitleZh: "你現在最值得採取的策略",
        subtitleEn: "What the cards recommend you do next",
      },
      {
        key: "near-outcome",
        role: "NearOutcome",
        roleSubtitle: "Where the situation is heading soon",
        labelZh: "近期結果",
        labelEn: "Near Outcome",
        subtitleZh: "如果照現在的節奏走，近期會往哪裡發展",
        subtitleEn: "Where the situation is heading in the near term",
      },
    ],
  },
  {
    id: "seven-star-horseshoe",
    nameZh: "七星馬蹄牌陣",
    nameEn: "Seven-Star Horseshoe Spread",
    descriptionZh:
      "看整體局勢與轉折點，適合大題、長期關係、職涯或人生階段問題。",
    descriptionEn:
      "Reveal the wider arc of a situation and its turning point, ideal for bigger life questions and long-range developments.",
    cardCount: 7,
    roles: [
      {
        key: "past-background",
        role: "PastBackground",
        roleSubtitle: "What brought the situation here",
        labelZh: "過去背景",
        labelEn: "Past Background",
        subtitleZh: "這件事是怎麼一步步走到現在的",
        subtitleEn: "What led the situation to this point",
      },
      {
        key: "present-state",
        role: "PresentState",
        roleSubtitle: "What is happening now",
        labelZh: "現在局勢",
        labelEn: "Present State",
        subtitleZh: "當下真正的局勢站在哪裡",
        subtitleEn: "What the current state truly looks like",
      },
      {
        key: "hidden-influence",
        role: "HiddenInfluence",
        roleSubtitle: "What is operating beneath the surface",
        labelZh: "隱藏影響",
        labelEn: "Hidden Influence",
        subtitleZh: "表面底下還有什麼在推動事情",
        subtitleEn: "What is operating beneath the surface",
      },
      {
        key: "turning-point",
        role: "TurningPoint",
        roleSubtitle: "What shifts the direction of events",
        labelZh: "關鍵轉折",
        labelEn: "Turning Point",
        subtitleZh: "真正讓局勢換檔的點在哪裡",
        subtitleEn: "What changes the direction of events",
      },
      {
        key: "response",
        role: "Response",
        roleSubtitle: "How you should respond",
        labelZh: "你該怎麼做",
        labelEn: "Your Response",
        subtitleZh: "你現在最應該採取的姿態與做法",
        subtitleEn: "How you should respond to the situation",
      },
      {
        key: "outer-trend",
        role: "OuterTrend",
        roleSubtitle: "What the outer flow is doing",
        labelZh: "外在走勢",
        labelEn: "Outer Trend",
        subtitleZh: "外在現實接下來會怎麼推動這件事",
        subtitleEn: "How the outer current is likely to move next",
      },
      {
        key: "near-future",
        role: "NearFuture",
        roleSubtitle: "What the near future is likely to look like",
        labelZh: "近未來結果",
        labelEn: "Near Future",
        subtitleZh: "近期最可能出現的結果與方向",
        subtitleEn: "What the near future is likely to bring",
      },
    ],
  },
];

export const defaultOfficialTarotSpread = officialTarotSpreads[0];

const roleLookup = new Map<string, TarotSpreadRoleDefinition>();

for (const spread of officialTarotSpreads) {
  for (const role of spread.roles) {
    roleLookup.set(role.role, role);
  }
}

export function getTarotSpreadById(spreadId: TarotSpreadId) {
  return (
    officialTarotSpreads.find((spread) => spread.id === spreadId) ??
    defaultOfficialTarotSpread
  );
}

export function getDefaultTarotSpreadCardCount() {
  return defaultOfficialTarotSpread.cardCount;
}

export function getTarotSpreadRoleDefinition(role: string) {
  return roleLookup.get(role) ?? null;
}
