import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login"
  }
});

export const config = {
  matcher: [
    "/profile/:path*",
    "/posts/new",
    "/posts/:path*/edit",
    "/bookings/:path*",
    "/notifications/:path*",
    "/messages/:path*"
  ]
};
