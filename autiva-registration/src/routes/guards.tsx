import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";

function hasDashboardAccess(status?: string | null) {
  return status === "ACTIVE";
}

/* ---------------- Require Login ---------------- */

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, tokens } = useAuth();
  const location = useLocation();

  if (!user || !tokens?.accessToken) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

/* ---------------- Require Payment ---------------- */

export function RequirePaid({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasDashboardAccess(user.status)) {
    return <Navigate to="/payment" replace />;
  }

  return <>{children}</>;
}

/* ---------------- Guest Only Home ---------------- */

export function GuestOnlyHome({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // if logged in already
  if (user) {
    if (hasDashboardAccess(user.status)) {
      return <Navigate to="/user/home" replace />;
    }

    return <Navigate to="/payment" replace />;
  }

  return <>{children}</>;
}
