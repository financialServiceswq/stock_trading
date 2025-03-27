import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/api/user/:path*',
    // '/portfolio/:path*',
    // '/market/:path*',
    // '/checkout/:path*',
  ],
}; 