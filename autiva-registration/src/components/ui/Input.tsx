import React from "react";

export function Input({
  label,
  hint,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-800">{label}</span>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      <input
        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
          error ? "border-rose-400 focus:ring-2 focus:ring-rose-200" : "border-slate-200 focus:ring-2 focus:ring-slate-200"
        }`}
        {...props}
      />
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </label>
  );
}