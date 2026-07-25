
import './App.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Signup from './auth/Signup'

function App() {

  const router = createBrowserRouter([{
    path: "/Signup",
    element: (
      <>
        <Signup></Signup>
      </>
    ),
  }])
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
