import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AuthProvider } from "@/components/auth/auth-provider";
import { TarotFlowProvider } from "@/components/flow/tarot-flow-provider";
import { MobileShell } from "@/components/shell/mobile-shell";
import { isGoogleAuthConfigured, isLineAuthConfigured } from "@/lib/auth-env";

export default async function MobileLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await auth();
  const lineConfigured = isLineAuthConfigured();
  const googleConfigured = isGoogleAuthConfigured();

  return (
    <AuthProvider
      session={session}
      lineConfigured={lineConfigured}
      googleConfigured={googleConfigured}
    >
      <TarotFlowProvider>
        <MobileShell>{children}</MobileShell>
      </TarotFlowProvider>
    </AuthProvider>
  );
}
