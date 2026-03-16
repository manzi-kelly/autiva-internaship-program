import usePracticalRequests from "../../hooks/usePracticalRequests";

export default function ReviewQueuePage() {
  const {
    userTasks,
    reviewNotes,
    reviewScores,
    setReviewNotes,
    setReviewScores,
    handleReviewTask,
    handleReviewSubmission,
    handleReviewExplanation,
    handleReopenFailedTask,
    handleDeleteFailedTask,
    error,
  } = usePracticalRequests();

  function renderTaskTable(tasks, level) {
    const levelTasks = tasks.filter((task) => task.level === level);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Task</th>
              <th className="px-6 py-4">Deadline</th>
              <th className="px-6 py-4">Submission</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Review</th>
            </tr>
          </thead>
          <tbody>
            {levelTasks.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                  No {level} tasks yet.
                </td>
              </tr>
            ) : (
              levelTasks.map((task) => (
                <tr key={task.id} className="border-t border-slate-100 align-top">
                  <td className="px-6 py-4 font-medium text-slate-800">{task.userName}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">
                      Task {task.taskNumber}: {task.taskTitle}
                    </div>
                    <div className="mt-1 text-slate-500">{task.taskDescription}</div>
                  </td>

                  <td className="px-6 py-4">
                    <div>{task.dueAt}</div>
                    <div className="text-xs text-slate-500">{task.deadlineLabel} deadline</div>
                  </td>

                  <td className="px-6 py-4">
                    {task.submissionText ? task.submissionText : "Not submitted yet"}
                  </td>

                  <td className="px-6 py-4">{task.status}</td>
                  <td className="px-6 py-4">{task.score ?? "-"}</td>

                  <td className="px-6 py-4">
                    <textarea
                      rows="4"
                      value={reviewNotes[task.id] || task.reviewNote || ""}
                      onChange={(e) =>
                        setReviewNotes((prev) => ({ ...prev, [task.id]: e.target.value }))
                      }
                      className="mb-2 w-64 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                      placeholder="Add review note..."
                    />

                    {task.rawStatus === "SUBMITTED" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReviewSubmission(task.id, "APPROVE_SUBMISSION")}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                        >
                          Approve Submission
                        </button>
                        <button
                          onClick={() => handleReviewSubmission(task.id, "REJECT_SUBMISSION")}
                          className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white"
                        >
                          Reject Submission
                        </button>
                      </div>
                    ) : task.rawStatus === "MEETING_REQUESTED" ? (
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={reviewScores[task.id] ?? task.score ?? ""}
                          onChange={(e) =>
                            setReviewScores((prev) => ({ ...prev, [task.id]: e.target.value }))
                          }
                          className="mb-2 w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                          placeholder="Score"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleReviewTask(
                                task.id,
                                "APPROVED",
                                reviewScores[task.id] ?? task.score
                              )
                            }
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() =>
                              handleReviewTask(
                                task.id,
                                "FAILED_REVIEW",
                                reviewScores[task.id] ?? task.score
                              )
                            }
                            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white"
                          >
                            Mark Failed
                          </button>
                        </div>
                      </div>
                    ) : task.rawStatus === "FAILED" && task.missedReasonStatus === "PENDING" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReviewExplanation(task.id, "ACCEPTED")}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                        >
                          Accept Explanation
                        </button>
                        <button
                          onClick={() => handleReviewExplanation(task.id, "REJECTED")}
                          className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white"
                        >
                          Reject Explanation
                        </button>
                      </div>
                    ) : task.rawStatus === "FAILED" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReopenFailedTask(task.id)}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                        >
                          Reopen Task
                        </button>
                        <button
                          onClick={() => handleDeleteFailedTask(task.id)}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                        >
                          Delete Failed Task
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">
                        {task.reviewNote || "Waiting for student submission."}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

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
            <h3 className="text-lg font-bold text-slate-900">{level} Task Reviews</h3>
          </div>
          {renderTaskTable(userTasks, level)}
        </div>
      ))}
    </div>
  );
}