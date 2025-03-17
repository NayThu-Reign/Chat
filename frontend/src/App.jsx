// src/App.jsx
// import React, { useState, useEffect } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import Conversation from './pages/Conversation';
import AuthProvider from './providers/AuthProvider';
import ProtectedRouteProvider from './providers/ProtectedRouteProvider';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateChat from './pages/CreateChat';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { useMediaQuery } from '@mui/material';
import MobileLayout from './MobileLayout';
import MobileSideBar from './pages/MobileSideBar';
// import { HelmetProvider } from 'react-helmet-async';
import { HelmetProvider } from 'react-helmet-async'



const App = () => {

  const isMobileOrTablet = useMediaQuery("(max-width: 950px)");
  
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
      <AuthProvider>
        {isMobileOrTablet ? <MobileLayout /> : <Layout />}
      </AuthProvider>
      ),
      children: [
        isMobileOrTablet && {
          path: "/",
          element: (
            <ProtectedRouteProvider>
              <MobileSideBar />
            </ProtectedRouteProvider>
          )
        },
        {
          path: "/forgot-password",
          element: (
            <ForgotPassword />
          )
        },
        {
          path: "/reset-password",
          element: (
            <ResetPassword />
          )
        },
        {
          path: "/conversation",
          element: (
            <ProtectedRouteProvider>
              <Conversation />
            </ProtectedRouteProvider>
          )
        },
        // {
        //   path: "/login",
        //   element: (
            
        //     <Login />
           
        //   )
        // },
        {
          path: "/register",
          element: (
            <Register />
          )
        },
        {
          path: "/users/:id",
          element: (
            <ProtectedRouteProvider>
              <CreateChat />
            </ProtectedRouteProvider>
          )
        },
        
      ]
    },
  ]);

  return (
      
        

      <HelmetProvider>
          <RouterProvider router={router} />
      </HelmetProvider>
      
  );
};


export default App;

