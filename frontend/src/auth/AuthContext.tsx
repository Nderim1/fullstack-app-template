/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { JSX, ReactNode } from 'react';
import authService, { type User } from './authService';
import {
  useLoginUser,
  useSignupUser,
  useRequestMagicLink,
  useVerifyMagicLink,
  useFetchUserProfile, // This is now a useQuery hook
  type LoginCredentials,
  type SignupCredentials,
} from '../services/authAPI';
import { router } from '../routes';
import { notifications } from '@mantine/notifications';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithToken: (token: string, provider?: string) => Promise<void>;
  logout: () => void;
  signup: (credentials: SignupCredentials) => Promise<void>;
  requestMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string, email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [user, setUser] = useState<User | null>(() => authService.getUser());
  const [token, setToken] = useState<string | null>(() => authService.getToken());
  // isLoading state will be primarily driven by mutations and the profile query
  const [mutationIsLoading, setMutationIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = !!token;

  const loginMutation = useLoginUser();
  const signupMutation = useSignupUser();
  const requestMagicLinkMutation = useRequestMagicLink();
  const verifyMagicLinkMutation = useVerifyMagicLink();
  const userProfileQuery = useFetchUserProfile(token); // Pass token here

  // Effect to update authService (localStorage) when token changes
  useEffect(() => {
    authService.setToken(token);
    if (!token) {
      authService.removeUser();
      setUser(null);
      // When token is removed, we might want to reset the userProfileQuery if it's active
      // queryClient.resetQueries({ queryKey: ['userProfile', null] }); // or specific token if known
    }
  }, [token]);

  // Effect to handle user profile data from the query
  useEffect(() => {
    if (userProfileQuery.data) {
      setUser(userProfileQuery.data);
      authService.setUser(userProfileQuery.data);
      setError(null); // Clear previous errors on successful fetch
    }
  }, [userProfileQuery.data]);

  // Effect to handle errors from the user profile query
  useEffect(() => {
    if (userProfileQuery.error) {
      const errorMessage = userProfileQuery.error.message || 'Failed to fetch user profile.';
      setError(errorMessage);
      // If profile fetch fails (e.g. 401), token might be invalid, so clear it.
      // Consider more specific error checking if needed (e.g. based on error status code)
      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
        setToken(null); // This will trigger the useEffect above to clear user etc.
      } else {
        // For other errors, we might not want to log the user out immediately
        // but just show the error.
      }
    }
  }, [userProfileQuery.error]);


  const login = useCallback(async (credentials: LoginCredentials) => {
    setMutationIsLoading(true);
    setError(null);
    try {
      const data = await loginMutation.mutateAsync(credentials);
      setToken(data.accessToken);
      // The userProfileQuery effect will handle setting the user data
      // This ensures we always have the most up-to-date user data
      router.navigate({ to: '/' });
    } catch (err: Error | any) {
      const errorMessage = err.message || 'Login failed.';
      setError(errorMessage);
      setToken(null);
      setUser(null);
      authService.removeUser();
      throw new Error(errorMessage);
    } finally {
      setMutationIsLoading(false);
    }
  }, [loginMutation]);

  const loginWithToken = useCallback(async (tokenToSet: string, provider?: string) => {
    setError(null);
    setMutationIsLoading(true); // Indicate loading while token is processed
    try {
      setToken(tokenToSet); // This triggers useEffect to store token & userProfileQuery to fetch user
      console.log(`Token set for ${provider || 'OAuth'}. User profile will be fetched.`);
      // The userProfileQuery useEffects will handle setting user or error
    } catch (err: Error | any) {
      setError(err.message || `Failed to login with ${provider || 'token'}.`);
      setToken(null);
      setUser(null);
      authService.removeUser();
      throw err;
    } finally {
      setMutationIsLoading(false); // Stop loading indicator
    }
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    setMutationIsLoading(true);
    setError(null);
    try {
      const data = await signupMutation.mutateAsync(credentials);
      setToken(data.accessToken);
      // The userProfileQuery effect will handle setting the user data
      // This ensures we always have the most up-to-date user data
      router.navigate({ to: '/' });
    } catch (err: Error | any) {
      const errorMessage = err.message || 'Signup failed.';
      setError(errorMessage);
      setToken(null);
      setUser(null);
      authService.removeUser();
      throw new Error(errorMessage);
    } finally {
      setMutationIsLoading(false);
    }
  }, [signupMutation]);

  const requestMagicLink = useCallback(async (email: string) => {
    setMutationIsLoading(true);
    setError(null);
    try {
      await requestMagicLinkMutation.mutateAsync({ email });
      notifications.show({
        title: 'Magic Link Sent',
        message: 'If your email is registered, you will receive a magic link shortly.',
        color: 'green',
      });
    } catch (err: Error | any) {
      setError(err.message || 'Failed to send magic link.');
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to send magic link.',
        color: 'red',
      });
    } finally {
      setMutationIsLoading(false);
    }
  }, [requestMagicLinkMutation]);

  const verifyMagicLink = useCallback(async (magicToken: string, email: string) => {
    setMutationIsLoading(true);
    setError(null);
    try {
      const data = await verifyMagicLinkMutation.mutateAsync({ token: magicToken, email });
      setToken(data.accessToken);
      // The userProfileQuery effect will handle setting the user data
      // This ensures we always have the most up-to-date user data
      notifications.show({
        title: 'Login Successful',
        message: 'You have been logged in with the magic link.',
        color: 'green',
      });
      router.navigate({ to: '/' });
    } catch (err: Error | any) {
      const errorMessage = err.message || 'Magic link verification failed.';
      setError(errorMessage);
      setToken(null);
      setUser(null);
      authService.removeUser();
      notifications.show({
        title: 'Verification Failed',
        message: errorMessage,
        color: 'red',
      });
      throw new Error(errorMessage);
    } finally {
      setMutationIsLoading(false);
    }
  }, [verifyMagicLinkMutation]);

  const logout = useCallback(() => {
    setToken(null); // This triggers useEffect to clear user and authService token/user
    // userProfileQuery will become disabled due to token being null
    // queryClient.resetQueries({ queryKey: ['userProfile'] }); // Optionally reset query state explicitly
    router.navigate({ to: '/auth/login' });
    notifications.show({
      title: 'Logged Out',
      message: 'You have been successfully logged out.',
      color: 'blue',
    });
    setError(null);
  }, []);

  const overallIsLoading = useMemo(() =>
    mutationIsLoading ||
    loginMutation.isPending ||
    signupMutation.isPending ||
    requestMagicLinkMutation.isPending ||
    verifyMagicLinkMutation.isPending ||
    userProfileQuery.isLoading ||
    userProfileQuery.isFetching, // Consider isFetching as well for background updates
    [mutationIsLoading, loginMutation.isPending, signupMutation.isPending, requestMagicLinkMutation.isPending, verifyMagicLinkMutation.isPending, userProfileQuery.isLoading, userProfileQuery.isFetching]
  );

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      isLoading: overallIsLoading,
      error,
      login,
      loginWithToken,
      logout,
      signup,
      requestMagicLink,
      verifyMagicLink,
    }),
    [token, user, isAuthenticated, overallIsLoading, error, login, loginWithToken, logout, signup, requestMagicLink, verifyMagicLink],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
