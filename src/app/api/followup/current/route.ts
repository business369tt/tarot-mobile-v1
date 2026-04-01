import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  followupFailureMessage,
  followupNeedsPointsMessage,
  followupNeedsReadingMessage,
  followupUnavailableMessage,
  isFollowupRecordStale,
  mapRecordToFollowupRecord,
} from "@/lib/followup-record";
import {
  generateTarotFollowupWithMiniMax,
  getMiniMaxReadingModel,
} from "@/lib/minimax-reading";
import {
  buildFollowupPointsHref,
  followupCostPoints,
} from "@/lib/points";
import {
  ensureFollowupCharge,
  getViewerPoints,
} from "@/lib/points-ledger";
import { prisma } from "@/lib/prisma";
import {
  mapRecordToReadingRecord,
  readingNeedsRevealMessage,
} from "@/lib/reading-record";
import {
  currentTarotSessionCookieName,
  mapRecordToTarotSession,
  serializeTarotCards,
} from "@/lib/tarot-session";

async function getViewerId() {
  const session = await auth();

  return session?.user?.id ?? null;
}

async function getCurrentTarotSessionRecord(ownerId: string) {
  const cookieStore = await cookies();
  const currentSessionId = cookieStore.get(currentTarotSessionCookieName)?.value;

  if (!currentSessionId) {
    return null;
  }

  return prisma.tarotSession.findFirst({
    where: {
      id: currentSessionId,
      ownerId,
    },
  });
}

async function getCurrentReadingRecord(sessionId: string, userId: string) {
  return prisma.readingRecord.findFirst({
    where: {
      sessionId,
      userId,
    },
  });
}

function sessionCanReadFollowup(
  ownerId: string,
  record: Awaited<ReturnType<typeof getCurrentTarotSessionRecord>>,
) {
  if (!record) {
    return {
      ok: false as const,
      message: "Open a complete reading first so the follow-up has somewhere true to continue from.",
      session: null,
    };
  }

  const session = mapRecordToTarotSession(record);

  if (
    session.ownerViewerId !== ownerId ||
    !session.question.trim() ||
    session.selectedCards.length !== 3 ||
    session.revealed < 3
  ) {
    return {
      ok: false as const,
      message: readingNeedsRevealMessage,
      session,
    };
  }

  return {
    ok: true as const,
    message: null,
    session,
  };
}

function readingMatchesSession(
  session: ReturnType<typeof mapRecordToTarotSession>,
  record: NonNullable<Awaited<ReturnType<typeof getCurrentReadingRecord>>>,
) {
  return (
    record.question === session.question &&
    record.category === session.category &&
    record.cardsSnapshot === serializeTarotCards(session.selectedCards)
  );
}

