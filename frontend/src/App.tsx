import { Outlet, Link } from '@tanstack/react-router';
import { Button as MantineButton } from '@mantine/core';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold hover:text-gray-300">
            MyApp
          </Link>
          <div className="space-x-4">
            <MantineButton component={Link} to="/auth/login" variant="light" size="xs">
              Login
            </MantineButton>
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto p-4">
        <Outlet /> {/* This is where child routes will be rendered */}
      </main>

      <footer className="bg-gray-200 text-center p-4 mt-auto">
        <p>&copy; {new Date().getFullYear()} Fullstack Template. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
