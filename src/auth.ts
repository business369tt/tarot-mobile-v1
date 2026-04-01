import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import LINE from "next-auth/providers/line";
import { prisma } from "@/lib/prisma";
import { isLineAuthConfigured } from "@/lib/auth-env";

const lineConfigured = isLineAuthConfigured();

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  pages: {
    signIn: "/auth/line",
  },
  session: {
    strategy: "database",
  },
  providers: lineConfigured
    ? [
        LINE({
          clientId: process.env.AUTH_LINE_ID!,
          clientSecret: process.env.AUTH_LINE_SECRET!,
        }),
      ]
    : [],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.authProvider = "line";
      }

      return session;
    },
  },
});
