import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// We use the light config for Middleware to avoid Node.js runtime errors (Edge Runtime)
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api/auth|api/telegram/webhook|_next/static|_next/image|favicon.ico|public).*)"],
};
