import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTopUpOrderForViewer } from "@/lib/top-up-orders";

export const runtime = "nodejs";

async function getViewerId() {
  const session = await auth();

  return session?.user?.id ?? null;
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      orderId: string;
    }>;
  },
) {
  const viewerId = await getViewerId();

  if (!viewerId) {
    return NextResponse.json(
      { message: "請先登入，才能查看這筆補點。" },
      { status: 401 },
    );
  }

  const { orderId } = await context.params;
  const order = await getTopUpOrderForViewer(orderId, viewerId);

  if (!order) {
    return NextResponse.json(
      { message: "這筆補點目前無法重新打開。" },
      { status: 404 },
    );
  }

  return NextResponse.json({ order });
}
