import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { claimDailyCheckIn } from "@/lib/daily-checkin";
import { getViewerPointsLedger } from "@/lib/points-ledger";

async function getViewerId() {
  const session = await auth();

  return session?.user?.id ?? null;
}

export async function POST() {
  const viewerId = await getViewerId();

  if (!viewerId) {
    return NextResponse.json(
      { message: "Sign in to gather today's points." },
      { status: 401 },
    );
  }

  try {
    const result = await claimDailyCheckIn(viewerId);
    const ledger = await getViewerPointsLedger(viewerId);

    return NextResponse.json({
      status: result.status,
      ledger,
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "Today's return did not settle just yet. Give it another quiet try.",
      },
      { status: 500 },
    );
  }
}
