import { Bell, Search } from "lucide-react";

type NavbarProps = {
  title: string;
  subtitle?: string;
  userName?: string;
  unreadCount: number;
  onNotificationsClick: () => void;
};

export default function Navbar({
  title,
  subtitle,
  userName,
  unreadCount,
  onNotificationsClick,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">Student Dashboard</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            <Search className="h-4 w-4" />
            <span>Learning progress, practicals, certificates...</span>
          </div>

          <button
            type="button"
            onClick={onNotificationsClick}
            className="relative inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Account</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{userName || "Student"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
