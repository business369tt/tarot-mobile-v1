import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getViewerPointsLedger } from "@/lib/points-ledger";

async function getViewerId() {
  const session = await auth();

  return session?.user?.id ?? null;
}

export async function GET() {
  const viewerId = await getViewerId();

  if (!viewerId) {
    return NextResponse.json({ message: "Sign in to view your points." }, { status: 401 });
  }

  const summary = await getViewerPointsLedger(viewerId);

  return NextResponse.json(summary);
}
