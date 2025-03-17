import { getRefreshToken } from "@actions/session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/register"];
const privateRoutes = ["/", "/invite"];

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(pathname);
  const isPrivateRoute = privateRoutes.includes(pathname);
  const token = await getRefreshToken()
  
  if (!token && !isPublicRoute)
    return NextResponse.redirect(new URL("/register", req.nextUrl));

  if (token && (!isPrivateRoute || pathname.startsWith("/register"))) 
    return NextResponse.redirect(new URL("/", req.nextUrl));

  return NextResponse.next();
}

export const config = {
  // matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'],
};
