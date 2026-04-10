import {
  defaultOfficialTarotSpread,
  getTarotSpreadRoleDefinition,
} from "@/lib/tarot-spreads";

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

type TarotCardDisplayMeta = {
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
};

type TarotCardCatalogEntry = TarotCard & TarotCardDisplayMeta;

type MinorSuitId = "wands" | "cups" | "swords" | "pentacles";

type MinorRankId =
  | "ace"
  | "two"
  | "three"
  | "four"
  | "five"
  | "six"
  | "seven"
  | "eight"
  | "nine"
  | "ten"
  | "page"
  | "knight"
  | "queen"
  | "king";

export const defaultQuestion =
  "What is quietly shifting beneath the surface of my current season?";

export const defaultQuestionDisplay = {
  zh: "此刻我的人生底下，正在悄悄改變的是什麼？",
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

export const cardRoles = defaultOfficialTarotSpread.roles.map((role) => ({
  role: role.role,
  roleSubtitle: role.roleSubtitle,
})) as ReadonlyArray<{
  role: string;
  roleSubtitle: string;
}>;

const categoryDisplayMeta = {
  love: {
    labelZh: "感情",
    labelEn: "Love",
    descriptionZh: "關係、吸引、情感界線，以及彼此是否真心靠近。",
    descriptionEn: "Attachment, tenderness, and emotional clarity.",
  },
  career: {
    labelZh: "事業",
    labelEn: "Career",
    descriptionZh: "工作、方向、收入、責任，以及外在進展。",
    descriptionEn: "Direction, work, and material momentum.",
  },
  self: {
    labelZh: "自我",
    labelEn: "Self",
    descriptionZh: "內在狀態、療癒歷程、自我認同，以及精神重心。",
    descriptionEn: "Identity, healing, and inner alignment.",
  },
  decision: {
    labelZh: "抉擇",
    labelEn: "Decision",
    descriptionZh: "兩難、取捨、判斷，以及下一步該怎麼選。",
    descriptionEn: "Crossroads, tradeoffs, and what to choose next.",
  },
  timing: {
    labelZh: "時機",
    labelEn: "Timing",
    descriptionZh: "什麼時候推進、等待、收尾，或讓事情自然成熟。",
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

function createCatalogEntry(args: {
  id: string;
  sigil: string;
  arcanaZh: string;
  arcanaEn: string;
  nameZh: string;
  nameEn: string;
  toneZh: string;
  toneEn: string;
  uprightZh: string;
  uprightEn: string;
  reversedZh: string;
  reversedEn: string;
  keywordsZh: [string, string, string];
  keywordsEn: [string, string, string];
}): TarotCardCatalogEntry {
  return {
    id: args.id,
    name: args.nameEn,
    sigil: args.sigil,
    arcana: args.arcanaEn,
    tone: args.toneEn,
    uprightText: args.uprightEn,
    reversedText: args.reversedEn,
    keywords: args.keywordsEn,
    nameZh: args.nameZh,
    nameEn: args.nameEn,
    arcanaZh: args.arcanaZh,
    arcanaEn: args.arcanaEn,
    toneZh: args.toneZh,
    toneEn: args.toneEn,
    uprightZh: args.uprightZh,
    uprightEn: args.uprightEn,
    reversedZh: args.reversedZh,
    reversedEn: args.reversedEn,
    keywordsZh: args.keywordsZh,
    keywordsEn: args.keywordsEn,
  };
}

const majorArcanaCatalog: TarotCardCatalogEntry[] = [
  createCatalogEntry({
    id: "the-fool",
    sigil: "0",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "愚者",
    nameEn: "The Fool",
    toneZh: "一段新的旅程已經在你腳邊，重點不是算盡風險，而是看見召喚。",
    toneEn: "A new path is already opening, and the lesson is to notice the call before you overcalculate the risk.",
    uprightZh: "正位的愚者鼓勵你跨出第一步。你不需要什麼都確定，先讓行動帶出答案。",
    uprightEn: "Upright, The Fool asks you to take the first step. You do not need full certainty before movement begins.",
    reversedZh: "逆位的愚者提醒你別用衝動假裝勇敢。真正的開始，仍然需要基本判斷與界線。",
    reversedEn: "Reversed, The Fool warns against calling recklessness courage. A real beginning still needs discernment and boundaries.",
    keywordsZh: ["開始", "勇氣", "未知"],
    keywordsEn: ["beginning", "courage", "unknown"],
  }),
  createCatalogEntry({
    id: "the-magician",
    sigil: "I",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "魔術師",
    nameEn: "The Magician",
    toneZh: "你手上的資源比想像中更多，關鍵在於是否願意主動整合。",
    toneEn: "You already hold more resources than you think, and the turning point is whether you will actively assemble them.",
    uprightZh: "正位的魔術師代表主導權回到你手上。現在適合開口、提案、動手，把想法落地。",
    uprightEn: "Upright, The Magician returns agency to your hands. It is time to speak, propose, and turn intent into form.",
    reversedZh: "逆位的魔術師提醒你留意分心、話術或自我懷疑。能力還在，只是需要重新校準。",
    reversedEn: "Reversed, The Magician asks you to watch for distraction, empty persuasion, or self-doubt. The ability remains, but it needs recalibration.",
    keywordsZh: ["行動", "資源", "創造"],
    keywordsEn: ["action", "resources", "creation"],
  }),
  createCatalogEntry({
    id: "high-priestess",
    sigil: "II",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "女祭司",
    nameEn: "The High Priestess",
    toneZh: "表面看起來安靜，但真正的訊號其實一直都在，只是得先沉下來聽。",
    toneEn: "The surface may look still, but the real signal has been present all along if you become quiet enough to hear it.",
    uprightZh: "正位的女祭司要你先別急著下結論。真正重要的資訊，往往藏在直覺與細節裡。",
    uprightEn: "Upright, The High Priestess asks you not to rush the conclusion. The crucial information is often hidden in intuition and subtle detail.",
    reversedZh: "逆位的女祭司表示你可能把噪音當成答案。先停下來，分清楚焦慮和直覺不是同一件事。",
    reversedEn: "Reversed, The High Priestess suggests you may be mistaking noise for truth. Pause long enough to separate anxiety from intuition.",
    keywordsZh: ["直覺", "沉靜", "內在真相"],
    keywordsEn: ["intuition", "stillness", "inner truth"],
  }),
  createCatalogEntry({
    id: "the-empress",
    sigil: "III",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "皇后",
    nameEn: "The Empress",
    toneZh: "這張牌的主題不是追趕，而是培養。能量會在被好好照顧後自然擴張。",
    toneEn: "This card is less about chasing and more about tending. Energy expands when it is nourished well.",
    uprightZh: "正位的皇后帶來滋養、吸引與豐盛。先顧好你的身心，事情才會穩穩長出來。",
    uprightEn: "Upright, The Empress brings nurture, magnetism, and abundance. Care for yourself first so growth can happen steadily.",
    reversedZh: "逆位的皇后提醒你別把照顧別人當成逃避自己。失衡往往來自過度付出或過度耗損。",
    reversedEn: "Reversed, The Empress warns against caring for others as a way to abandon yourself. Imbalance often comes from overgiving and depletion.",
    keywordsZh: ["滋養", "豐盛", "落地"],
    keywordsEn: ["nurture", "abundance", "embodiment"],
  }),
  createCatalogEntry({
    id: "the-emperor",
    sigil: "IV",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "皇帝",
    nameEn: "The Emperor",
    toneZh: "現在要處理的不是感覺夠不夠，而是結構夠不夠穩。",
    toneEn: "The present question is not whether the feeling is strong enough but whether the structure is solid enough.",
    uprightZh: "正位的皇帝強調秩序、責任與掌控。把規則立起來，混亂自然會減少。",
    uprightEn: "Upright, The Emperor emphasizes order, responsibility, and stewardship. Put structure in place and chaos will shrink.",
    reversedZh: "逆位的皇帝提醒你留意僵硬、控制或權力失衡。真正的穩定不是壓制，而是清楚。",
    reversedEn: "Reversed, The Emperor points to rigidity, control, or an imbalance of power. True stability is not domination but clarity.",
    keywordsZh: ["秩序", "責任", "界線"],
    keywordsEn: ["order", "responsibility", "boundaries"],
  }),
  createCatalogEntry({
    id: "the-hierophant",
    sigil: "V",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "教皇",
    nameEn: "The Hierophant",
    toneZh: "這張牌會把注意力拉回規則、傳統與可傳承的方法。",
    toneEn: "This card returns your attention to structure, tradition, and methods that can be handed down or trusted.",
    uprightZh: "正位的教皇鼓勵你向成熟的方法靠近。問前人、守原則、照流程，反而會走得更穩。",
    uprightEn: "Upright, The Hierophant encourages you to lean on established wisdom. Seek guidance, honor principle, and follow what has proven stable.",
    reversedZh: "逆位的教皇表示你已經不適合再照舊規則走。不是否定傳統，而是要找出真正適合你的版本。",
    reversedEn: "Reversed, The Hierophant suggests old rules may no longer fit. It is not always rebellion, but a need to find the version that is truly yours.",
    keywordsZh: ["傳統", "信念", "學習"],
    keywordsEn: ["tradition", "belief", "learning"],
  }),
  createCatalogEntry({
    id: "the-lovers",
    sigil: "VI",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "戀人",
    nameEn: "The Lovers",
    toneZh: "眼前的選擇會直接照出你真正重視的是什麼。",
    toneEn: "The choice in front of you is revealing what you truly value.",
    uprightZh: "正位的戀人講的是一致與真心。當感受、價值與決定對齊，關係才會真正前進。",
    uprightEn: "Upright, The Lovers speaks of alignment and sincerity. When feeling, value, and decision agree, connection can move honestly.",
    reversedZh: "逆位的戀人顯示失衡、猶豫或關係裡的錯頻。現在不是沒有愛，而是沒有對齊。",
    reversedEn: "Reversed, The Lovers points to misalignment, hesitation, or crossed signals within a bond. The issue is not the absence of feeling but the absence of agreement.",
    keywordsZh: ["一致", "選擇", "連結"],
    keywordsEn: ["alignment", "choice", "bond"],
  }),
  createCatalogEntry({
    id: "the-chariot",
    sigil: "VII",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "戰車",
    nameEn: "The Chariot",
    toneZh: "前進不是靠情緒衝刺，而是靠方向感與意志整合。",
    toneEn: "Progress comes not from emotional speed but from directional focus and integrated will.",
    uprightZh: "正位的戰車表示你可以往前推進。只要你清楚自己要去哪裡，阻力就不再那麼可怕。",
    uprightEn: "Upright, The Chariot says you can move forward. Once the destination is clear, resistance loses much of its power.",
    reversedZh: "逆位的戰車提醒你留意失控、硬拚或方向分裂。速度不是勝利，先把內部拉齊。",
    reversedEn: "Reversed, The Chariot warns of loss of control, forcing, or split direction. Speed is not success; align the inner drivers first.",
    keywordsZh: ["推進", "意志", "掌舵"],
    keywordsEn: ["momentum", "will", "direction"],
  }),
  createCatalogEntry({
    id: "strength",
    sigil: "VIII",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "力量",
    nameEn: "Strength",
    toneZh: "真正的強不是壓住情緒，而是能溫柔地駕馭它。",
    toneEn: "Real strength is not the suppression of feeling but the gentle ability to guide it.",
    uprightZh: "正位的力量要你相信穩定的柔軟比逞強更有用。你不需要吼叫，也可以站得住。",
    uprightEn: "Upright, Strength reminds you that steady softness often outperforms force. You do not need aggression to remain powerful.",
    reversedZh: "逆位的力量指出內耗、自我否定或情緒被壓過頭。先回到身體，再談控制。",
    reversedEn: "Reversed, Strength points to inner depletion, self-doubt, or over-suppressed feeling. Return to the body before you talk about control.",
    keywordsZh: ["柔韌", "勇氣", "馴服"],
    keywordsEn: ["fortitude", "courage", "taming"],
  }),
  createCatalogEntry({
    id: "the-hermit",
    sigil: "IX",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "隱者",
    nameEn: "The Hermit",
    toneZh: "退一步不是逃避，而是把外界雜訊關小，讓真正的答案浮出來。",
    toneEn: "Stepping back is not escape but a way to turn down outside noise so the truer answer can emerge.",
    uprightZh: "正位的隱者建議你先獨處、整理、想清楚。不是現在不能動，而是先看清再動。",
    uprightEn: "Upright, The Hermit advises solitude, reflection, and inner sorting. Movement is possible, but clearer after honest contemplation.",
    reversedZh: "逆位的隱者表示你可能躲太久，或把思考變成拖延。答案需要被帶回現實。",
    reversedEn: "Reversed, The Hermit suggests you may be hiding too long or turning reflection into delay. Insight now needs to return to life.",
    keywordsZh: ["獨處", "清明", "尋路"],
    keywordsEn: ["solitude", "clarity", "seeking"],
  }),
  createCatalogEntry({
    id: "wheel-of-fortune",
    sigil: "X",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "命運之輪",
    nameEn: "Wheel of Fortune",
    toneZh: "局面正在轉動，重點不是抓住每一秒，而是辨認週期何時換檔。",
    toneEn: "The situation is already turning, and the real work is to recognize when the cycle changes gear.",
    uprightZh: "正位的命運之輪代表時機重新流動。當你順著節奏走，阻力會明顯變小。",
    uprightEn: "Upright, the Wheel of Fortune signals that timing is moving again. When you move with the rhythm, resistance softens.",
    reversedZh: "逆位的命運之輪顯示延滯、反覆或卡在舊循環。不是永遠不行，而是還沒到對的拍點。",
    reversedEn: "Reversed, the Wheel of Fortune points to delay, repetition, or being caught in an old cycle. It is not a permanent no, but the timing is not yet clean.",
    keywordsZh: ["時機", "循環", "轉變"],
    keywordsEn: ["timing", "cycle", "turning"],
  }),
  createCatalogEntry({
    id: "justice",
    sigil: "XI",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "正義",
    nameEn: "Justice",
    toneZh: "這張牌不討好情緒，它只在乎你是否願意面對事實。",
    toneEn: "This card does not flatter emotion. It cares whether you are willing to face what is true.",
    uprightZh: "正位的正義要求誠實、平衡與負責。先講清楚事實，才有真正公平的下一步。",
    uprightEn: "Upright, Justice asks for honesty, balance, and accountability. Name the facts clearly before deciding what fairness looks like.",
    reversedZh: "逆位的正義提醒你留意偏見、逃避或不願承擔後果。失衡通常不是意外，而是選擇。",
    reversedEn: "Reversed, Justice warns of bias, avoidance, or a refusal to own consequences. Imbalance is often not an accident but a choice.",
    keywordsZh: ["真相", "平衡", "判斷"],
    keywordsEn: ["truth", "balance", "discernment"],
  }),
  createCatalogEntry({
    id: "the-hanged-man",
    sigil: "XII",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "吊人",
    nameEn: "The Hanged Man",
    toneZh: "現在真正的功課不是立刻突破，而是願不願意換一個角度看。",
    toneEn: "The task is not immediate breakthrough but a willingness to see the situation from another angle.",
    uprightZh: "正位的吊人表示暫停是必要的。你不是落後，而是在等待新的理解成熟。",
    uprightEn: "Upright, The Hanged Man says the pause is necessary. You are not behind; you are allowing a new understanding to mature.",
    reversedZh: "逆位的吊人代表僵住、拖延，或明知該放手卻還死抓不放。停太久就不再叫等待。",
    reversedEn: "Reversed, The Hanged Man can mean stagnation, delay, or clinging to what should already be released. A pause eventually stops being wisdom.",
    keywordsZh: ["停頓", "換位", "放下"],
    keywordsEn: ["pause", "perspective", "release"],
  }),
  createCatalogEntry({
    id: "death",
    sigil: "XIII",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "死神",
    nameEn: "Death",
    toneZh: "這張牌真正關心的不是失去，而是舊結構已經無法再陪你往前。",
    toneEn: "This card is less about loss than about an old structure no longer being able to travel with you.",
    uprightZh: "正位的死神代表結束、剝落與轉化。真正的更新，往往是從停止硬撐開始。",
    uprightEn: "Upright, Death marks ending, shedding, and transformation. Real renewal often begins the moment you stop forcing what has already ended.",
    reversedZh: "逆位的死神表示你抗拒必要改變。放不下舊版本，就會拖長新階段的到來。",
    reversedEn: "Reversed, Death suggests resistance to a necessary change. Holding the old version too tightly only delays the new chapter.",
    keywordsZh: ["結束", "轉化", "蛻皮"],
    keywordsEn: ["ending", "transformation", "shedding"],
  }),
  createCatalogEntry({
    id: "temperance",
    sigil: "XIV",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "節制",
    nameEn: "Temperance",
    toneZh: "答案不在極端，而在於你能不能讓不同部分慢慢調成同一個節奏。",
    toneEn: "The answer is not found in extremes but in whether you can bring different parts into the same rhythm.",
    uprightZh: "正位的節制強調節奏、調和與穩定整合。慢一點反而更快抵達正確位置。",
    uprightEn: "Upright, Temperance emphasizes pacing, harmony, and integration. Slower movement may actually bring you where you need to go faster.",
    reversedZh: "逆位的節制顯示過度、急躁或失衡。現在最不需要的，就是再多一點用力。",
    reversedEn: "Reversed, Temperance points to excess, impatience, or imbalance. The last thing required now is more force.",
    keywordsZh: ["節奏", "調和", "整合"],
    keywordsEn: ["balance", "pace", "integration"],
  }),
  createCatalogEntry({
    id: "the-devil",
    sigil: "XV",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "惡魔",
    nameEn: "The Devil",
    toneZh: "眼前的綑綁未必全是外在，很多時候是你已經習慣某種消耗。",
    toneEn: "The bondage in front of you is not always external. Often it is a pattern of depletion that has become familiar.",
    uprightZh: "正位的惡魔指出慾望、依附、沉迷與無法抽身的模式。先看清楚，你才可能鬆開它。",
    uprightEn: "Upright, The Devil reveals attachment, compulsion, and patterns that keep you locked in place. Clarity is the first step toward release.",
    reversedZh: "逆位的惡魔表示你正在鬆綁，或終於看見自己在哪裡把權力交出去。出口已經出現。",
    reversedEn: "Reversed, The Devil suggests a loosening grip or a new awareness of where you have handed away your power. The exit is visible now.",
    keywordsZh: ["綑綁", "慾望", "解套"],
    keywordsEn: ["bondage", "desire", "release"],
  }),
  createCatalogEntry({
    id: "the-tower",
    sigil: "XVI",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "高塔",
    nameEn: "The Tower",
    toneZh: "有些東西不是慢慢失效，而是突然撐不住。這張牌要你正視裂痕。",
    toneEn: "Some structures do not fade gently; they collapse once they can no longer hold. This card asks you to face the fracture directly.",
    uprightZh: "正位的高塔代表突發、破局與真相撞進來。雖然震動很大，但假的東西終究會掉下去。",
    uprightEn: "Upright, The Tower signals rupture, revelation, and the shock of truth entering the room. What is false cannot stay standing forever.",
    reversedZh: "逆位的高塔表示你已經察覺問題，卻還想拖延拆解。該倒的若不主動放下，之後只會更痛。",
    reversedEn: "Reversed, The Tower suggests you already sense the break but are delaying the dismantling. What must fall becomes harsher when resisted.",
    keywordsZh: ["破局", "覺醒", "震盪"],
    keywordsEn: ["rupture", "awakening", "shock"],
  }),
  createCatalogEntry({
    id: "the-star",
    sigil: "XVII",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "星星",
    nameEn: "The Star",
    toneZh: "當你不再硬撐，療癒和希望就會慢慢重新流回來。",
    toneEn: "When you stop bracing against life, healing and hope can begin flowing back in.",
    uprightZh: "正位的星星代表修復、信任與清澈。你可以一邊誠實面對現況，一邊仍然保留希望。",
    uprightEn: "Upright, The Star brings restoration, trust, and clear renewal. You can face the present honestly without abandoning hope.",
    reversedZh: "逆位的星星表示你現在很難相信事情會變好。希望沒有消失，只是被疲憊遮住了。",
    reversedEn: "Reversed, The Star suggests you may struggle to believe things can improve. Hope has not vanished; fatigue is simply covering it.",
    keywordsZh: ["療癒", "希望", "清澈"],
    keywordsEn: ["healing", "hope", "clarity"],
  }),
  createCatalogEntry({
    id: "the-moon",
    sigil: "XVIII",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "月亮",
    nameEn: "The Moon",
    toneZh: "局面還在迷霧裡，不清楚不等於危險，但確實不適合過早定論。",
    toneEn: "The path is still in mist. Uncertainty does not equal danger, but it does mean conclusions should not be rushed.",
    uprightZh: "正位的月亮提醒你允許模糊存在。直覺很重要，但投射與恐懼也需要被分辨。",
    uprightEn: "Upright, The Moon asks you to allow ambiguity to exist. Intuition matters here, but so does separating it from projection and fear.",
    reversedZh: "逆位的月亮表示某些混亂正在散去，或你終於看見自己先前忽略的情緒真相。",
    reversedEn: "Reversed, The Moon suggests the fog is thinning or that an emotional truth you avoided is becoming visible.",
    keywordsZh: ["迷霧", "情緒", "潛意識"],
    keywordsEn: ["mystery", "emotion", "subconscious"],
  }),
  createCatalogEntry({
    id: "the-sun",
    sigil: "XIX",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "太陽",
    nameEn: "The Sun",
    toneZh: "事情終於有機會被照亮，真正的重點是你敢不敢站進光裡。",
    toneEn: "The situation is ready to be illuminated, and the real question is whether you are willing to stand in the light of it.",
    uprightZh: "正位的太陽帶來明朗、喜悅與可見成果。當你不再自我遮掩，事情就會順很多。",
    uprightEn: "Upright, The Sun brings clarity, joy, and visible progress. Once you stop dimming yourself, the path opens more easily.",
    reversedZh: "逆位的太陽表示光其實已經在了，只是你還沒完全相信好消息可以落在自己身上。",
    reversedEn: "Reversed, The Sun suggests the light is already present, but you may not fully trust that the good news is meant for you too.",
    keywordsZh: ["明朗", "喜悅", "生命力"],
    keywordsEn: ["clarity", "joy", "vitality"],
  }),
  createCatalogEntry({
    id: "judgement",
    sigil: "XX",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "審判",
    nameEn: "Judgement",
    toneZh: "有些問題已經來到不能再逃的階段，你要回應自己的召喚。",
    toneEn: "Some matters have reached the point where they can no longer be avoided. You are being asked to answer your own calling.",
    uprightZh: "正位的審判代表甦醒、總結與做出清楚回應。現在是把過去整合成新選擇的時候。",
    uprightEn: "Upright, Judgement marks awakening, reckoning, and clear response. It is time to turn the past into a more conscious choice.",
    reversedZh: "逆位的審判表示你仍在拖延真正的答案。不是還沒準備好，而是你不想面對它。",
    reversedEn: "Reversed, Judgement suggests you are delaying the answer you already know. The issue is often not readiness but avoidance.",
    keywordsZh: ["甦醒", "回應", "總結"],
    keywordsEn: ["awakening", "response", "reckoning"],
  }),
  createCatalogEntry({
    id: "the-world",
    sigil: "XXI",
    arcanaZh: "大阿爾克那",
    arcanaEn: "Major Arcana",
    nameZh: "世界",
    nameEn: "The World",
    toneZh: "一個完整循環已經接近收束，你比自己想像得更接近完成。",
    toneEn: "A full cycle is nearing completion, and you are closer to wholeness than you may realize.",
    uprightZh: "正位的世界象徵完成、整合與抵達。你做的事開始串成完整圖像，現在可以收尾也可以升級。",
    uprightEn: "Upright, The World symbolizes completion, integration, and arrival. What you have been building is cohering into a whole.",
    reversedZh: "逆位的世界表示只差最後一步卻遲遲沒結案。不是不行，而是還有一個環節需要對齊。",
    reversedEn: "Reversed, The World suggests you are close to completion but not quite closed. One remaining piece still needs alignment.",
    keywordsZh: ["完成", "整合", "圓滿"],
    keywordsEn: ["completion", "integration", "wholeness"],
  }),
];

const minorSuitProfiles = {
  wands: {
    nameZh: "權杖",
    nameEn: "Wands",
    themeZh: "行動、火花、野心與生命推力",
    themeEn: "action, spark, ambition, and life-force",
    uprightChannelZh: "行動力與企圖",
    uprightChannelEn: "action and initiative",
    reversedChannelZh: "急躁、躁進或能量失焦",
    reversedChannelEn: "rashness, impatience, or scattered drive",
    keywordsZh: ["行動", "火花", "推進"],
    keywordsEn: ["action", "spark", "momentum"],
  },
  cups: {
    nameZh: "聖杯",
    nameEn: "Cups",
    themeZh: "情感、親密、感受與心的流動",
    themeEn: "emotion, intimacy, feeling, and the movement of the heart",
    uprightChannelZh: "感受與關係連結",
    uprightChannelEn: "feeling and relational flow",
    reversedChannelZh: "情緒失衡、逃避或感受堵塞",
    reversedChannelEn: "emotional imbalance, avoidance, or blocked feeling",
    keywordsZh: ["情感", "連結", "感受"],
    keywordsEn: ["emotion", "connection", "feeling"],
  },
  swords: {
    nameZh: "寶劍",
    nameEn: "Swords",
    themeZh: "思考、真相、衝突與切割能力",
    themeEn: "thought, truth, conflict, and the power to cut through",
    uprightChannelZh: "判斷與清楚表達",
    uprightChannelEn: "discernment and clear communication",
    reversedChannelZh: "焦慮、誤判或語言帶來的傷害",
    reversedChannelEn: "anxiety, misjudgment, or harm through words",
    keywordsZh: ["真相", "思辨", "判斷"],
    keywordsEn: ["truth", "thought", "discernment"],
  },
  pentacles: {
    nameZh: "錢幣",
    nameEn: "Pentacles",
    themeZh: "資源、工作、身體與現實落地",
    themeEn: "resources, work, the body, and material grounding",
    uprightChannelZh: "現實經營與穩定累積",
    uprightChannelEn: "practical building and steady accumulation",
    reversedChannelZh: "失衡消耗、鬆散管理或物質焦慮",
    reversedChannelEn: "waste, loose management, or material anxiety",
    keywordsZh: ["資源", "落地", "穩定"],
    keywordsEn: ["resources", "grounding", "stability"],
  },
} as const satisfies Record<
  MinorSuitId,
  {
    nameZh: string;
    nameEn: string;
    themeZh: string;
    themeEn: string;
    uprightChannelZh: string;
    uprightChannelEn: string;
    reversedChannelZh: string;
    reversedChannelEn: string;
    keywordsZh: [string, string, string];
    keywordsEn: [string, string, string];
  }
>;

const minorRankProfiles = {
  ace: {
    nameZh: "王牌",
    nameEn: "Ace",
    sigil: "A",
    focusZh: "新開端",
    focusEn: "new beginnings",
    uprightZh: "這張牌把第一束能量送到你面前",
    uprightEn: "This card places the first wave of energy directly in front of you",
    reversedZh: "開始的機會還在，但暫時被遲疑卡住",
    reversedEn: "The beginning still exists, but hesitation is clogging the opening",
    keywordsZh: ["開端", "種子", "啟動"],
    keywordsEn: ["beginning", "seed", "initiation"],
  },
  two: {
    nameZh: "二",
    nameEn: "Two",
    sigil: "2",
    focusZh: "對位與選擇",
    focusEn: "balance and choice",
    uprightZh: "兩股力量正在彼此校準",
    uprightEn: "Two forces are calibrating against each other",
    reversedZh: "失衡感正在提醒你重新分配注意力",
    reversedEn: "Imbalance is asking you to redistribute your attention",
    keywordsZh: ["平衡", "搭配", "抉擇"],
    keywordsEn: ["balance", "pairing", "choice"],
  },
  three: {
    nameZh: "三",
    nameEn: "Three",
    sigil: "3",
    focusZh: "擴張與合作",
    focusEn: "expansion and collaboration",
    uprightZh: "事情開始長出外部回應",
    uprightEn: "The situation is starting to generate an external response",
    reversedZh: "合作面卡住時，成果也會跟著放慢",
    reversedEn: "When collaboration is blocked, the outcome slows with it",
    keywordsZh: ["成形", "合作", "擴展"],
    keywordsEn: ["formation", "collaboration", "growth"],
  },
  four: {
    nameZh: "四",
    nameEn: "Four",
    sigil: "4",
    focusZh: "穩定與打底",
    focusEn: "stability and foundation",
    uprightZh: "現在適合把根基墊穩",
    uprightEn: "This is the moment to strengthen the foundation",
    reversedZh: "如果根基鬆動，表面的平靜不會撐太久",
    reversedEn: "If the foundation is loose, surface calm will not hold for long",
    keywordsZh: ["穩定", "基礎", "停看"],
    keywordsEn: ["stability", "foundation", "pause"],
  },
  five: {
    nameZh: "五",
    nameEn: "Five",
    sigil: "5",
    focusZh: "拉扯與磨擦",
    focusEn: "friction and strain",
    uprightZh: "衝突正在逼你看見真正的問題",
    uprightEn: "Conflict is pushing the real issue into view",
    reversedZh: "如果你只顧著防衛，就很難看清真正的缺口",
    reversedEn: "If you stay busy defending yourself, the real gap stays hidden",
    keywordsZh: ["衝突", "壓力", "調整"],
    keywordsEn: ["conflict", "pressure", "adjustment"],
  },
  six: {
    nameZh: "六",
    nameEn: "Six",
    sigil: "6",
    focusZh: "過渡與支持",
    focusEn: "transition and support",
    uprightZh: "局面正在往較平順的地方移動",
    uprightEn: "The situation is moving toward a steadier place",
    reversedZh: "你可能還拖著舊包袱，所以過渡不夠乾淨",
    reversedEn: "The transition stays messy when old baggage is still being dragged along",
    keywordsZh: ["過渡", "支持", "移動"],
    keywordsEn: ["transition", "support", "movement"],
  },
  seven: {
    nameZh: "七",
    nameEn: "Seven",
    sigil: "7",
    focusZh: "檢驗與立場",
    focusEn: "testing and position",
    uprightZh: "真正的問題來到考驗你站穩沒有",
    uprightEn: "The real question is whether your stance can hold under pressure",
    reversedZh: "當你懷疑自己時，局勢就更容易被動搖",
    reversedEn: "When you doubt yourself, the situation becomes easier to shake",
    keywordsZh: ["考驗", "立場", "辨位"],
    keywordsEn: ["testing", "position", "evaluation"],
  },
  eight: {
    nameZh: "八",
    nameEn: "Eight",
    sigil: "8",
    focusZh: "加速與專注",
    focusEn: "momentum and focus",
    uprightZh: "能量正在快速往前推",
    uprightEn: "Energy is gaining speed and moving forward",
    reversedZh: "散亂的節奏會讓原本的推進變得卡頓",
    reversedEn: "Scattered pacing turns natural momentum into drag",
    keywordsZh: ["速度", "專注", "推進"],
    keywordsEn: ["speed", "focus", "progress"],
  },
  nine: {
    nameZh: "九",
    nameEn: "Nine",
    sigil: "9",
    focusZh: "臨門與韌性",
    focusEn: "resilience and near-completion",
    uprightZh: "事情已經很接近結果，只差最後一口氣",
    uprightEn: "The outcome is close; you are dealing with the final stretch",
    reversedZh: "疲憊正在放大不安，讓你誤以為還很遠",
    reversedEn: "Fatigue is magnifying fear and making the destination feel farther away than it is",
    keywordsZh: ["韌性", "守住", "收尾"],
    keywordsEn: ["resilience", "holding", "finishing"],
  },
  ten: {
    nameZh: "十",
    nameEn: "Ten",
    sigil: "10",
    focusZh: "總結與負荷",
    focusEn: "culmination and burden",
    uprightZh: "這張牌帶出一個階段的飽和點",
    uprightEn: "This card highlights the saturation point of a cycle",
    reversedZh: "負擔過重時，完成也會變成壓垮自己的方式",
    reversedEn: "When the burden is too heavy, even completion can become a form of collapse",
    keywordsZh: ["完成", "負荷", "極限"],
    keywordsEn: ["completion", "burden", "limit"],
  },
  page: {
    nameZh: "侍者",
    nameEn: "Page",
    sigil: "Pg",
    focusZh: "訊息與學習",
    focusEn: "messages and learning",
    uprightZh: "新的消息、靈感或提問正在敲門",
    uprightEn: "A new message, spark, or question is arriving",
    reversedZh: "好奇心還在，但方向可能有些鬆散或幼嫩",
    reversedEn: "Curiosity remains, but the direction may still be loose or immature",
    keywordsZh: ["訊息", "好奇", "起學"],
    keywordsEn: ["message", "curiosity", "study"],
  },
  knight: {
    nameZh: "騎士",
    nameEn: "Knight",
    sigil: "Kn",
    focusZh: "追擊與推進",
    focusEn: "pursuit and propulsion",
    uprightZh: "這股力量想直接朝目標衝去",
    uprightEn: "This force wants to ride straight toward the objective",
    reversedZh: "太急、太猛，反而容易偏離本來要去的地方",
    reversedEn: "Too much speed or force can send the motion off course",
    keywordsZh: ["追擊", "速度", "任務"],
    keywordsEn: ["pursuit", "speed", "mission"],
  },
  queen: {
    nameZh: "皇后",
    nameEn: "Queen",
    sigil: "Q",
    focusZh: "成熟與內在掌握",
    focusEn: "maturity and inner mastery",
    uprightZh: "這張牌把能量帶到成熟而穩定的層次",
    uprightEn: "This card carries the energy into a mature and steady expression",
    reversedZh: "失衡通常不是能力不足，而是內部狀態沒有被照顧",
    reversedEn: "The imbalance is usually not a lack of ability but a lack of inner care",
    keywordsZh: ["成熟", "承載", "穩定"],
    keywordsEn: ["maturity", "containment", "stability"],
  },
  king: {
    nameZh: "國王",
    nameEn: "King",
    sigil: "K",
    focusZh: "掌舵與權威",
    focusEn: "authority and leadership",
    uprightZh: "這張牌要求你從更高的位置做判斷",
    uprightEn: "This card asks you to make decisions from a steadier seat of authority",
    reversedZh: "權威感一旦變成控制欲，局面就會開始反咬",
    reversedEn: "Once authority tips into control, the situation starts pushing back",
    keywordsZh: ["掌舵", "權威", "決策"],
    keywordsEn: ["leadership", "authority", "decision"],
  },
} as const satisfies Record<
  MinorRankId,
  {
    nameZh: string;
    nameEn: string;
    sigil: string;
    focusZh: string;
    focusEn: string;
    uprightZh: string;
    uprightEn: string;
    reversedZh: string;
    reversedEn: string;
    keywordsZh: [string, string, string];
    keywordsEn: [string, string, string];
  }
>;

const minorRankOrder: MinorRankId[] = [
  "ace",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "page",
  "knight",
  "queen",
  "king",
];

const minorSuitOrder: MinorSuitId[] = [
  "wands",
  "cups",
  "swords",
  "pentacles",
];

function createMinorArcanaCard(
  suitId: MinorSuitId,
  rankId: MinorRankId,
): TarotCardCatalogEntry {
  const suit = minorSuitProfiles[suitId];
  const rank = minorRankProfiles[rankId];
  const cardId = `${rankId}-of-${suitId}`;

  return createCatalogEntry({
    id: cardId,
    sigil: rank.sigil,
    arcanaZh: "小阿爾克那",
    arcanaEn: "Minor Arcana",
    nameZh: `${suit.nameZh}${rank.nameZh}`,
    nameEn: `${rank.nameEn} of ${suit.nameEn}`,
    toneZh: `${suit.themeZh}遇上${rank.focusZh}，這張牌把重點放在「${rank.keywordsZh[0]}」與「${suit.keywordsZh[0]}」怎麼同時成立。`,
    toneEn: `This card brings ${suit.themeEn} into ${rank.focusEn}, centering the reading on how ${rank.keywordsEn[0]} meets ${suit.keywordsEn[0]}.`,
    uprightZh: `${rank.uprightZh}，讓${suit.uprightChannelZh}沿著${rank.focusZh}自然展開。`,
    uprightEn: `${rank.uprightEn}, allowing ${suit.uprightChannelEn} to unfold through ${rank.focusEn}.`,
    reversedZh: `${rank.reversedZh}，別讓${suit.reversedChannelZh}蓋過${rank.focusZh}真正要說的事。`,
    reversedEn: `${rank.reversedEn}, and do not let ${suit.reversedChannelEn} drown out what ${rank.focusEn} is actually asking for.`,
    keywordsZh: [
      rank.keywordsZh[0],
      suit.keywordsZh[0],
      rank.keywordsZh[1],
    ],
    keywordsEn: [
      rank.keywordsEn[0],
      suit.keywordsEn[0],
      rank.keywordsEn[1],
    ],
  });
}

const tarotCardCatalog: TarotCardCatalogEntry[] = [
  ...majorArcanaCatalog,
  ...minorSuitOrder.flatMap((suitId: MinorSuitId) =>
    minorRankOrder.map((rankId: MinorRankId) =>
      createMinorArcanaCard(suitId, rankId),
    ),
  ),
];

const cardDisplayMeta = Object.fromEntries(
  tarotCardCatalog.map((card: TarotCardCatalogEntry) => [
    card.id,
    {
      nameZh: card.nameZh,
      nameEn: card.nameEn,
      arcanaZh: card.arcanaZh,
      arcanaEn: card.arcanaEn,
      toneZh: card.toneZh,
      toneEn: card.toneEn,
      uprightZh: card.uprightZh,
      uprightEn: card.uprightEn,
      reversedZh: card.reversedZh,
      reversedEn: card.reversedEn,
      keywordsZh: card.keywordsZh,
      keywordsEn: card.keywordsEn,
    },
  ]),
) as Record<string, TarotCardDisplayMeta>;

export const tarotDeck: TarotCard[] = tarotCardCatalog.map(
  (card: TarotCardCatalogEntry) => ({
    id: card.id,
    name: card.nameEn,
    sigil: card.sigil,
    arcana: card.arcana,
    tone: card.tone,
    uprightText: card.uprightText,
    reversedText: card.reversedText,
    keywords: card.keywords,
  }),
);

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
  const mapped = getTarotSpreadRoleDefinition(role);

  if (mapped) {
    return {
      labelZh: mapped.labelZh,
      labelEn: mapped.labelEn,
      subtitleZh: mapped.subtitleZh,
      subtitleEn: mapped.subtitleEn,
    };
  }

  return {
    labelZh: role,
    labelEn: role,
    subtitleZh: role,
    subtitleEn: role,
  };
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
  const mapped = cardDisplayMeta[cardId];

  if (mapped) {
    return mapped;
  }

  const fallbackCard = tarotDeck.find((card) => card.id === cardId);
  const fallbackKeywords = fallbackCard?.keywords ?? [
    "focus",
    "pattern",
    "movement",
  ];
  const isMinorArcana = fallbackCard?.arcana === "Minor Arcana";

  return {
    nameZh: fallbackCard?.name ?? "未知牌卡",
    nameEn: fallbackCard?.name ?? "Unknown Card",
    arcanaZh: isMinorArcana ? "小阿爾克那" : "大阿爾克那",
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

function createSeededRandom(seed: number) {
  let value = (Math.abs(Math.trunc(seed)) || 1) >>> 0;

  return function next() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSpread(seed: number) {
  const random = createSeededRandom(seed);
  const shuffled = tarotDeck.slice();

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return shuffled.slice(0, 9);
}

export function buildSelectedCard(
  card: TarotCard,
  slot: number,
): SelectedTarotCard {
  const roleMeta = cardRoles[slot] ?? cardRoles[cardRoles.length - 1];
  const orientationSeed = `${card.id}:${slot}`
    .split("")
    .reduce((total: number, character: string, index: number) => {
      return total + character.charCodeAt(0) * (index + 3);
    }, 0);
  const orientation: TarotOrientation =
    orientationSeed % 2 === 0 ? "upright" : "reversed";

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

  return sectionBlueprints.map(
    (section: (typeof sectionBlueprints)[number], index: number) => {
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
    },
  );
}
