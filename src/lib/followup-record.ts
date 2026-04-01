export type FollowupRecordStatus =
  | "idle"
  | "needs_points"
  | "generating"
  | "ready"
  | "failed";
export type FollowupSource = "minimax";

export type FollowupRecord = {
  id: string;
  readingRecordId: string;
  userId: string;
  prompt: string;
  answer: string | null;
  status: Exclude<FollowupRecordStatus, "idle">;
  source: FollowupSource;
  model: string;
  requestKey: string;
  chargeTransactionId: string | null;
  costPoints: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export const defaultFollowupStatus: FollowupRecordStatus = "idle";
export const followupFailureMessage =
  "The thread did not settle into words just yet. Give it another calm try.";
export const followupNeedsReadingMessage =
  "The follow-up can open once the main reading is fully ready.";
export const followupNeedsPointsMessage =
  "You are one step away from this next answer. Restore points first, then return here and continue the thread.";
export const followupUnavailableMessage =
  "The follow-up service is not available in this environment yet.";

type FollowupRecordInput = {
  id: string;
  readingRecordId: string;
  userId: string;
  prompt: string;
  answer: string | null;
  status: string;
  model: string;
  requestKey: string;
  chargeTransactionId: string | null;
  costPoints: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function mapRecordToFollowupRecord(
  record: FollowupRecordInput,
): FollowupRecord {
  return {
    id: record.id,
    readingRecordId: record.readingRecordId,
    userId: record.userId,
    prompt: record.prompt,
    answer: record.answer ?? null,
    status:
      record.status === "needs_points" ||
      record.status === "generating" ||
      record.status === "ready" ||
      record.status === "failed"
        ? record.status
        : "failed",
    source: "minimax",
    model: record.model,
    requestKey: record.requestKey,
    chargeTransactionId: record.chargeTransactionId ?? null,
    costPoints: record.costPoints,
    errorMessage: record.errorMessage ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function isFollowupRecordStale(record: FollowupRecord, maxAgeMs = 90_000) {
  if (record.status !== "generating") {
    return false;
  }

  return Date.now() - new Date(record.updatedAt).getTime() > maxAgeMs;
}
