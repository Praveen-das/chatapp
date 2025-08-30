import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const privateRoutes = ["/", "/invite", "/api", "/server"];

export default async function middleware(req: NextRequest, event: NextResponse) {
  const pathname = req.nextUrl.pathname;
  const token = await getToken({ req });
  const isAuthenticated = !!token?.user?.id;
  const isPrivateRoute = privateRoutes.includes(pathname);
  const isApiRoute = pathname.startsWith("/api/");
  const isLoginPage = pathname.startsWith("/register");

  if (isApiRoute) return NextResponse.next();

  if (!isAuthenticated) {
    if (isLoginPage) return NextResponse.next();
    return NextResponse.redirect(new URL("/register", req.nextUrl));
  } else {
    if (!isPrivateRoute) return NextResponse.redirect(new URL("/", req.nextUrl));
    if (isLoginPage) return NextResponse.redirect(new URL("/", req.nextUrl));
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
