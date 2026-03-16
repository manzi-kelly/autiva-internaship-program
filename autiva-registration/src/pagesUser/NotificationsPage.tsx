import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, ChevronRight, Clock3 } from "lucide-react";
import { api } from "../lib/apiClient";
import { getStudentSocket } from "../lib/socket";
import { useAuth } from "../store/auth";
import DashboardLayout from "../components/user/DashboardLayout";
import StatusBadge from "../components/user/StatusBadge";
import { formatDateTime, getNotificationTarget, type UserNotification } from "../lib/userDashboard";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        const res = await api.get<{ notifications: UserNotification[] }>("/notifications/me");
        if (!cancelled) {
          setNotifications(res.data.notifications || []);
        }
      } catch {
        if (!cancelled) {
          setNotifications([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNotifications();
    const socket = getStudentSocket();
    const handleNotification = (payload: { userId?: string; notification?: UserNotification }) => {
      if (payload?.userId === user?.id && payload.notification) {
        setNotifications((current) => [payload.notification as UserNotification, ...current]);
      }
    };

    socket.on("notification:new", handleNotification);
    return () => {
      cancelled = true;
      socket.off("notification:new", handleNotification);
    };
  }, [user?.id]);

  async function openNotification(notification: UserNotification) {
    if (!notification.isRead) {
      try {
        await api.patch(`/notifications/${notification.id}/read`);
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
        );
      } catch {
        // Keep navigation working even if marking as read fails.
      }
    }

    navigate(getNotificationTarget(notification));
  }

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);

  return (
    <DashboardLayout
      title="Notifications"
      subtitle="Open admin updates, mark them as read automatically, and jump straight to the related page."
    >
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-700 p-6 text-white shadow-xl lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-200">Inbox</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">Stay updated in real time</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 lg:text-base">
                Admin updates, practical changes, certificate decisions, and score notifications appear here the moment they are sent.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-200">Total</p>
                <p className="mt-2 text-2xl font-bold">{notifications.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-200">Unread</p>
                <p className="mt-2 text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">Loading notifications...</div>
          ) : notifications.length ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={[
                    "flex w-full items-start gap-4 rounded-3xl border p-5 text-left transition",
                    notification.isRead
                      ? "border-slate-200 bg-white hover:bg-slate-50"
                      : "border-emerald-200 bg-emerald-50/70 shadow-sm hover:bg-emerald-50",
                  ].join(" ")}
                >
                  <div className={`rounded-2xl p-3 ${notification.isRead ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}>
                    {notification.isRead ? <CheckCircle2 className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-base font-semibold text-slate-950">{notification.title}</h2>
                          <StatusBadge status={notification.isRead ? "ACTIVE" : "PENDING"}>{notification.isRead ? "Read" : "Unread"}</StatusBadge>
                          <StatusBadge status={notification.type}>{notification.type}</StatusBadge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{notification.message}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Clock3 className="h-4 w-4" />
                        <span>{formatDateTime(notification.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-slate-400" />
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Bell className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">No notifications yet</h2>
              <p className="mt-2 text-sm text-slate-600">When admin sends an update about practical work, scores, payments, or certificates, it will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
