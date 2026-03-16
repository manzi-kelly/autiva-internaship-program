export default function PaymentsTable({ data, onReviewPayment, reviewNotes, onReviewNoteChange }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-soft">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-lg font-bold text-slate-900">Payments</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Received Account</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.length ? (
              data.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="px-6 py-4 font-medium text-slate-800">{item.userName}</td>
                  <td className="px-6 py-4">{item.userPhone}</td>
                  <td className="px-6 py-4">{item.amount.toLocaleString()} RWF</td>
                  <td className="px-6 py-4">{item.method}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{item.receivedAccount}</div>
                    <div className="text-xs text-slate-500">
                      {item.receivedName} ({item.receivedProvider})
                    </div>
                  </td>
                  <td className="px-6 py-4">{item.date}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "APPROVED" || item.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "REJECTED"
                            ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <textarea
                      rows="3"
                      value={reviewNotes[item.id] || item.adminNote || ""}
                      onChange={(e) => onReviewNoteChange?.(item.id, e.target.value)}
                      placeholder="Add review note..."
                      className="mb-2 w-56 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => onReviewPayment?.(item.id, "APPROVED")}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onReviewPayment?.(item.id, "REJECTED")}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                  No payment records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