async function getFollowupRecords(readingRecordId: string, userId: string) {
  return prisma.followupRecord.findMany({
    where: {
      readingRecordId,
      userId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

async function resolveFollowupRecords(readingRecordId: string, userId: string) {
  const records = await getFollowupRecords(readingRecordId, userId);
  const lastRecord = records.at(-1);

  if (!lastRecord) {
    return [];
  }

  const mappedLast = mapRecordToFollowupRecord(lastRecord);

  if (!isFollowupRecordStale(mappedLast)) {
    return records.map(mapRecordToFollowupRecord);
  }

  await prisma.followupRecord.update({
    where: { id: lastRecord.id },
    data: {
      status: "failed",
      errorMessage: followupFailureMessage,
    },
  });

  const refreshedRecords = await getFollowupRecords(readingRecordId, userId);

  return refreshedRecords.map(mapRecordToFollowupRecord);
}

function toSafeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === followupUnavailableMessage) {
    return followupUnavailableMessage;
  }

  return followupFailureMessage;
}

function createInsufficientPointsResponse(args: {
  availablePoints: number;
  followup: ReturnType<typeof mapRecordToFollowupRecord>;
  followups: ReturnType<typeof mapRecordToFollowupRecord>[];
}) {
  return NextResponse.json(
    {
      currentFollowup: args.followup,
      followups: args.followups,
      message: followupNeedsPointsMessage,
      points: {
        available: args.availablePoints,
        required: followupCostPoints,
        topUpHref: buildFollowupPointsHref(),
      },
    },
    { status: 402 },
  );
}

export async function GET() {
  const viewerId = await getViewerId();

  if (!viewerId) {
    return NextResponse.json(
      { currentFollowup: null, followups: [] },
      { status: 401 },
    );
  }

  const sessionRecord = await getCurrentTarotSessionRecord(viewerId);
  const readiness = sessionCanReadFollowup(viewerId, sessionRecord);

  if (!readiness.ok) {
    return NextResponse.json(
      {
        currentFollowup: null,
        followups: [],
        message: readiness.message,
      },
      { status: 409 },
    );
  }

  const readingRecord = await getCurrentReadingRecord(
    readiness.session.sessionId,
    viewerId,
  );

  if (!readingRecord || !readingMatchesSession(readiness.session, readingRecord)) {
    return NextResponse.json(
      {
        currentFollowup: null,
        followups: [],
        message: followupNeedsReadingMessage,
      },
      { status: 409 },
    );
  }

  const reading = mapRecordToReadingRecord(readingRecord);

  if (reading.status !== "ready" || !reading.fullReading) {
    return NextResponse.json(
      {
        currentFollowup: null,
        followups: [],
        message: followupNeedsReadingMessage,
      },
      { status: 409 },
    );
  }

  const followups = await resolveFollowupRecords(readingRecord.id, viewerId);
  const currentFollowup = followups.at(-1) ?? null;

  if (currentFollowup?.status === "needs_points") {
    const availablePoints = await getViewerPoints(viewerId);

    return NextResponse.json(
      {
        currentFollowup,
        followups,
        points: {
          available: availablePoints,
          required: followupCostPoints,
          topUpHref: buildFollowupPointsHref(),
        },
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    currentFollowup,
    followups,
  });
}

export async function POST(request: Request) {
  const viewerId = await getViewerId();

  if (!viewerId) {
    return NextResponse.json(
      { currentFollowup: null, followups: [] },
      { status: 401 },
    );
  }

  const sessionRecord = await getCurrentTarotSessionRecord(viewerId);
  const readiness = sessionCanReadFollowup(viewerId, sessionRecord);

  if (!readiness.ok) {
    return NextResponse.json(
      {
        currentFollowup: null,
        followups: [],
        message: readiness.message,
      },
      { status: 409 },
    );
  }

  const readingRecord = await getCurrentReadingRecord(
    readiness.session.sessionId,
    viewerId,
  );

  if (!readingRecord || !readingMatchesSession(readiness.session, readingRecord)) {
    return NextResponse.json(
      {
        currentFollowup: null,
        followups: [],
        message: followupNeedsReadingMessage,
      },
      { status: 409 },
    );
  }

  const reading = mapRecordToReadingRecord(readingRecord);

  if (reading.status !== "ready" || !reading.fullReading) {
    return NextResponse.json(
      {
        currentFollowup: null,
        followups: [],
        message: followupNeedsReadingMessage,
      },
      { status: 409 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Partial<{
    force: boolean;
    followupId: string;
    prompt: string;
    requestKey: string;
  }>;
  const force = body.force === true;
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const requestKey =
    typeof body.requestKey === "string" && body.requestKey.trim()
      ? body.requestKey.trim()
      : `followup:${Date.now().toString(36)}`;
  const followupId =
    typeof body.followupId === "string" && body.followupId.trim()
      ? body.followupId.trim()
      : null;

  const existingRecord = followupId
    ? await prisma.followupRecord.findUnique({
        where: { id: followupId },
      })
    : await prisma.followupRecord.findUnique({
        where: { requestKey },
      });

  if (
    existingRecord &&
    (existingRecord.userId !== viewerId ||
      existingRecord.readingRecordId !== readingRecord.id)
  ) {
    return NextResponse.json(
      {
        currentFollowup: null,
        followups: [],
        message: followupNeedsReadingMessage,
      },
      { status: 409 },
    );
  }

  const normalizedPrompt = prompt || existingRecord?.prompt?.trim() || "";

  if (!normalizedPrompt) {
    return NextResponse.json(
      {
        currentFollowup: null,
        followups: [],
        message: "Write the next question you want this reading to hold before sending it onward.",
      },
      { status: 400 },
    );
  }

  if (normalizedPrompt.length > 320) {
    return NextResponse.json(
      {
        currentFollowup: null,
        followups: [],
        message: "Keep the follow-up focused enough to fit in one calm question.",
      },
      { status: 400 },
    );
  }

  const mappedExisting = existingRecord ? mapRecordToFollowupRecord(existingRecord) : null;

  if (mappedExisting?.status === "ready" && !force) {
    const followups = await resolveFollowupRecords(readingRecord.id, viewerId);

    return NextResponse.json({
      currentFollowup: followups.at(-1) ?? mappedExisting,
      followups,
    });
  }

  if (
    mappedExisting?.status === "generating" &&
    !force &&
    !isFollowupRecordStale(mappedExisting)
  ) {
    const followups = await resolveFollowupRecords(readingRecord.id, viewerId);

    return NextResponse.json(
      {
        currentFollowup: followups.at(-1) ?? mappedExisting,
        followups,
      },
      { status: 202 },
    );
  }

  const pendingRecord = existingRecord
    ? await prisma.followupRecord.update({
        where: { id: existingRecord.id },
        data: {
          prompt: normalizedPrompt,
          answer: null,
          status: "needs_points",
          source: "minimax",
          model: getMiniMaxReadingModel(),
          errorMessage: null,
          costPoints: followupCostPoints,
        },
      })
    : await prisma.followupRecord.create({
        data: {
          readingRecordId: readingRecord.id,
          userId: viewerId,
          prompt: normalizedPrompt,
          answer: null,
          status: "needs_points",
          source: "minimax",
          model: getMiniMaxReadingModel(),
          requestKey,
          costPoints: followupCostPoints,
          errorMessage: null,
        },
      });

  const availablePoints = await getViewerPoints(viewerId);

  if (availablePoints < followupCostPoints) {
    const followups = await resolveFollowupRecords(readingRecord.id, viewerId);
    const currentFollowup =
      followups.find((item: { id: string }) => item.id === pendingRecord.id) ??
      mapRecordToFollowupRecord(pendingRecord);

    return createInsufficientPointsResponse({
      availablePoints,
      followup: currentFollowup,
      followups,
    });
  }

  await prisma.followupRecord.update({
    where: { id: pendingRecord.id },
    data: {
      status: "generating",
      errorMessage: null,
      answer: null,
      source: "minimax",
      model: getMiniMaxReadingModel(),
      costPoints: followupCostPoints,
    },
  });

  try {
    const generated = await generateTarotFollowupWithMiniMax({
      question: readiness.session.question,
      category: readiness.session.category,
      cards: readiness.session.selectedCards,
      reading: reading.fullReading,
      followupPrompt: normalizedPrompt,
    });
    const chargeResult = await ensureFollowupCharge({
      userId: viewerId,
      followupRecordId: pendingRecord.id,
      requestKey: pendingRecord.requestKey,
      costPoints: followupCostPoints,
    });

    if (!chargeResult.ok) {
      const pointsPendingRecord = await prisma.followupRecord.update({
        where: { id: pendingRecord.id },
        data: {
          status: "needs_points",
          errorMessage: followupNeedsPointsMessage,
          answer: null,
        },
      });
      const followups = await resolveFollowupRecords(readingRecord.id, viewerId);
      const currentFollowup =
        followups.find((item: { id: string }) => item.id === pointsPendingRecord.id) ??
        mapRecordToFollowupRecord(pointsPendingRecord);

      return createInsufficientPointsResponse({
        availablePoints: chargeResult.points,
        followup: currentFollowup,
        followups,
      });
    }

    const readyRecord = await prisma.followupRecord.update({
      where: { id: pendingRecord.id },
      data: {
        answer: generated.answer,
        status: "ready",
        source: "minimax",
        model: generated.model,
        errorMessage: null,
        chargeTransactionId: chargeResult.transactionId,
        costPoints: followupCostPoints,
      },
    });
    const followups = await resolveFollowupRecords(readingRecord.id, viewerId);

    return NextResponse.json({
      currentFollowup:
        followups.find((item: { id: string }) => item.id === readyRecord.id) ??
        mapRecordToFollowupRecord(readyRecord),
      followups,
    });
  } catch (error) {
    console.error("MiniMax followup generation failed", error);

    const failedRecord = await prisma.followupRecord.update({
      where: { id: pendingRecord.id },
      data: {
        status: "failed",
        source: "minimax",
        model: getMiniMaxReadingModel(),
        errorMessage: toSafeErrorMessage(error),
      },
    });
    const followups = await resolveFollowupRecords(readingRecord.id, viewerId);

    return NextResponse.json(
      {
        currentFollowup:
          followups.find((item: { id: string }) => item.id === failedRecord.id) ??
          mapRecordToFollowupRecord(failedRecord),
        followups,
        message: failedRecord.errorMessage,
      },
      { status: 502 },
    );
  }
}
