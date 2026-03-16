import RequestsTable from "../../components/RequestsTable";
import usePracticalRequests from "../../hooks/usePracticalRequests";

export default function PendingRequestsPage() {
  const {
    requests,
    error,
    handleAssignPractical,
    handleRejectPractical,
  } = usePracticalRequests();

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {["L3", "L4", "L5"].map((level) => (
        <div key={level} className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="text-lg font-bold text-slate-900">{level} Requests</h3>
          </div>

          <RequestsTable
            data={requests.filter((r) => r.level === level)}
            onAcceptRequest={handleAssignPractical}
            onRejectRequest={handleRejectPractical}
          />
        </div>
      ))}
    </div>
  );
}