import { useMutation, QueryClient, useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

// Define the expected response type for login
interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

// Define the expected input type for login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Define the expected input type for signup
export interface SignupCredentials {
  email?: string;
  password?: string;
  name?: string; // Added name for signup
}

// Assuming signup response is similar to login, adjust if different
interface SignupResponse {
  accessToken: string; // Changed from token to accessToken to match backend
  user: { id: string; email: string; name: string | null; role: string };
}

// Create a new QueryClient instance (can be shared across the app or created per module)
// For simplicity here, but typically you'd have one QueryClientProvider at the root of your app.
export const queryClient = new QueryClient();

// --- Signup --- 
const signupUserFetcher = async (credentials: SignupCredentials): Promise<SignupResponse> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Signup failed with status: ' + response.status }));
    throw new Error(errorData.message || 'Signup failed');
  }

  return response.json();
};

export const useSignupUser = () => {
  return useMutation<SignupResponse, Error, SignupCredentials>({
    mutationFn: signupUserFetcher,
    onSuccess: (data) => {
      console.log('Signup successful:', data);
      notifications.show({
        title: 'Signup Successful!',
        message: 'Welcome! You have been successfully signed up.',
        color: 'green',
      });
      // Redirection (e.g., to homepage) is typically handled in the component
      // or context that calls this mutation (e.g., in AuthContext.tsx after signup succeeds)
      // as it requires router context (useNavigate hook).
    },
    onError: (error) => {
      console.error('Signup error:', error.message);
      notifications.show({
        title: 'Signup Failed',
        message: error.message || 'An unexpected error occurred during signup.',
        color: 'red',
      });
    },
  });
};

// --- Login --- 
const loginUserFetcher = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, { // Assuming this is your backend endpoint
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    // Attempt to parse error message from backend if available
    const errorData = await response.json().catch(() => ({ message: 'Login failed with status: ' + response.status }));
    throw new Error(errorData.message || 'Login failed');
  }

  return response.json();
};

export const useLoginUser = () => {
  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: loginUserFetcher,
    // Optional: onSuccess, onError, onSettled callbacks
    onSuccess: (data) => {
      console.log('Login successful:', data);
      // You might want to store the token or user data here or in AuthContext
      // For example, storing the token in localStorage:
      if (data.accessToken) { // Changed from data.token to data.accessToken
        localStorage.setItem('accessToken', data.accessToken);
      }
    },
    onError: (error) => {
      console.error('Login error:', error.message);
    },
  });
};

// --- Magic Link --- 

// Request Magic Link
interface MagicLinkRequest {
  email: string;
}

interface MagicLinkRequestResponse {
  message: string; // "If an account with this email is registered or can be created, a magic link has been sent."
}

const requestMagicLinkFetcher = async (credentials: MagicLinkRequest): Promise<MagicLinkRequestResponse> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/magic-link/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Requesting magic link failed with status: ' + response.status }));
    throw new Error(errorData.message || 'Requesting magic link failed');
  }
  return response.json();
};

export const useRequestMagicLink = () => {
  return useMutation<MagicLinkRequestResponse, Error, MagicLinkRequest>({
    mutationFn: requestMagicLinkFetcher,
    onSuccess: (data) => {
      notifications.show({
        title: 'Magic Link Sent!',
        message: data.message,
        color: 'blue',
      });
    },
    onError: (error) => {
      notifications.show({
        title: 'Magic Link Request Failed',
        message: error.message || 'An unexpected error occurred.',
        color: 'red',
      });
    },
  });
};

// Verify Magic Link
interface VerifyMagicLinkRequest {
  email: string;
  token: string;
}

// Assuming verify magic link response is similar to login/signup (token + user)
interface VerifyMagicLinkResponse {
  accessToken: string;
  user: { id: string; email: string; name: string | null; role: string };
}

const verifyMagicLinkFetcher = async (credentials: VerifyMagicLinkRequest): Promise<VerifyMagicLinkResponse> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/magic-link/verify`, {
    method: 'POST', // Or GET if your backend uses GET for verification with query params
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials), // If POST
    // If GET, construct URL with query params: `${import.meta.env.VITE_API_URL}/auth/magic-link/verify?token=${credentials.token}&email=${credentials.email}`
    // and remove body/headers for GET.
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Verifying magic link failed with status: ' + response.status }));
    throw new Error(errorData.message || 'Verifying magic link failed');
  }
  return response.json();
};

export const useVerifyMagicLink = () => {
  return useMutation<VerifyMagicLinkResponse, Error, VerifyMagicLinkRequest>({
    mutationFn: verifyMagicLinkFetcher,
    // onSuccess and onError for verify can be handled in AuthContext or the component that calls it
    // as it will likely involve setting auth state and redirecting.
  });
};

export const useFetchUserProfile = (token: string | null) => {
  return useQuery<
    import('../auth/authService').User, // Use User type from authService
    Error
  >({
    queryKey: ['userProfile', token], // Include token in queryKey as the query depends on it
    queryFn: async () => {
      if (!token) {
        // This case should ideally be prevented by the `enabled` option,
        // but it's a good safeguard.
        throw new Error('Attempted to fetch user profile without a token.');
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Add Authorization header
        },
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON or another error occurs during parsing
          throw new Error(`Fetching user profile failed with status: ${response.status}`);
        }
        throw new Error(errorData.message || `Fetching user profile failed with status: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!token, // Only run the query if the token exists
    retry: 1, // Retry once on failure
    refetchOnWindowFocus: false, // Optional: disable refetch on window focus for auth data
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000,  // Garbage collect data after 10 minutes if not used
  });
};