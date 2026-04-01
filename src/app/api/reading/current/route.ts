import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  generateTarotReadingWithMiniMax,
  getMiniMaxReadingModel,
} from "@/lib/minimax-reading";
import { prisma } from "@/lib/prisma";
import { buildReadingPointsHref, readingCostPoints } from "@/lib/points";
import { ensureReadingCharge, getViewerPoints } from "@/lib/points-ledger";
import {
  isReadingRecordStale,
  mapRecordToReadingRecord,
  readingFailureMessage,
  readingNeedsRevealMessage,
  readingUnavailableMessage,
  serializeStructuredTarotReading,
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

function sessionCanGenerateReading(ownerId: string, record: Awaited<ReturnType<typeof getCurrentTarotSessionRecord>>) {
  if (!record) {
    return {
      ok: false as const,
      message: "Start a reading first so the report has a thread to open from.",
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

async function resolveReadableRecord(
  session: ReturnType<typeof mapRecordToTarotSession>,
  record: Awaited<ReturnType<typeof getCurrentReadingRecord>>,
) {
  if (!record || !readingMatchesSession(session, record)) {
    return null;
  }

  const mapped = mapRecordToReadingRecord(record);

  if (!isReadingRecordStale(mapped)) {
    return mapped;
  }

  const failedRecord = await prisma.readingRecord.update({
    where: { id: record.id },
    data: {
      status: "failed",
      errorMessage: readingFailureMessage,
    },
  });

  return mapRecordToReadingRecord(failedRecord);
}

function toSafeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === readingUnavailableMessage) {
    return readingUnavailableMessage;
  }

  return readingFailureMessage;
}

function createInsufficientPointsResponse(availablePoints: number) {
  return NextResponse.json(
    {
      reading: null,
      message: "You are one step away from the full report. Add points first, then return here and the reading can continue.",
      points: {
        available: availablePoints,
        required: readingCostPoints,
        topUpHref: buildReadingPointsHref(),
      },
    },
    { status: 402 },
  );
}

export async function GET() {
  const viewerId = await getViewerId();

  if (!viewerId) {
    return NextResponse.json({ reading: null }, { status: 401 });
  }

  const sessionRecord = await getCurrentTarotSessionRecord(viewerId);
  const readiness = sessionCanGenerateReading(viewerId, sessionRecord);

  if (!readiness.ok) {
    return NextResponse.json(
      {
        reading: null,
        message: readiness.message,
      },
      { status: 409 },
    );
  }

  const record = await getCurrentReadingRecord(readiness.session.sessionId, viewerId);
  const reading = await resolveReadableRecord(readiness.session, record);

  if (!reading) {
    const availablePoints = await getViewerPoints(viewerId);

    if (availablePoints < readingCostPoints) {
      return createInsufficientPointsResponse(availablePoints);
    }
  }

  return NextResponse.json({ reading });
}

export async function POST(request: Request) {
  const viewerId = await getViewerId();

  if (!viewerId) {
    return NextResponse.json({ reading: null }, { status: 401 });
  }

  const sessionRecord = await getCurrentTarotSessionRecord(viewerId);
  const readiness = sessionCanGenerateReading(viewerId, sessionRecord);

  if (!readiness.ok) {
    return NextResponse.json(
      {
        reading: null,
        message: readiness.message,
      },
      { status: 409 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Partial<{
    force: boolean;
  }>;
  const force = body.force === true;
  const existingRecord = await getCurrentReadingRecord(
    readiness.session.sessionId,
    viewerId,
  );
  const matchingRecord =
    existingRecord && readingMatchesSession(readiness.session, existingRecord)
      ? mapRecordToReadingRecord(existingRecord)
      : null;

  if (matchingRecord?.status === "ready" && !force) {
    return NextResponse.json({ reading: matchingRecord });
  }

  if (matchingRecord?.status === "generating" && !force && !isReadingRecordStale(matchingRecord)) {
    return NextResponse.json({ reading: matchingRecord }, { status: 202 });
  }

  const availablePoints = await getViewerPoints(viewerId);

  if (availablePoints < readingCostPoints) {
    return createInsufficientPointsResponse(availablePoints);
  }

  const cardsSnapshot = serializeTarotCards(readiness.session.selectedCards);
  const pendingRecord = await prisma.readingRecord.upsert({
    where: {
      sessionId: readiness.session.sessionId,
    },
    create: {
      sessionId: readiness.session.sessionId,
      userId: viewerId,
      question: readiness.session.question,
      category: readiness.session.category,
      cardsSnapshot,
      fullReading: null,
      source: "minimax",
      model: getMiniMaxReadingModel(),
      status: "generating",
      errorMessage: null,
      costPoints: readingCostPoints,
    },
    update: {
      userId: viewerId,
      question: readiness.session.question,
      category: readiness.session.category,
      cardsSnapshot,
      fullReading: null,
      source: "minimax",
      model: getMiniMaxReadingModel(),
      status: "generating",
      errorMessage: null,
      costPoints: readingCostPoints,
    },
  });

  try {
    const generated = await generateTarotReadingWithMiniMax({
      question: readiness.session.question,
      category: readiness.session.category,
      cards: readiness.session.selectedCards,
    });
    const chargeResult = await ensureReadingCharge({
      userId: viewerId,
      readingRecordId: pendingRecord.id,
      sessionId: readiness.session.sessionId,
      costPoints: readingCostPoints,
    });

    if (!chargeResult.ok) {
      await prisma.readingRecord.update({
        where: { id: pendingRecord.id },
        data: {
          status: "failed",
          errorMessage: "This report still needs points before it can be completed.",
          fullReading: null,
        },
      });

      return createInsufficientPointsResponse(chargeResult.points);
    }

    const readyRecord = await prisma.readingRecord.update({
      where: { id: pendingRecord.id },
      data: {
        source: "minimax",
        model: generated.model,
        status: "ready",
        errorMessage: null,
        fullReading: serializeStructuredTarotReading(generated.reading),
        chargeRequestKey: chargeResult.requestKey,
        chargeTransactionId: chargeResult.transactionId,
        costPoints: readingCostPoints,
      },
    });

    return NextResponse.json({
      reading: mapRecordToReadingRecord(readyRecord),
    });
  } catch (error) {
    console.error("MiniMax reading generation failed", error);

    const failedRecord = await prisma.readingRecord.update({
      where: { id: pendingRecord.id },
      data: {
        source: "minimax",
        model: getMiniMaxReadingModel(),
        status: "failed",
        errorMessage: toSafeErrorMessage(error),
      },
    });

    return NextResponse.json(
      {
        reading: mapRecordToReadingRecord(failedRecord),
        message: failedRecord.errorMessage,
      },
      { status: 502 },
    );
  }
}
