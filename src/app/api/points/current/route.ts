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
    return NextResponse.json(
      { message: "請先登入，才能查看點數。" },
      { status: 401 },
    );
  }

  const summary = await getViewerPointsLedger(viewerId);

  return NextResponse.json(summary);
}
