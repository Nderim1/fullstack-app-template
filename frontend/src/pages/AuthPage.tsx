import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Container,
  Stack,
  Tabs,
  Alert,
  Center,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { FaExclamationCircle, FaGoogle, FaGithub } from 'react-icons/fa'; // Using Font Awesome from react-icons
import { useAuth } from '../auth/AuthContext';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type JSX } from 'react';
import { authRoute } from '../routes'; // Import authRoute

// Define a type for the search params we expect for magic link verification
interface MagicLinkSearch {
  magicLinkToken?: string;
  email?: string;
  magicLink?: string; // To trigger magic link tab/view
  redirect?: string; // Added redirect here as useSearch will be typed with this
}

const AuthPage = (): JSX.Element => {
  const {
    login,
    signup,
    requestMagicLink,
    verifyMagicLink,
    isLoading,
    error,
    isAuthenticated, // Use isAuthenticated instead of token
  } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>('login');
  const navigate = useNavigate(); // Initialize useNavigate

  // Get search params for magic link verification and general redirect
  const searchParams = useSearch({ from: authRoute.id }) as MagicLinkSearch; // Explicitly use authRoute.id
  const { magicLinkToken, email: emailFromUrl, magicLink: showMagicLinkTab, redirect: redirectUrl } = searchParams;

  const loginForm = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) =>
        value.length < 6
          ? 'Password should be at least 6 characters long'
          : null,
    },
  });

  const signupForm = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Name is required'),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) =>
        value.length < 6
          ? 'Password should be at least 6 characters long'
          : null,
    },
  });

  const magicLinkForm = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  useEffect(() => {
    if (magicLinkToken && emailFromUrl) {
      setActiveTab('magic-link-verify');
      verifyMagicLink(emailFromUrl, magicLinkToken);
    }
  }, [magicLinkToken, emailFromUrl, verifyMagicLink]);

  useEffect(() => {
    if (showMagicLinkTab) {
      setActiveTab('magic-link');
    }
  }, [showMagicLinkTab]);

  useEffect(() => {
    if (isAuthenticated && !isLoading && activeTab !== 'magic-link-verify') {
      navigate({ to: redirectUrl || '/', replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectUrl, activeTab]);

  const handleLogin = async (values: typeof loginForm.values) => {
    await login({ email: values.email, password: values.password });
    // Navigation will be handled if login is successful and error is null
    // Check for error state from useAuth after login attempt
  };

  const handleSignup = async (values: typeof signupForm.values) => {
    await signup({ email: values.email, password: values.password, name: values.name });
  };

  const handleMagicLinkRequest = async (values: typeof magicLinkForm.values) => {
    await requestMagicLink(values.email);
    // Optionally clear form or give more specific feedback if needed
    // magicLinkForm.reset(); // if you want to clear the form after submission
  };

  if (isAuthenticated && activeTab !== 'magic-link-verify') {
    // Avoid rendering the form if already authenticated and not in verification step
    // The useEffect above will handle redirection
    return (
      <Container size={420} my={40}>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <Title order={2} ta="center">
            Already logged in!
          </Title>
          <Text ta="center" mt="md">
            Redirecting you to the application...
          </Text>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center">
        {activeTab === 'login' ? 'Welcome back!' : activeTab === 'signup' ? 'Create an account' : 'Magic Link'}
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        {activeTab === 'login'
          ? 'Do not have an account yet? '
          : activeTab === 'signup'
            ? 'Already have an account? '
            : 'Enter your email to receive a magic link to sign in or create an account.'}
        <Text
          component="a"
          href="#"
          onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : activeTab === 'signup' ? 'login' : 'login')}
          size="sm"
        >
          {activeTab === 'login' ? 'Create account' : activeTab === 'signup' ? 'Sign in' : 'Sign in'}
        </Text>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {error && activeTab !== 'magic-link-verify' && (
          <Alert title="Authentication Error" color="red" withCloseButton onClose={() => console.log('alert closed')} mt="md">
            {error}
          </Alert>
        )}
        <Tabs value={activeTab} onChange={setActiveTab} variant="pills">
          <Tabs.List grow>
            <Tabs.Tab value="login">Login</Tabs.Tab>
            <Tabs.Tab value="signup">Sign Up</Tabs.Tab>
            <Tabs.Tab value="magic-link">Magic Link</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="login" pt="md">
            <form onSubmit={loginForm.onSubmit(handleLogin)}>
              <TextInput
                label="Email"
                placeholder="you@mantine.dev"
                required
                value={loginForm.values.email}
                onChange={(event) => loginForm.setFieldValue('email', event.currentTarget.value)}
                error={loginForm.errors.email}
                radius="md"
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                required
                mt="md"
                value={loginForm.values.password}
                onChange={(event) => loginForm.setFieldValue('password', event.currentTarget.value)}
                error={loginForm.errors.password}
                radius="md"
              />
              <Button type="submit" fullWidth mt="xl" radius="md" loading={isLoading}>
                Sign in
              </Button>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="signup" pt="md">
            <form onSubmit={signupForm.onSubmit(handleSignup)}>
              <Stack>
                <TextInput
                  required
                  label="Name"
                  placeholder="Your Name"
                  value={signupForm.values.name}
                  onChange={(event) => signupForm.setFieldValue('name', event.currentTarget.value)}
                  error={signupForm.errors.name}
                  radius="md"
                />
                <TextInput
                  required
                  label="Email"
                  placeholder="hello@mantine.dev"
                  value={signupForm.values.email}
                  onChange={(event) => signupForm.setFieldValue('email', event.currentTarget.value)}
                  error={signupForm.errors.email}
                  radius="md"
                />
                <PasswordInput
                  required
                  label="Password"
                  placeholder="Your password"
                  value={signupForm.values.password}
                  onChange={(event) => signupForm.setFieldValue('password', event.currentTarget.value)}
                  error={signupForm.errors.password}
                  mt="md"
                  radius="md"
                />
                <Button type="submit" loading={isLoading} fullWidth radius="md" mt="xl">
                  Sign Up
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="magic-link" pt="md">
            <Text size="sm" ta="center" mb="md">
              Enter your email to receive a magic link to sign in or create an account.
            </Text>
            <form onSubmit={magicLinkForm.onSubmit(handleMagicLinkRequest)}>
              <Stack>
                <TextInput
                  required
                  label="Email"
                  placeholder="hello@mantine.dev"
                  value={magicLinkForm.values.email}
                  onChange={(event) => magicLinkForm.setFieldValue('email', event.currentTarget.value)}
                  error={magicLinkForm.errors.email}
                  radius="md"
                />
                <Button type="submit" loading={isLoading} fullWidth radius="md" mt="xl">
                  Send Magic Link
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="magic-link-verify" pt="md">
            <Center>
              <Stack align="center">
                <Title order={3}>Verifying Magic Link...</Title>
                <Text>Please wait while we verify your magic link.</Text>
                {isLoading && <Text>Loading...</Text>}
                {error && (
                  <Alert title="Verification Failed" color="red" icon={<FaExclamationCircle />}>
                    {error}. You can try requesting a new one.
                  </Alert>
                )}
              </Stack>
            </Center>
          </Tabs.Panel>

        </Tabs>

        <Divider label="Or continue with" labelPosition="center" my="lg" />

        <Stack>
          <Button
            fullWidth
            variant="default"
            mt="xs"
            leftSection={<FaGoogle />}
            disabled={isLoading} // You might want separate loading states or disable based on specific provider logic
            onClick={() => {
              // Redirect to backend Google OAuth endpoint
              window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
            }}
          >
            Google
          </Button>
          <Button
            fullWidth
            variant="default"
            mt="xs"
            leftSection={<FaGithub />}
            disabled={isLoading}
            onClick={() => {
              // Redirect to backend GitHub OAuth endpoint
              window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`;
            }}
          >
            GitHub
          </Button>
        </Stack>

      </Paper>
    </Container>
  );
}

export default AuthPage;