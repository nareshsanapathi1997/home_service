import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const protectedPrefixes = ["/customer", "/technician", "/admin", "/notifications"];
  const isProtected = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !isLoggedIn) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return Response.redirect(login);
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    const role = req.auth?.user?.role;
    const dest =
      role === "ADMIN"
        ? "/admin"
        : role === "TECHNICIAN"
          ? "/technician"
          : "/customer";
    return Response.redirect(new URL(dest, req.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    "/customer/:path*",
    "/technician/:path*",
    "/admin/:path*",
    "/notifications/:path*",
    "/login",
    "/register",
  ],
};
