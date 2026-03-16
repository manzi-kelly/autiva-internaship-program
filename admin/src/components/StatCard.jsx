export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-soft">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-3 text-3xl font-bold text-slate-900">{value}</h3>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}
