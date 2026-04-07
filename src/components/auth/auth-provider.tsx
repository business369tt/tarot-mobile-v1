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
  authProvider: "line" | "google" | null;
  viewerId: string | null;
  displayName: string | null;
  avatar: string | null;
  initials: string;
  lineConfigured: boolean;
  googleConfigured: boolean;
  beginLineSignIn: (callbackUrl?: string) => Promise<void>;
  beginGoogleSignIn: (callbackUrl?: string) => Promise<void>;
  signOutViewer: () => Promise<void>;
  ownsViewerId: (ownerViewerId: string | null | undefined) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthBridge({
  children,
  lineConfigured,
  googleConfigured,
}: Readonly<{
  children: ReactNode;
  lineConfigured: boolean;
  googleConfigured: boolean;
}>) {
  const { data, status } = useSession();
  const isHydrated = status !== "loading";
  const isAuthenticated = status === "authenticated";
  const viewerId = data?.user?.id ?? null;
  const displayName = data?.user?.name ?? null;
  const avatar = data?.user?.image ?? null;
  const authProvider = data?.user?.authProvider ?? null;

  return (
    <AuthContext.Provider
      value={{
        isHydrated,
        isAuthenticated,
        authStatus: isAuthenticated ? "authenticated" : "anonymous",
        authProvider: isAuthenticated ? authProvider : null,
        viewerId,
        displayName,
        avatar,
        initials: getViewerInitials(displayName),
        lineConfigured,
        googleConfigured,
        beginLineSignIn: async (callbackUrl = "/question") => {
          if (!lineConfigured) {
            return;
          }

          await signIn("line", { callbackUrl });
        },
        beginGoogleSignIn: async (callbackUrl = "/question") => {
          if (!googleConfigured) {
            return;
          }

          await signIn("google", { callbackUrl });
        },
        signOutViewer: async () => {
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
  googleConfigured,
}: Readonly<{
  children: ReactNode;
  session: Session | null;
  lineConfigured: boolean;
  googleConfigured: boolean;
}>) {
  return (
    <SessionProvider session={session}>
      <AuthBridge
        lineConfigured={lineConfigured}
        googleConfigured={googleConfigured}
      >
        {children}
      </AuthBridge>
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
