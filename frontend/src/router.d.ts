// frontend/src/router.d.ts
import type { router } from './routes'; // For the Register interface

// Extremely simple context for testing
interface MinimalTestContext {
  testProperty: string;
}

declare module '@tanstack/react-router' {
  interface RouterContext {
    // Use the minimal test context
    // If this works, we'll know the issue is with MyAuthServiceShape or User import
    auth: MinimalTestContext; // Changed from MyAuthServiceShape
  }

  interface Register {
    router: typeof router;
  }
}