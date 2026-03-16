import StatCard from "../components/StatCard.jsx";

function MiniBar({ label, value, total, colorClass }) {
  const width = total ? Math.max(6, Math.round((value / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-3 rounded-full bg-slate-100">
        <div className={`h-3 rounded-full ${colorClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function DashboardHome({ dashboardData }) {
  const summary = dashboardData?.summary || {};
  const latest = dashboardData?.latest || {};
  const activityFeed = dashboardData?.activityFeed || [];
  const totalUsers = summary.totalUsers || 0;
  const byLevel = summary.studentsByLevel || { L3: 0, L4: 0, L5: 0 };
  const completionRate = summary.activePracticalTasks
    ? Math.round(((summary.completedPracticals || 0) / summary.activePracticalTasks) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Users" value={summary.totalUsers || 0} subtitle={`New today: ${summary.newUsersToday || 0}`} />
        <StatCard title="Total Payments" value={summary.totalPayments || 0} subtitle={`Pending approval: ${summary.pendingPaymentApprovals || 0}`} />
        <StatCard title="Pending Requests" value={summary.pendingPracticalRequests || 0} subtitle={`Accepted: ${summary.acceptedRequests || 0}`} />
        <StatCard title="Practical Tasks Active" value={summary.activePracticalTasks || 0} subtitle={`Completed: ${summary.completedPracticals || 0}`} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Certificates Issued" value={summary.certificatesIssued || 0} subtitle={`Pending approval: ${summary.pendingCertificateApprovals || 0}`} />
        <StatCard title="Pending Reviews" value={summary.pendingReviews || 0} subtitle={`Failed practicals: ${summary.failedPracticals || 0}`} />
        <StatCard title="Internship Ready" value={(dashboardData?.internshipCandidates || []).length} subtitle="Top candidates now" />
        <StatCard title="New Users This Week" value={summary.newUsersThisWeek || 0} subtitle={`Active students: ${summary.activeStudents || 0}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <h3 className="text-lg font-bold text-slate-900">Users by Level</h3>
          <p className="mt-1 text-sm text-slate-500">Distribution of registered students.</p>
          <div className="mt-6 space-y-4">
            <MiniBar label="L3" value={byLevel.L3 || 0} total={totalUsers} colorClass="bg-emerald-500" />
            <MiniBar label="L4" value={byLevel.L4 || 0} total={totalUsers} colorClass="bg-blue-500" />
            <MiniBar label="L5" value={byLevel.L5 || 0} total={totalUsers} colorClass="bg-violet-500" />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <h3 className="text-lg font-bold text-slate-900">Payment Trends</h3>
          <p className="mt-1 text-sm text-slate-500">Revenue and payment approval overview.</p>
          <div className="mt-6 space-y-4">
            <MiniBar label="Revenue (RWF)" value={summary.totalRevenue || 0} total={Math.max(summary.totalRevenue || 1, 1)} colorClass="bg-emerald-500" />
            <MiniBar label="Payments Today" value={summary.paymentsToday || 0} total={Math.max(summary.totalPayments || 1, 1)} colorClass="bg-amber-500" />
            <MiniBar label="Pending Approval" value={summary.pendingPaymentApprovals || 0} total={Math.max(summary.totalPayments || 1, 1)} colorClass="bg-rose-500" />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <h3 className="text-lg font-bold text-slate-900">Practical Completion Rate</h3>
          <p className="mt-1 text-sm text-slate-500">Current practical execution across the platform.</p>
          <div className="mt-6 space-y-4">
            <MiniBar label="Students Learning" value={summary.studentsLearning || 0} total={Math.max(summary.totalUsers || 1, 1)} colorClass="bg-blue-500" />
            <MiniBar label="Doing Practical" value={summary.studentsDoingPractical || 0} total={Math.max(summary.totalUsers || 1, 1)} colorClass="bg-violet-500" />
            <MiniBar label="Completed Practicals" value={summary.studentsCompletedPracticals || 0} total={Math.max(summary.totalUsers || 1, 1)} colorClass="bg-emerald-500" />
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            Completion rate: {completionRate}%
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <h3 className="text-lg font-bold text-slate-900">Live Activity Feed</h3>
          <p className="mt-1 text-sm text-slate-500">Recent actions across registration, payments, and practicals.</p>
          <div className="mt-6 space-y-3">
            {activityFeed.length ? activityFeed.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-sm font-medium text-slate-800">{item.message}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                </div>
              </div>
            )) : (
              <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No recent activity yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <h3 className="text-lg font-bold text-slate-900">Top Students</h3>
            <div className="mt-4 space-y-3">
              {(dashboardData?.leaderboard || []).length ? (
                (dashboardData.leaderboard || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <div>
                      <div className="font-medium text-slate-800">{item.rank}. {item.fullName}</div>
                      <div className="text-xs text-slate-500">{item.level} - {"⭐".repeat(item.reputationRating || 0)}</div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{item.averageScore}%</div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No leaderboard data yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <h3 className="text-lg font-bold text-slate-900">Top Internship Candidates</h3>
            <div className="mt-4 space-y-3">
              {(dashboardData?.internshipCandidates || []).length ? (
                (dashboardData.internshipCandidates || []).map((item) => (
                  <div key={item.id} className="rounded-xl bg-slate-50 px-4 py-3">
                    <div className="font-medium text-slate-800">{item.fullName}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.level} - {item.averageScore}% - {item.status}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No internship-ready students yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <h3 className="text-lg font-bold text-slate-900">Latest Registrations</h3>
            <div className="mt-4 space-y-3">
              {(latest.registrations || []).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <div className="font-medium text-slate-800">{item.fullName}</div>
                    <div className="text-xs text-slate-500">{item.level}</div>
                  </div>
                  <div className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-soft">
            <h3 className="text-lg font-bold text-slate-900">Latest Payments & Submissions</h3>
            <div className="mt-4 space-y-3">
              {[...(latest.payments || []), ...(latest.taskSubmissions || [])]
                .sort((a, b) => new Date(b.createdAt || b.activityAt) - new Date(a.createdAt || a.activityAt))
                .slice(0, 6)
                .map((item, idx) => (
                  <div key={item.id || idx} className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    {"amount" in item ? (
                      <>
                        <div className="font-medium text-slate-800">{item.fullName} paid {item.amount.toLocaleString()} RWF</div>
                        <div className="text-xs text-slate-500">{item.method} - {item.status}</div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-slate-800">{item.fullName} activity on task {item.taskNumber}</div>
                        <div className="text-xs text-slate-500">{item.title} - {item.status}</div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
