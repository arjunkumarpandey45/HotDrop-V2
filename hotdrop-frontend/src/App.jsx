import './App.css';
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Signup from './auth/Signup';
import Verify from './auth/Verify';
import VerifyLink from './auth/VerifyLink';
import Login from './auth/Login';
import Navbar from './pages/Navbar';
import CreatePost from './pages/createPost/CreatePost';
import EditUserProfile from './profile/EditUserProfile';
import { useAuthStore, useUIStore } from './store/useAuthStore';
import { Slide, ToastContainer } from 'react-toastify';

function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 px-4 max-w-7xl mx-auto">
      {/* Feed / Home Content */}
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
  

  const { isCreatePostOpen, closeCreatePost } = useUIStore();

  
  const showNavbar = location.pathname === '/';

 
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="relative min-h-screen">
     
      {showNavbar && <Navbar />}
       
      <main className={showNavbar ? "pt-16" : ""}>
        <Outlet />
      </main>

     
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
          element: <EditUserProfile />,
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

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-center"
        autoClose={1000}
        style={{ zIndex: 999999 }} 
        hideProgressBar
        closeButton={false}
        theme="light"
        transition={Slide}
      />
    </>
  );
}

export default App;