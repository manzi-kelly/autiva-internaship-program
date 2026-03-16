import type { ReactNode } from "react";

type StatusBadgeProps = {
  status?: string | null;
  children?: ReactNode;
  className?: string;
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  VALID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  MEETING_REQUESTED: "bg-blue-50 text-blue-700 ring-blue-200",
  SUBMITTED: "bg-blue-50 text-blue-700 ring-blue-200",
  ASSIGNED: "bg-violet-50 text-violet-700 ring-violet-200",
  SEEN: "bg-sky-50 text-sky-700 ring-sky-200",
  CONFIRMED: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
  FAILED: "bg-rose-50 text-rose-700 ring-rose-200",
  FAILED_REVIEW: "bg-rose-50 text-rose-700 ring-rose-200",
  REVOKED: "bg-rose-50 text-rose-700 ring-rose-200",
  NOT_ELIGIBLE: "bg-slate-100 text-slate-700 ring-slate-200",
};

function humanizeStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function StatusBadge({ status, children, className = "" }: StatusBadgeProps) {
  const label = children || humanizeStatus(status || "UNKNOWN");
  const tone = STATUS_STYLES[(status || "").toUpperCase()] || "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
        tone,
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
