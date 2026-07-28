
import './App.css'
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Signup from './auth/Signup';
import Verify from './auth/Verify';
import VerifyLink from './auth/VerifyLink';
import Login from './auth/Login';
import Navbar from './pages/Navbar';
import { useAuthStore } from './store/useAuthStore';

function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          <p className="mt-2 text-sm text-slate-600">Your profile page will be added here.</p>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  return (
    
      <Navbar />
      
     

  );
}

function AppLayout() {
  const location = useLocation();
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    const authPages = ['/login', '/signup', '/verify', '/auth/verify-email'];

    if (authPages.includes(location.pathname)) {
      return;
    }

    checkAuth();
  }, [checkAuth, location.pathname]);

  return <Outlet />;
}

function App() {
  const router = createBrowserRouter([
    {
      element: <AppLayout />,
      children: [
        {
          path: '/',
          element: <HomePage />,
        },
        {
          path: '/signup',
          element: <Signup />,
        },
        {
          path: '/login',
          element: <Login />,
        },
        {
          path: '/profile/me',
          element: <ProfilePage />,
        },
        {
          path: '/auth/verify-email',
          element: <VerifyLink />,
        },
        {
          path: '/verify',
          element: <Verify />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
