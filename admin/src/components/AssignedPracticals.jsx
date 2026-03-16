import { useEffect, useState } from "react";

export default function AssignedPracticals({
  data = [],
  onSendTask,
}) {
  const [taskInputs, setTaskInputs] = useState({});
  const [taskTitles, setTaskTitles] = useState({});

  function handleInputChange(id, value) {
    setTaskInputs((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  function handleTitleChange(id, value) {
    setTaskTitles((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  useEffect(() => {
    setTaskTitles((prev) => {
      const next = { ...prev };
      data.forEach((item) => {
        if (!next[item.id] && item.lastTaskTitle) {
          next[item.id] = `${item.lastTaskTitle} - Task ${item.nextTaskNumber}`;
        }
      });
      return next;
    });

    setTaskInputs((prev) => {
      const next = { ...prev };
      data.forEach((item) => {
        if (!next[item.id] && item.lastTaskDescription) {
          next[item.id] = item.lastTaskDescription;
        }
      });
      return next;
    });
  }, [data]);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-lg font-bold text-slate-900">Assigned Practicals</h3>
        <p className="mt-1 text-sm text-slate-500">
          Pending requests moved here so the admin can assign Task 1.
        </p>
      </div>

      <div className="space-y-4 p-6">
        {data.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
            No practicals ready for assignment.
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 p-5"
            >
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {item.userName}
                  </h4>
                  <p className="text-sm text-slate-500">
                    Request Date: {item.requestDate}
                  </p>
                  <p className="text-sm text-slate-500">Level: {item.level || "-"}</p>
                  <p className="text-sm text-slate-500">Deadline per task: {item.deadlineLabel}</p>
                  <p className="text-sm text-slate-500">
                    Required tasks for certificate: {item.requiredTasks}
                  </p>
                  {item.lastTaskDescription ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Previous task details were loaded automatically for the next assignment.
                    </p>
                  ) : null}
                </div>

                <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Ready for Task Assignment
                </span>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Task Title
                </label>
                <input
                  type="text"
                  value={taskTitles[item.id] || ""}
                  onChange={(e) => handleTitleChange(item.id, e.target.value)}
                  placeholder={`e.g. ${item.level} Practical Task ${item.nextTaskNumber}`}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Practical Instructions
                </label>
                <textarea
                  value={taskInputs[item.id] || ""}
                  onChange={(e) => handleInputChange(item.id, e.target.value)}
                  placeholder="Write the practical task details, acceptance criteria, links, and any extra instructions for this student..."
                  rows={8}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                />
              </div>

              <button
                onClick={() =>
                  onSendTask(item, {
                    title: taskTitles[item.id] || "",
                    description: taskInputs[item.id] || "",
                  })
                }
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Send Task {item.nextTaskNumber}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
