import React from "react";

export function Select({
  label,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <select
        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
          error ? "border-rose-400 focus:ring-2 focus:ring-rose-200" : "border-slate-200 focus:ring-2 focus:ring-slate-200"
        }`}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </label>
  );
}