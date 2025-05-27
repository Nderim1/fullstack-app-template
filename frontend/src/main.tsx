import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes';
import { AuthProvider } from './auth/AuthContext';
import { queryClient } from './services/authAPI';

// Import Mantine core styles
import '@mantine/core/styles.css';
import { Notifications } from '@mantine/notifications';

// Your app's CSS or Tailwind CSS import
import './index.css'

import { MantineProvider } from '@mantine/core';

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <Notifications />
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </MantineProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
