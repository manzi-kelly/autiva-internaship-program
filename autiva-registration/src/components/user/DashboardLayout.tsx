import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../lib/apiClient";
import { getStudentSocket } from "../../lib/socket";
import { useAuth } from "../../store/auth";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

type DashboardLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadUnreadCount() {
      try {
        const res = await api.get<{ unreadCount: number }>("/notifications/me/unread-count");
        if (active) {
          setUnreadCount(Number(res.data.unreadCount || 0));
        }
      } catch {
        if (active) {
          setUnreadCount(0);
        }
      }
    }

    loadUnreadCount();
    const socket = getStudentSocket();
    const handleNotification = (payload: { userId?: string }) => {
      if (payload?.userId && payload.userId === user?.id) {
        loadUnreadCount();
      }
    };

    socket.on("notification:new", handleNotification);

    return () => {
      active = false;
      socket.off("notification:new", handleNotification);
    };
  }, [location.pathname, user?.id]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col md:flex-row">
        <Sidebar
          userName={user?.fullName}
          level={user?.level}
          onLogout={() => {
            clearAuth();
            navigate("/", { replace: true });
          }}
        />

        <div className="min-w-0 flex-1">
          <Navbar
            title={title}
            subtitle={subtitle}
            userName={user?.fullName}
            unreadCount={unreadCount}
            onNotificationsClick={() => navigate("/user/notifications")}
          />

          <main className="p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
