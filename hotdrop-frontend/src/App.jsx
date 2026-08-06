import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Signup from './auth/Signup';
import Verify from './auth/Verify';
import VerifyLink from './auth/VerifyLink';
import Login from './auth/Login';
import Navbar from './pages/Navbar';
import CreatePost from './pages/createPost/CreatePost';
import EditUserProfile from './profile/EditUserProfile';
import FromShare from './profile/post/FromShare';
import { useAuthStore, useUIStore } from './store/useAuthStore';
import { Slide, ToastContainer } from 'react-toastify';

import AllPost from './pages/AllPost/AllPost';
import SearchPage from './pages/Search/SearchPage';

function HomePage() {
  return <AllPost />;
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
          path: '/search',
          element: <SearchPage />,
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
          path: '/user/userprofile/:hotdropId',
          element: <EditUserProfile />,
        },
        {
          path: '/posts/share/:postId',
          element: <FromShare />,
        },
        {
          path: '/posts/share-post/:postId',
          element: <FromShare />,
        },
        {
          path: '/posts/:postId',
          element: <FromShare />,
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
        autoClose={3000}
        hideProgressBar
        closeButton={false}
        theme="light"
        transition={Slide}
        style={{ zIndex: 9999999 }}
      />
    </>
  );
}

export default App;