import React, { useEffect } from 'react';
import { useNavigate, useSearch, useParams } from '@tanstack/react-router'; 
import { useAuth } from '../auth/AuthContext';
import { notifications } from '@mantine/notifications';
import { Loader, Center, Text, Paper, Title, Alert } from '@mantine/core';
import { authCallbackRoute } from '../routes'; 

const AuthCallbackPage: React.FC = () => {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const { token, error: queryError, redirect } = useSearch({ from: authCallbackRoute.id });
  const { provider } = useParams({ from: authCallbackRoute.id }); 

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (queryError) {
        notifications.show({
          title: 'Authentication Error',
          message: `Failed to authenticate with ${provider || 'provider'}: ${queryError}`,
          color: 'red',
        });
        navigate({ to: redirect || '/auth/login', replace: true });
        return;
      }

      if (token) {
        try {
          await loginWithToken(token, provider);
          notifications.show({
            title: 'Login Successful',
            message: `Successfully logged in with ${provider || 'your account'}.`,
            color: 'green',
          });
          navigate({ to: redirect || '/', replace: true });
        } catch (e: unknown) { 
          let errorMessage = `An error occurred during login with ${provider || 'provider'}.`;
          if (e instanceof Error) {
            errorMessage = e.message;
          } else if (typeof e === 'string') {
            errorMessage = e;
          } else if (e && typeof (e as { message?: unknown }).message === 'string') {
            // Check if e is an object and has a string message property
            errorMessage = (e as { message: string }).message;
          }
          notifications.show({
            title: 'Login Failed',
            message: errorMessage, // Use the extracted error message
            color: 'red',
          });
          navigate({ to: redirect || '/auth/login', replace: true });
        }
      } else if (!queryError) {
        notifications.show({
          title: 'Authentication Issue',
          message: 'No token or error received from authentication provider.',
          color: 'orange',
        });
        navigate({ to: redirect || '/auth/login', replace: true });
      }
    };

    handleAuthCallback();
  }, [token, queryError, loginWithToken, navigate, redirect, provider]);

  if (queryError) {
    return (
      <Center style={{ height: '100vh' }}>
        <Paper p="xl" shadow="xs" withBorder>
          <Title order={3} ta="center" mb="md">
            Authentication Failed
          </Title>
          <Alert title="Error!" color="red" variant="light"> 
            {`Failed to authenticate with ${provider || 'provider'}: ${queryError}`}
          </Alert>
          <Text c="dimmed" size="sm" ta="center" mt="md">
            Redirecting you back...
          </Text>
        </Paper>
      </Center>
    );
  }

  return (
    <Center style={{ height: '100vh' }}>
      <Paper p="xl" shadow="xs" withBorder>
        <Title order={3} ta="center" mb="md">
          Processing Authentication
        </Title>
        <Center>
          <Loader />
        </Center>
        <Text c="dimmed" size="sm" ta="center" mt="md">
          Please wait while we securely log you in...
        </Text>
      </Paper>
    </Center>
  );
};

export default AuthCallbackPage;
