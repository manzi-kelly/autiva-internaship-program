import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiCreditCard,
  FiUsers,
  FiClipboard,
  FiSettings,
  FiLogOut,
  FiChevronRight,
  FiActivity,
  FiFileText,
  FiSend,
  FiCheckSquare,
  FiAward,
} from "react-icons/fi";

export default function Sidebar({ onLogout, stats = {} }) {
  const menuItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: FiGrid,
      hint: "Overview",
      to: "/admin",
    },
    {
      key: "payments",
      label: "Payments",
      icon: FiCreditCard,
      hint: "Transactions",
      to: "/admin/payments",
      count: stats.payments,
    },
    {
      key: "users",
      label: "Registered Users",
      icon: FiUsers,
      hint: "All trainees",
      to: "/admin/users",
      count: stats.users,
    },
    {
      key: "certificates",
      label: "Certificates",
      icon: FiAward,
      hint: "Approval requests",
      to: "/admin/certificates",
      count: stats.certificates,
    },
  ];

  const practicalItems = [
    {
      key: "practical-requests",
      label: "Pending Requests",
      icon: FiFileText,
      hint: "Practical requests",
      to: "/admin/practicals/requests",
      count: stats.requests,
    },
    {
      key: "practical-assigned",
      label: "Assigned Practicals",
      icon: FiSend,
      hint: "Send practical tasks",
      to: "/admin/practicals/assigned",
    },
    {
      key: "practical-reviews",
      label: "Review Queue",
      icon: FiCheckSquare,
      hint: "Review submissions",
      to: "/admin/practicals/reviews",
    },
  ];

  const bottomItems = [
    {
      key: "settings",
      label: "Settings",
      icon: FiSettings,
      hint: "System config",
      to: "/admin/settings",
    },
  ];

  const navClass = ({ isActive }) =>
    `group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-4 py-3.5 text-left transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-900/20"
        : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;

  const NavItem = ({ item }) => {
    const Icon = item.icon;

    return (
      <NavLink to={item.to} className={navClass}>
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-white/80" />
            )}

            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg transition ${
                isActive
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white"
              }`}
            >
              <Icon />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.label}</p>
              <p
                className={`truncate text-xs ${
                  isActive
                    ? "text-white/75"
                    : "text-slate-500 group-hover:text-slate-400"
                }`}
              >
                {item.hint}
              </p>
            </div>

            {typeof item.count !== "undefined" && item.count !== null && (
              <span
                className={`inline-flex min-w-[34px] items-center justify-center rounded-full px-2 py-1 text-xs font-semibold ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "bg-slate-800 text-slate-300 group-hover:bg-slate-700"
                }`}
              >
                {item.count}
              </span>
            )}

            <FiChevronRight
              className={`text-sm transition ${
                isActive
                  ? "translate-x-0 text-white/80"
                  : "text-slate-600 group-hover:translate-x-0.5 group-hover:text-slate-400"
              }`}
            />
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside className="flex h-screen w-80 flex-col border-r border-white/10 bg-slate-950 text-white">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl font-extrabold text-white shadow-lg shadow-emerald-900/30">
            A
            <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight">
              Autiva Tech
            </h1>
            <p className="text-sm text-slate-400">Internship Admin Panel</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <FiActivity />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">System Status</p>
              <p className="text-xs text-slate-400">All services running</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div>
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Main Menu
          </p>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <NavItem key={item.key} item={item} />
            ))}
          </nav>
        </div>

        <div className="mt-8">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Practicals
          </p>

          <nav className="space-y-2">
            {practicalItems.map((item) => (
              <NavItem key={item.key} item={item} />
            ))}
          </nav>
        </div>

        <div className="mt-8">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Preferences
          </p>

          <div className="space-y-2">
            {bottomItems.map((item) => (
              <NavItem key={item.key} item={item} />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4">
        <button
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-2xl border border-red-500/10 bg-red-500/5 px-4 py-3.5 text-left text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-lg text-red-300 transition group-hover:bg-red-500/15">
            <FiLogOut />
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold">Logout</p>
            <p className="text-xs text-red-300/70">Sign out from admin</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
