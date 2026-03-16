import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FiUserPlus,
  FiTrendingUp,
  FiClipboard,
  FiActivity,
} from "react-icons/fi";

function StatCard({ title, value, subtitle, icon, colorClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl bg-white p-5 shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorClass}`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function ProgressRow({ label, value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{safeValue}%</span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${safeValue}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function ActivityItem({ label, value, tone }) {
  const toneMap = {
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          toneMap[tone] || "bg-slate-100 text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function LiveStatisticsDashboard() {
  const [stats, setStats] = useState({
    newRegistrations: 124,
    totalStudents: 860,
    practicalRequests: 37,
    averageProgress: 68,
    levels: [
      { label: "HTML / CSS Track", progress: 74 },
      { label: "JavaScript / Node Track", progress: 63 },
      { label: "React / Mobile App Track", progress: 58 },
    ],
    recentActivity: [
      { label: "New registrations today", value: 12, tone: "emerald" },
      { label: "Students active now", value: 48, tone: "blue" },
      { label: "Pending practical requests", value: 9, tone: "amber" },
    ],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => {
        const registrationsIncrease = Math.floor(Math.random() * 3);
        const requestChange = Math.floor(Math.random() * 2);
        const activeNow = 40 + Math.floor(Math.random() * 20);
        const avgProgressShift = Math.random() > 0.5 ? 1 : 0;

        return {
          ...prev,
          newRegistrations: prev.newRegistrations + registrationsIncrease,
          totalStudents: prev.totalStudents + registrationsIncrease,
          practicalRequests: prev.practicalRequests + requestChange,
          averageProgress: Math.min(100, prev.averageProgress + avgProgressShift),
          levels: prev.levels.map((level) => ({
            ...level,
            progress: Math.min(
              100,
              level.progress + (Math.random() > 0.7 ? 1 : 0)
            ),
          })),
          recentActivity: [
            {
              label: "New registrations today",
              value: 10 + Math.floor(Math.random() * 8),
              tone: "emerald",
            },
            {
              label: "Students active now",
              value: activeNow,
              tone: "blue",
            },
            {
              label: "Pending practical requests",
              value: 6 + Math.floor(Math.random() * 6),
              tone: "amber",
            },
          ],
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const completionStatus = useMemo(() => {
    if (stats.averageProgress >= 80) return "Excellent overall learning progress";
    if (stats.averageProgress >= 60) return "Good overall learning progress";
    return "Learning progress needs improvement";
  }, [stats.averageProgress]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="rounded-2xl bg-white p-6 shadow-lg"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Live Statistics Dashboard
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Real-time system activity for student registrations, learning
              progress, and practical training requests.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <FiActivity />
            Live updating
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="New Registrations"
          value={stats.newRegistrations}
          subtitle="Students recently added to the internship system"
          icon={<FiUserPlus className="text-xl text-emerald-700" />}
          colorClass="bg-emerald-100"
        />

        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle="All registered students across the platform"
          icon={<FiTrendingUp className="text-xl text-blue-700" />}
          colorClass="bg-blue-100"
        />

        <StatCard
          title="Average Learning Progress"
          value={`${stats.averageProgress}%`}
          subtitle={completionStatus}
          icon={<FiActivity className="text-xl text-violet-700" />}
          colorClass="bg-violet-100"
        />

        <StatCard
          title="Practical Requests"
          value={stats.practicalRequests}
          subtitle="Submitted practical training requests by users"
          icon={<FiClipboard className="text-xl text-amber-700" />}
          colorClass="bg-amber-100"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl bg-white p-6 shadow-lg"
        >
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              Learning Progress Overview
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Track how students are progressing across learning paths.
            </p>
          </div>

          <div className="space-y-5">
            {stats.levels.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <ProgressRow label={item.label} value={item.progress} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-2xl bg-white p-6 shadow-lg"
        >
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              Real-Time Activity Feed
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Snapshot of current platform engagement and requests.
            </p>
          </div>

          <div className="space-y-4">
            {stats.recentActivity.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <ActivityItem
                  label={item.label}
                  value={item.value}
                  tone={item.tone}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}