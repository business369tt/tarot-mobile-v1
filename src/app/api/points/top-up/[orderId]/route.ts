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
      { message: "請先登入後再查看補點訂單。" },
      { status: 401 },
    );
  }

  const { orderId } = await context.params;
  const order = await getTopUpOrderForViewer(orderId, viewerId);

  if (!order) {
    return NextResponse.json(
      { message: "這筆補點訂單目前無法查看。" },
      { status: 404 },
    );
  }

  return NextResponse.json({ order });
}
