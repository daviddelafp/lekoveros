import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const isAdmin = session?.user?.role === "ADMIN";

  const isAuthPage = nextUrl.pathname === "/login";
  const isAdminPage = nextUrl.pathname.startsWith("/admin");
  const isPublicPage = nextUrl.pathname === "/";

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(
        new URL(isAdmin ? "/admin" : "/catalogo", nextUrl)
      );
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAdminPage && !isAdmin) {
    return NextResponse.redirect(new URL("/catalogo", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
