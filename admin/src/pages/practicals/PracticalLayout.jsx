import { NavLink, Outlet } from "react-router-dom";

function linkClass({ isActive }) {
  return `rounded-xl px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-emerald-600 text-white"
      : "bg-white text-slate-700 hover:bg-slate-100"
  }`;
}

export default function PracticalLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Practical Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage requests, assigned practicals, and review queue.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <NavLink to="requests" className={linkClass}>
          Pending Requests
        </NavLink>
        <NavLink to="assigned" className={linkClass}>
          Assigned Practicals
        </NavLink>
        <NavLink to="reviews" className={linkClass}>
          Review Queue
        </NavLink>
      </div>

      <Outlet />
    </div>
  );
}