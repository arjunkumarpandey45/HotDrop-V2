
import './App.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Signup from './auth/Signup'
import Verify from './auth/Verify';
import VerifyLink from './auth/VerifyLink';

function App() {

  const router = createBrowserRouter([
    {
      path: "/Signup",
      element: (
        <>
          <Signup></Signup>
        </>
      ),
    },
    {
      path: "/auth/verify-email",
      element: (
        <>
          <VerifyLink></VerifyLink>
        </>
      ),
    },
    {
      path: "/verify",
      element: (
        <>
          <Verify></Verify>
        </>
      ),
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
