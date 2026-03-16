import React from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import Auth from "../pages/Auth";
import Payment from "../pages/payment";
import HomePage from "../pagesUser/HomePage";
import LearningPage from "../pagesUser/LearningPage";
import PracticalPage from "../pagesUser/PracticalPage";
import NotificationsPage from "../pagesUser/NotificationsPage";
import { GuestOnlyHome, RequireAuth, RequirePaid } from "../routes/guards";

function protectedUserPage(element: React.ReactElement) {
  return (
    <RequireAuth>
      <RequirePaid>{element}</RequirePaid>
    </RequireAuth>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <GuestOnlyHome>
        <Home />
      </GuestOnlyHome>
    ),
  },
  { path: "/auth", element: <Auth /> },
  {
    path: "/payment",
    element: (
      <RequireAuth>
        <Payment />
      </RequireAuth>
    ),
  },
  { path: "/user", element: protectedUserPage(<Navigate to="/user/home" replace />) },
  { path: "/user/home", element: protectedUserPage(<HomePage />) },
  { path: "/user/learning", element: protectedUserPage(<LearningPage />) },
  { path: "/user/practical", element: protectedUserPage(<PracticalPage />) },
  { path: "/user/notifications", element: protectedUserPage(<NotificationsPage />) },
  { path: "/dashboard", element: protectedUserPage(<Navigate to="/user/home" replace />) },
]);
