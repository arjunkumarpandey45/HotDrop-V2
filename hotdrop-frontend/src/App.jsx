
import './App.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import  { useEffect } from 'react';
import Signup from './auth/Signup'
import Verify from './auth/Verify';
import VerifyLink from './auth/VerifyLink';
import Login from './auth/Login';
import { useAuthStore } from './store/useAuthStore';
function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const router = createBrowserRouter([
    {
      path: "/Signup",
      element: <Signup />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/auth/verify-email",
      element: <VerifyLink />,
    },
    {
      path: "/verify",
      element: <Verify />,
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
