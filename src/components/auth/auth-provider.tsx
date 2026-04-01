"use client";

import type { Session } from "next-auth";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { getViewerInitials } from "@/lib/viewer-auth";

type AuthContextValue = {
  isHydrated: boolean;
  isAuthenticated: boolean;
  authStatus: "anonymous" | "authenticated";
  authProvider: "line" | null;
  viewerId: string | null;
  displayName: string | null;
  avatar: string | null;
  initials: string;
  lineConfigured: boolean;
  beginLineSignIn: (callbackUrl?: string) => Promise<void>;
  signOutFromLine: () => Promise<void>;
  ownsViewerId: (ownerViewerId: string | null | undefined) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthBridge({
  children,
  lineConfigured,
}: Readonly<{
  children: ReactNode;
  lineConfigured: boolean;
}>) {
  const { data, status } = useSession();
  const isHydrated = status !== "loading";
  const isAuthenticated = status === "authenticated";
  const viewerId = data?.user?.id ?? null;
  const displayName = data?.user?.name ?? null;
  const avatar = data?.user?.image ?? null;

  return (
    <AuthContext.Provider
      value={{
        isHydrated,
        isAuthenticated,
        authStatus: isAuthenticated ? "authenticated" : "anonymous",
        authProvider: isAuthenticated ? "line" : null,
        viewerId,
        displayName,
        avatar,
        initials: getViewerInitials(displayName),
        lineConfigured,
        beginLineSignIn: async (callbackUrl = "/question") => {
          if (!lineConfigured) {
            return;
          }

          await signIn("line", { callbackUrl });
        },
        signOutFromLine: async () => {
          await signOut({ callbackUrl: "/auth/line" });
        },
        ownsViewerId: (ownerViewerId) =>
          Boolean(viewerId && ownerViewerId && viewerId === ownerViewerId),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({
  children,
  session,
  lineConfigured,
}: Readonly<{
  children: ReactNode;
  session: Session | null;
  lineConfigured: boolean;
}>) {
  return (
    <SessionProvider session={session}>
      <AuthBridge lineConfigured={lineConfigured}>{children}</AuthBridge>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
