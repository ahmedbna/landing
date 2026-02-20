// middleware.ts — REPLACE your existing middleware with this
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/privacy',
  '/terms',
  '/login',
  '/purchase',
]);
const isSignInPage = createRouteMatcher(['/login']);
const isAdminRoute = createRouteMatcher(['/admin', '/admin/(.*)']);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthenticated = await convexAuth.isAuthenticated();

  if (isSignInPage(request) && isAuthenticated) {
    return nextjsMiddlewareRedirect(request, '/');
  }

  if (!isPublicRoute(request) && !isAuthenticated) {
    return nextjsMiddlewareRedirect(request, '/login');
  }

  // Admin routes: check for admin session (cookie-based hint)
  // Full auth is enforced server-side in each admin page via Convex query
  if (isAdminRoute(request) && !isAuthenticated) {
    return nextjsMiddlewareRedirect(request, '/login');
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
