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
      { message: "請先登入後再領取每日點數。" },
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
        message: "今天的每日點數暫時無法領取，請稍後再試一次。",
      },
      { status: 500 },
    );
  }
}
