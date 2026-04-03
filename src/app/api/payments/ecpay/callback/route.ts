import { verifyEcpayCheckMacValue } from "@/lib/ecpay";
import { settleOrMarkTopUpOrderFromEcpayPayload } from "@/lib/top-up-orders";

export const runtime = "nodejs";

function formDataToPayload(formData: FormData) {
  const payload: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      payload[key] = value;
    }
  }

  return payload;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = formDataToPayload(formData);

  if (!verifyEcpayCheckMacValue(payload)) {
    return new Response("0|CheckMacValue failed", {
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  try {
    await settleOrMarkTopUpOrderFromEcpayPayload(payload);

    return new Response("1|OK", {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("ECPay callback handling failed", error);

    return new Response("0|Callback failed", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
