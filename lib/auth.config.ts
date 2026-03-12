import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

// This config is Edge-compatible (no Prisma dependency here)
export const authConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/login");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
      const isPublic = nextUrl.pathname.startsWith("/api/telegram/webhook") || 
                       nextUrl.pathname.startsWith("/public") ||
                       nextUrl.pathname.startsWith("/favicon.ico");

      if (isApiAuth || isPublic) return true;
      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      if (!isLoggedIn) return false; // forces redirect to login
      return true;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: { strategy: "jwt" }, // JWT is required for Edge compatibility in Middleware
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
