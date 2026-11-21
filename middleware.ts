import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect officer web pages (e.g. /dashboard)
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySession(token);

    if (!session || session.role !== "officer") {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/dashboard"],
};
