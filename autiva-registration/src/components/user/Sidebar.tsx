import {
  Bell,
  BookOpen,
  FlaskConical,
  Home,
  LogOut,
  PanelLeftOpen,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

type SidebarProps = {
  userName?: string;
  level?: string;
  onLogout: () => void;
};

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  description: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    to: "/user/home",
    icon: Home,
    description: "Overview and learning summary",
  },
  {
    label: "Learning",
    to: "/user/learning",
    icon: BookOpen,
    description: "Lessons and study progress",
  },
  {
    label: "Practical",
    to: "/user/practical",
    icon: FlaskConical,
    description: "Tasks, submissions, and reviews",
  },
  {
    label: "Notifications",
    to: "/user/notifications",
    icon: Bell,
    description: "Important updates and alerts",
  },
];

export default function Sidebar({ userName, level, onLogout }: SidebarProps) {
  return (
    <aside className="flex w-full flex-col border-b border-slate-200 bg-white px-4 py-5 shadow-sm md:min-h-screen md:w-80 md:border-b-0 md:border-r md:px-5">
      <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-700 p-5 text-white shadow-xl">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
            <PanelLeftOpen className="h-5 w-5 text-emerald-300" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-200">
              Autiva Tech
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              Student Portal
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Clean access to your learning, practice, and updates.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-base font-bold text-emerald-700 shadow-sm">
            {(userName || "S").charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Signed in as
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-950">
              {userName || "Student"}
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Level {level || "--"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Navigation
        </p>

        <nav className="mt-3 grid gap-2 md:flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "group flex items-center justify-between rounded-[1.4rem] border px-4 py-3.5 transition-all duration-200",
                    isActive
                      ? "border-emerald-200 bg-emerald-50 shadow-sm"
                      : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={[
                          "rounded-2xl p-2.5 transition",
                          isActive
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-900",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p
                          className={[
                            "text-sm font-semibold transition",
                            isActive ? "text-emerald-800" : "text-slate-900",
                          ].join(" ")}
                        >
                          {item.label}
                        </p>
                        <p
                          className={[
                            "truncate text-xs transition",
                            isActive ? "text-emerald-700/80" : "text-slate-500",
                          ].join(" ")}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      className={[
                        "h-4 w-4 shrink-0 transition",
                        isActive
                          ? "text-emerald-600"
                          : "text-slate-300 group-hover:text-slate-500",
                      ].join(" ")}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Quick note
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use the sidebar to move between your learning pages quickly and keep
          your progress organized.
        </p>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-6 flex items-center justify-center gap-3 rounded-[1.4rem] border border-rose-200 bg-gradient-to-r from-rose-50 to-white px-4 py-3.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </button>
    </aside>
  );
}
