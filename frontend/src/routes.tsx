import {
  createRootRoute,
  createRoute,
  Router,
  redirect,
} from '@tanstack/react-router';
import authService, { type User } from './auth/authService';

// Define the shape of our router context
interface AuthContext {
  auth: {
    isAuthenticated: () => boolean;
    getUser: () => User | null;
    // Add other auth methods you use in your routes
  };
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
    routeContext: {
      root: AuthContext;
    };
  }
}

// Define our custom context type - this is good for clarity but won't be directly used in Router generic
// interface AppRouterContext { 
//   auth: typeof authService;
// }

// Import your page components
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import MagicLinkSentPage from './pages/MagicLinkSentPage';
import VerifyMagicLinkPage from './pages/VerifyMagicLinkPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import App from './App';

// Create a root route
const rootRoute = createRootRoute({
  component: App,
  beforeLoad: () => ({
    auth: {
      isAuthenticated: () => authService.isAuthenticated(),
      getUser: () => authService.getUser(),
    },
  }),
});

// Create child routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated()) {
      throw redirect({
        to: '/auth/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/login', // This path will also handle /auth/login?magicLinkToken=...&email=...
  component: AuthPage,
  validateSearch: (search: Record<string, unknown>): {
    redirect?: string;
    magicLinkToken?: string;
    email?: string;
    magicLink?: string; // For initially showing the magic link tab
  } => {
    return {
      redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
      magicLinkToken: typeof search.magicLinkToken === 'string' ? search.magicLinkToken : undefined,
      email: typeof search.email === 'string' ? search.email : undefined,
      magicLink: typeof search.magicLink === 'string' ? search.magicLink : undefined,
    };
  },
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated()) {
      throw redirect({
        to: '/',
      });
    }
  }
});

export { authRoute };

const magicLinkSentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/magic-link-sent',
  component: MagicLinkSentPage,
});

const verifyMagicLinkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/verify-magic-link',
  component: VerifyMagicLinkPage,
});

export const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback/$provider',
  component: AuthCallbackPage,
  validateSearch: (search: Record<string, unknown>): {
    token?: string;
    error?: string;
    redirect?: string;
  } => {
    if (search.token && typeof search.token !== 'string') {
      throw new Error('Token must be a string');
    }
    if (search.error && typeof search.error !== 'string') {
      throw new Error('Error must be a string');
    }
    if (search.redirect && typeof search.redirect !== 'string') {
      throw new Error('Redirect must be a string');
    }
    return {
      token: search.token as string | undefined,
      error: search.error as string | undefined,
      redirect: search.redirect as string | undefined,
    };
  },
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  authRoute,
  magicLinkSentRoute,
  verifyMagicLinkRoute,
  authCallbackRoute,
]);

// Create the router instance
// Type inference from routeTree and context, with Register interface handling global type availability.
export const router = new Router({
  routeTree,
  context: {
    auth: authService,
  },
});

// The router is now properly typed with our context
