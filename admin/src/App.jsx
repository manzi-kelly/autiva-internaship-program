import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AdminLogin from "./pages/AdminLogin";
import DashboardHome from "./pages/DashboardHome";
import PaymentsPage from "./pages/PaymentsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import CertificateRequestsPage from "./pages/CertificateRequestsPage";
import PracticalLayout from "./pages/practicals/PracticalLayout";
import PendingRequestsPage from "./pages/practicals/PendingRequestsPage";
import AssignedPracticalsPage from "./pages/practicals/AssignedPracticalsPage";
import ReviewQueuePage from "./pages/practicals/ReviewQueuePage";
import { isAdminLoggedIn, logoutAdmin } from "./utils/auth";
import { getDashboardOverview } from "./lib/api";
import { getAdminSocket } from "./lib/socket";

export default function App() {
  const location = useLocation();
  const [loggedIn, setLoggedIn] = useState(isAdminLoggedIn());
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    if (!loggedIn) return;

    async function loadOverview() {
      try {
        const res = await getDashboardOverview();
        setDashboardData(res);
      } catch {
        setDashboardData(null);
      }
    }

    loadOverview();

    const socket = getAdminSocket();
    const handleRealtimeRefresh = () => loadOverview();
    socket.on("activity:new", handleRealtimeRefresh);

    return () => {
      socket.off("activity:new", handleRealtimeRefresh);
    };
  }, [loggedIn]);

  function handleLoginSuccess() {
    setLoggedIn(true);
  }

  function handleLogout() {
    logoutAdmin();
    setLoggedIn(false);
  }

  if (!loggedIn) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith("/admin/payments")) return "Payments";
    if (location.pathname.startsWith("/admin/users")) return "Registered Users";
    if (location.pathname.startsWith("/admin/certificates")) return "Certificate Requests";
    if (location.pathname.startsWith("/admin/practicals/assigned")) return "Assigned Practicals";
    if (location.pathname.startsWith("/admin/practicals/reviews")) return "Review Queue";
    if (location.pathname.startsWith("/admin/practicals")) return "Practical Requests";
    if (location.pathname.startsWith("/admin/settings")) return "Settings";
    return "Dashboard";
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className="hidden lg:block">
        <Sidebar
          onLogout={handleLogout}
          stats={{
            payments: dashboardData?.summary?.pendingPaymentApprovals ?? 0,
            users: dashboardData?.summary?.totalUsers ?? 0,
            requests: dashboardData?.summary?.pendingPracticalRequests ?? 0,
            certificates: dashboardData?.summary?.pendingCertificateApprovals ?? 0,
          }}
        />
      </div>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Header title={pageTitle} totalMoney={dashboardData?.summary?.totalRevenue ?? 0} />

        <div className="mb-6 lg:hidden">
          <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-lg">
            {[
              ["/admin", "Dashboard"],
              ["/admin/payments", "Payments"],
              ["/admin/users", "Users"],
              ["/admin/certificates", "Certificates"],
              ["/admin/practicals/requests", "Requests"],
              ["/admin/settings", "Settings"],
            ].map(([path, label]) => (
              <Link
                key={path}
                to={path}
                className={`rounded-xl px-4 py-2 text-sm font-medium ${
                  location.pathname === path
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {label}
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        <Routes>
          <Route path="/admin" element={<DashboardHome dashboardData={dashboardData} />} />
          <Route path="/admin/payments" element={<PaymentsPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/certificates" element={<CertificateRequestsPage />} />
          <Route path="/admin/practicals" element={<PracticalLayout />}>
            <Route index element={<Navigate to="requests" replace />} />
            <Route path="requests" element={<PendingRequestsPage />} />
            <Route path="assigned" element={<AssignedPracticalsPage />} />
            <Route path="reviews" element={<ReviewQueuePage />} />
          </Route>
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
