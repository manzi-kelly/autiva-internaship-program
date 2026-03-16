import { useState } from "react";

export default function AcceptedRequestsPage({ data = [], onSendTask }) {
  const [taskInputs, setTaskInputs] = useState({});

  function handleChange(userId, value) {
    setTaskInputs((prev) => ({
      ...prev,
      [userId]: value,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-slate-900">Accepted Requests</h2>
        <p className="mt-2 text-sm text-slate-500">
          Users accepted from the pending requests list are moved here
          automatically so the admin can assign practical work.
        </p>
      </div>

      <div className="grid gap-5">
        {data.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-lg">
            No accepted requests yet.
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white p-6 shadow-lg"
            >
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.userName}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Accepted on: {item.requestDate}
                  </p>
                </div>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Accepted
                </span>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Assign Task 1
                </label>
                <textarea
                  rows="4"
                  value={taskInputs[item.id] || ""}
                  onChange={(e) => handleChange(item.id, e.target.value)}
                  placeholder="Write Task 1 for this user..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={() =>
                  onSendTask(item, taskInputs[item.id] || "Task 1 assigned.")
                }
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Send Task 1
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}