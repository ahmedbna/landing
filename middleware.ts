import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server';

// Public routes ONLY
const isPublicRoute = createRouteMatcher(['/', '/privacy', '/terms', '/login']);

const isSignInPage = createRouteMatcher(['/login']);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthenticated = await convexAuth.isAuthenticated();

  // If user is logged in and tries to access /login → redirect home
  if (isSignInPage(request) && isAuthenticated) {
    return nextjsMiddlewareRedirect(request, '/');
  }

  // If route is NOT public and user is NOT authenticated → protect it
  if (!isPublicRoute(request) && !isAuthenticated) {
    return nextjsMiddlewareRedirect(request, '/login');
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
