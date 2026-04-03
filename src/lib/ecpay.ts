import crypto from "node:crypto";

type EcpayStage = "test" | "production";

export type EcpayCheckoutFields = Record<string, string>;

const TEST_CHECKOUT_URL =
  "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";
const PRODUCTION_CHECKOUT_URL =
  "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5";

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name}_MISSING`);
  }

  return value;
}

function getEcpayStage(): EcpayStage {
  const value = process.env.ECPAY_ENV?.trim().toLowerCase();

  return value === "production" ? "production" : "test";
}

function getAppTimezone() {
  return process.env.APP_TIMEZONE?.trim() || "Asia/Taipei";
}

function formatByParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: getAppTimezone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const byType = new Map(parts.map((part) => [part.type, part.value]));

  return {
    year: byType.get("year") ?? "0000",
    month: byType.get("month") ?? "01",
    day: byType.get("day") ?? "01",
    hour: byType.get("hour") ?? "00",
    minute: byType.get("minute") ?? "00",
    second: byType.get("second") ?? "00",
  };
}

function normalizeCheckMacValueSource(value: string) {
  return encodeURIComponent(value)
    .toLowerCase()
    .replace(/%20/g, "+")
    .replace(/%2d/g, "-")
    .replace(/%5f/g, "_")
    .replace(/%2e/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2a/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")");
}

function createCheckMacValue(fields: Record<string, string>) {
  const hashKey = getRequiredEnv("ECPAY_HASH_KEY");
  const hashIv = getRequiredEnv("ECPAY_HASH_IV");
  const sortedEntries = Object.entries(fields)
    .filter(([key]) => key !== "CheckMacValue")
    .sort(([left], [right]) =>
      left.localeCompare(right, "en", { sensitivity: "base" }),
    );
  const raw = [
    `HashKey=${hashKey}`,
    ...sortedEntries.map(([key, value]) => `${key}=${value}`),
    `HashIV=${hashIv}`,
  ].join("&");
  const normalized = normalizeCheckMacValueSource(raw);

  return crypto
    .createHash("sha256")
    .update(normalized)
    .digest("hex")
    .toUpperCase();
}

export function isEcpayConfigured() {
  return Boolean(
    process.env.ECPAY_MERCHANT_ID?.trim() &&
      process.env.ECPAY_HASH_KEY?.trim() &&
      process.env.ECPAY_HASH_IV?.trim(),
  );
}

export function getEcpayCheckoutUrl() {
  return getEcpayStage() === "production"
    ? PRODUCTION_CHECKOUT_URL
    : TEST_CHECKOUT_URL;
}

export function getEcpayProviderLabel(provider: string | null | undefined) {
  if (provider === "ecpay") {
    return "ECPay / Green World";
  }

  if (provider === "stripe_checkout") {
    return "Stripe Checkout";
  }

  return "Third-party payment";
}

export function formatEcpayTradeDate(date: Date) {
  const parts = formatByParts(date);

  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

export function createEcpayMerchantTradeNo(date = new Date()) {
  const parts = formatByParts(date);
  const timestamp = `${parts.year.slice(2)}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
  const random = Math.random()
    .toString(36)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6)
    .padEnd(6, "0");

  return `TM${timestamp}${random}`.slice(0, 20);
}

export function toEcpayTotalAmount(amountMinor: number, currency: string) {
  if (currency.trim().toLowerCase() !== "twd") {
    throw new Error("ECPAY_UNSUPPORTED_CURRENCY");
  }

  if (amountMinor % 100 !== 0) {
    throw new Error("ECPAY_AMOUNT_INVALID");
  }

  return Math.floor(amountMinor / 100);
}

export function buildEcpayCheckoutFields(args: {
  merchantTradeNo: string;
  merchantTradeDate: Date;
  totalAmount: number;
  tradeDesc: string;
  itemName: string;
  returnUrl: string;
  orderResultUrl: string;
  clientBackUrl: string;
}) {
  const fields: EcpayCheckoutFields = {
    MerchantID: getRequiredEnv("ECPAY_MERCHANT_ID"),
    MerchantTradeNo: args.merchantTradeNo,
    MerchantTradeDate: formatEcpayTradeDate(args.merchantTradeDate),
    PaymentType: "aio",
    TotalAmount: String(args.totalAmount),
    TradeDesc: args.tradeDesc,
    ItemName: args.itemName,
    ReturnURL: args.returnUrl,
    OrderResultURL: args.orderResultUrl,
    ClientBackURL: args.clientBackUrl,
    ChoosePayment: "Credit",
    EncryptType: "1",
    NeedExtraPaidInfo: "N",
  };

  return {
    action: getEcpayCheckoutUrl(),
    fields: {
      ...fields,
      CheckMacValue: createCheckMacValue(fields),
    },
  };
}

export function verifyEcpayCheckMacValue(payload: Record<string, string>) {
  const received = payload.CheckMacValue?.trim().toUpperCase();

  if (!received) {
    return false;
  }

  const expected = createCheckMacValue(payload);

  return expected === received;
}
