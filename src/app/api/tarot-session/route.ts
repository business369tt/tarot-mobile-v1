import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createTarotSession,
  currentTarotSessionCookieName,
  mapRecordToTarotSession,
  normalizeTarotDraft,
  normalizeTarotSession,
  serializeTarotCards,
} from "@/lib/tarot-session";

async function getOwnerId() {
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

function attachSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set(currentTarotSessionCookieName, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(currentTarotSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function GET() {
  const ownerId = await getOwnerId();

  if (!ownerId) {
    return NextResponse.json({ session: null });
  }

  const record = await getCurrentTarotSessionRecord(ownerId);

  if (!record) {
    return NextResponse.json({ session: null });
  }

  const response = NextResponse.json({
    session: mapRecordToTarotSession(record),
  });

  attachSessionCookie(response, record.id);

  return response;
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();

  if (!ownerId) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<{
    question: string;
    category: string;
    saveToHistory: boolean;
  }>;
  const draft = normalizeTarotDraft({
    question: body.question ?? "",
    category: body.category as never,
    saveToHistory: false,
  });

  if (!draft.question.trim()) {
    return NextResponse.json({ error: "QUESTION_REQUIRED" }, { status: 400 });
  }

  const tarotSession = createTarotSession(draft, ownerId);
  const record = await prisma.tarotSession.create({
    data: {
      id: tarotSession.sessionId,
      ownerId,
      currentStep: tarotSession.currentStep,
      question: tarotSession.question,
      category: tarotSession.category,
      saveToHistory: false,
      spreadCardsJson: serializeTarotCards(tarotSession.spreadCards),
      selectedCardsJson: serializeTarotCards(tarotSession.selectedCards),
      revealed: tarotSession.revealed,
      ritualStartedAt: null,
    },
  });

  const response = NextResponse.json({
    session: mapRecordToTarotSession(record),
  });

  attachSessionCookie(response, record.id);

  return response;
}

export async function PATCH(request: Request) {
  const ownerId = await getOwnerId();

  if (!ownerId) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const record = await getCurrentTarotSessionRecord(ownerId);

  if (!record) {
    return NextResponse.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<{
    currentStep: string;
    question: string;
    category: string;
    saveToHistory: boolean;
    spreadCards: unknown[];
    selectedCards: unknown[];
    revealed: number;
    ritualStartedAt: string | null;
  }>;
  const currentSession = mapRecordToTarotSession(record);
  const nextSession = normalizeTarotSession({
    ...currentSession,
    currentStep: (body.currentStep as never) ?? currentSession.currentStep,
    question:
      typeof body.question === "string" ? body.question : currentSession.question,
    category: (body.category as never) ?? currentSession.category,
    saveToHistory: false,
    spreadCards: Array.isArray(body.spreadCards)
      ? (body.spreadCards as never)
      : currentSession.spreadCards,
    selectedCards: Array.isArray(body.selectedCards)
      ? (body.selectedCards as never)
      : currentSession.selectedCards,
    revealed:
      typeof body.revealed === "number" ? body.revealed : currentSession.revealed,
    ritualStartedAt:
      body.ritualStartedAt === null || typeof body.ritualStartedAt === "string"
        ? body.ritualStartedAt
        : currentSession.ritualStartedAt,
    ownerViewerId: ownerId,
    sessionId: record.id,
    createdAt: record.createdAt.toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const updatedRecord = await prisma.tarotSession.update({
    where: { id: record.id },
    data: {
      currentStep: nextSession.currentStep,
      question: nextSession.question,
      category: nextSession.category,
      saveToHistory: false,
      spreadCardsJson: serializeTarotCards(nextSession.spreadCards),
      selectedCardsJson: serializeTarotCards(nextSession.selectedCards),
      revealed: nextSession.revealed,
      ritualStartedAt: nextSession.ritualStartedAt
        ? new Date(nextSession.ritualStartedAt)
        : null,
    },
  });

  const response = NextResponse.json({
    session: mapRecordToTarotSession(updatedRecord),
  });

  attachSessionCookie(response, updatedRecord.id);

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ session: null });

  clearSessionCookie(response);

  return response;
}
