import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import {
  Box,
  GlobalStyles,
  CssBaseline,
} from "@mui/material";
import SideBar from "./components/SideBar";
import { useAuth } from "./providers/AuthProvider";
import NotificationHandler from "./components/NotificationHandler";
import { Helmet } from "react-helmet-async";

export default function Layout() {
  const { authUser } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  // useEffect(() => {
  //   if (!authUser) {
  //     navigate("/");
  //   }
  // }, [authUser, navigate]);

  return (
    <Box>
      <Helmet>
        {/* <link rel="icon" type="image/png" href="/splash_logo_tl 2.png" /> */}
        <title>Home - Chat Application</title>
      </Helmet>
      {authUser && <NotificationHandler />}
      <CssBaseline />
      <GlobalStyles styles={{ body: { overflowX: "hidden" } }} />
      {authUser ? (
        <Box
          sx={{
            display: "flex",
          }}
        >
          <SideBar />
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Outlet />
          </Box>
        </Box>
      ) : (
        // The fallback rendering will be handled by `useEffect` via `navigate("/login")`
        <Outlet />
        
      )}
    </Box>
  );
}