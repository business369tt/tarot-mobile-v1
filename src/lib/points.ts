export type PointPackage = {
  id: string;
  points: number;
  label: string;
  caption: string;
  amountMinor: number;
  currency: string;
  priceLabel: string;
};

export type PointsIntent = "reading" | "followup";

export type MaybePointsIntent = PointsIntent | null;

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeCurrency(value: string | undefined, fallback: string) {
  const normalized = value?.trim().toLowerCase();

  return normalized ? normalized : fallback;
}

function isZeroDecimalCurrency(currency: string) {
  return new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]).has(
    currency.toLowerCase(),
  );
}

export function formatCurrencyMinor(amountMinor: number, currency: string) {
  const divisor = isZeroDecimalCurrency(currency) ? 1 : 100;

  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: divisor === 1 ? 0 : 2,
  }).format(amountMinor / divisor);
}

export const readingCostPoints = parsePositiveInt(
  process.env.READING_COST_POINTS,
  3,
);

export const followupCostPoints = parsePositiveInt(
  process.env.FOLLOWUP_COST_POINTS,
  2,
);

export const dailyCheckInPoints = parsePositiveInt(
  process.env.DAILY_CHECKIN_POINTS,
  1,
);

export const pointsPaymentCurrency = normalizeCurrency(
  process.env.POINTS_PAYMENT_CURRENCY,
  "twd",
);

export const pointPackages: PointPackage[] = [
  {
    id: "reading-topup",
    points: parsePositiveInt(process.env.POINTS_PACKAGE_PRIMARY, 5),
    label: "解讀補點 / Reading refill",
    caption: "足夠完成這份報告，並替下一次回來多留一點空間。",
    amountMinor: parsePositiveInt(
      process.env.POINTS_PACKAGE_PRIMARY_AMOUNT_MINOR,
      19000,
    ),
    currency: pointsPaymentCurrency,
    priceLabel: formatCurrencyMinor(
      parsePositiveInt(process.env.POINTS_PACKAGE_PRIMARY_AMOUNT_MINOR, 19000),
      pointsPaymentCurrency,
    ),
  },
  {
    id: "extended-topup",
    points: parsePositiveInt(process.env.POINTS_PACKAGE_SECONDARY, 12),
    label: "安靜儲備 / Quiet reserve",
    caption: "替這次解讀與接下來幾次 session 保留更穩定的點數餘額。",
    amountMinor: parsePositiveInt(
      process.env.POINTS_PACKAGE_SECONDARY_AMOUNT_MINOR,
      39000,
    ),
    currency: pointsPaymentCurrency,
    priceLabel: formatCurrencyMinor(
      parsePositiveInt(process.env.POINTS_PACKAGE_SECONDARY_AMOUNT_MINOR, 39000),
      pointsPaymentCurrency,
    ),
  },
];

export function getPointPackage(packageId: string | null | undefined) {
  return (
    pointPackages.find((item: PointPackage) => item.id === packageId) ??
    pointPackages[0]
  );
}

export function getPointsIntent(
  value: string | string[] | undefined,
): MaybePointsIntent {
  if (value === "reading" || value === "followup") {
    return value;
  }

  return null;
}

export function getPointsReturnTo(
  value: string | string[] | undefined,
  intent: MaybePointsIntent,
) {
  if (typeof value !== "string") {
    return intent ? "/reading" : "/";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return intent ? "/reading" : "/";
  }

  return value;
}

export function buildReadingPointsHref() {
  return buildPointsHref({
    intent: "reading",
    returnTo: "/reading",
  });
}

export function buildFollowupPointsHref() {
  return buildPointsHref({
    intent: "followup",
    returnTo: "/reading",
  });
}

export function buildPointsHref(args: {
  intent: PointsIntent;
  returnTo: string;
}) {
  const searchParams = new URLSearchParams({
    intent: args.intent,
    returnTo: args.returnTo,
  });

  return `/points?${searchParams.toString()}`;
}
