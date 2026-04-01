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
      { message: "Sign in to view this restore step." },
      { status: 401 },
    );
  }

  const { orderId } = await context.params;
  const order = await getTopUpOrderForViewer(orderId, viewerId);

  if (!order) {
    return NextResponse.json(
      { message: "This restore step could not be reopened from here." },
      { status: 404 },
    );
  }

  return NextResponse.json({ order });
}
