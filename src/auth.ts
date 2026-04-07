import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import LINE from "next-auth/providers/line";
import { prisma } from "@/lib/prisma";
import { isGoogleAuthConfigured, isLineAuthConfigured } from "@/lib/auth-env";

const lineConfigured = isLineAuthConfigured();
const googleConfigured = isGoogleAuthConfigured();

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  pages: {
    signIn: "/auth/line",
  },
  session: {
    strategy: "database",
  },
  providers: [
    ...(lineConfigured
      ? [
        LINE({
          clientId: process.env.AUTH_LINE_ID!,
          clientSecret: process.env.AUTH_LINE_SECRET!,
        }),
      ]
      : []),
    ...(googleConfigured
      ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID!,
          clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          authorization: {
            params: {
              prompt: "select_account",
            },
          },
        }),
      ]
      : []),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        const account = await prisma.account.findFirst({
          where: {
            userId: user.id,
          },
          orderBy: {
            id: "asc",
          },
          select: {
            provider: true,
          },
        });

        session.user.id = user.id;
        session.user.authProvider =
          account?.provider === "google"
            ? "google"
            : account?.provider === "line"
              ? "line"
              : null;
      }

      return session;
    },
  },
});
