import './App.css';
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Signup from './auth/Signup';
import Verify from './auth/Verify';
import VerifyLink from './auth/VerifyLink';
import Login from './auth/Login';
import Navbar from './pages/Navbar';
import CreatePost from './pages/createPost/CreatePost';// Added CreatePost component
import { useAuthStore,useUIStore } from './store/useAuthStore';
import { Slide, ToastContainer } from 'react-toastify';


function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24">
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
    <div className="min-h-screen bg-slate-50 pt-24 px-4 max-w-7xl mx-auto">
      {/* Feed or Home Content goes here */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Explore Feed</h1>
        <p className="mt-2 text-sm text-slate-600">Live project drops will appear here.</p>
      </div>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  
  // UI store for CreatePost Modal
  const { isCreatePostOpen, closeCreatePost } = useUIStore();

  useEffect(() => {
    const authPages = ['/login', '/signup', '/verify', '/auth/verify-email'];

    if (authPages.includes(location.pathname)) {
      return;
    }

    checkAuth();
  }, [checkAuth, location.pathname]);

  const isAuthPage = ['/login', '/signup', '/verify', '/auth/verify-email'].includes(location.pathname);

  return (
    <div className="relative min-h-screen">
      {/* Show Navbar on non-auth routes */}
      {!isAuthPage && <Navbar />}
      
      {/* Route Content */}
      <main>
        <Outlet />
      </main>

      {/* Global Create Post Modal */}
      <CreatePost isOpen={isCreatePostOpen} onClose={closeCreatePost} />
    </div>
  );
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

  return <>
  <RouterProvider router={router} />
  <ToastContainer
        position="top-center"
        autoClose={1000}
        style={{ zIndex: 999999 }} 
        hideProgressBar
        closeButton={false}
        theme="light"
        transition={Slide}
      /></>;
}

export default App;