import { useEffect, useState } from "react";
import RequestsTable from "../components/RequestsTable";
import AssignedPracticals from "../components/AssignedPracticals";
import {
  createPracticalTask,
  deleteFailedTask,
  getPracticalRequests,
  getPracticalTasks,
  reopenFailedTask,
  reviewPracticalSubmission,
  reviewPracticalTask,
  reviewMissedTaskExplanation,
  updatePracticalRequestStatus,
} from "../lib/api";
import { getAdminSocket } from "../lib/socket";

const RULES = {
  L3: { requiredTasks: 4, deadlineLabel: "2 days" },
  L4: { requiredTasks: 4, deadlineLabel: "3 days" },
  L5: { requiredTasks: 2, deadlineLabel: "4 hours" },
};

function getRule(level) {
  return RULES[level] || RULES.L3;
}

function mapReviewStatus(status) {
  if (status === "CONFIRMED") return "User Confirmed Task";
  if (status === "SEEN") return "Seen";
  if (status === "SUBMITTED") return "Submitted for Review";
  if (status === "MEETING_REQUESTED") return "Meeting Requested";
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  if (status === "FAILED_REVIEW") return "Failed After Meeting";
  if (status === "FAILED") return "Task Failed";
  return "Sent";
}

export default function PracticalRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [assignedPracticals, setAssignedPracticals] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [reviewNotes, setReviewNotes] = useState({});
  const [reviewScores, setReviewScores] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRequests() {
      try {
        const [pending, approved, tasksRes] = await Promise.all([
          getPracticalRequests("PENDING"),
          getPracticalRequests("APPROVED"),
          getPracticalTasks(),
        ]);

        const tasks = tasksRes.tasks || [];

        setRequests(
          (pending.requests || []).map((item) => ({
            id: item.id,
            userName: item.user.fullName,
            level: item.level,
            requestDate: new Date(item.requestedAt).toISOString().slice(0, 10),
            status: item.status,
          }))
        );

        setAssignedPracticals(
          (approved.requests || []).map((item) => {
            const levelTasks = tasks.filter((task) => task.requestId === item.id);
            const approvedCount = levelTasks.filter((task) => task.status === "APPROVED").length;
            const rule = getRule(item.level);
            const latestTask = levelTasks
              .slice()
              .sort((a, b) => (b.taskNumber || 0) - (a.taskNumber || 0))[0];
            return {
              id: item.id,
              userName: item.user.fullName,
              level: item.level,
              requestDate: new Date(item.requestedAt).toISOString().slice(0, 10),
              status: item.status,
              deadlineLabel: rule.deadlineLabel,
              requiredTasks: rule.requiredTasks,
              nextTaskNumber: approvedCount + levelTasks.filter((task) => task.status !== "APPROVED").length + 1,
              lastTaskTitle: latestTask?.title || "",
              lastTaskDescription: latestTask?.description || "",
            };
          })
        );

        setUserTasks(
          tasks.map((item) => ({
            id: item.id,
            requestId: item.requestId,
            level: item.user.level,
            userName: item.user.fullName,
            taskNumber: item.taskNumber,
            deadlineLabel: item.deadlineLabel,
            dueAt: item.dueAt ? item.dueAt.slice(0, 10) : "-",
            taskTitle: item.title,
            taskDescription: item.description,
            githubRepoUrl: item.githubRepoUrl,
            projectZipFilename: item.projectZipFilename,
            projectZipDownloadUrl: item.projectZipDownloadUrl,
            score: item.score,
            submissionText: item.submissionText,
            missedReason: item.missedReason,
            missedReasonProof: item.missedReasonProof,
            missedReasonStatus: item.missedReasonStatus,
            reviewNote: item.reviewNote,
            assignedAt: item.assignedAt ? item.assignedAt.slice(0, 10) : "-",
            status: mapReviewStatus(item.status),
            rawStatus: item.status,
          }))
        );
      } catch (err) {
        setError(err.message || "Failed to load practical requests");
      }
    }

    loadRequests();
    const socket = getAdminSocket();
    socket.on("activity:new", loadRequests);
    return () => socket.off("activity:new", loadRequests);
  }, []);

  async function handleAssignPractical(request) {
    try {
      await updatePracticalRequestStatus(request.id, "APPROVED");
      const rule = getRule(request.level);
      setRequests((prev) => prev.filter((item) => item.id !== request.id));
      setAssignedPracticals((prev) => [
        ...prev,
        {
          ...request,
          status: "APPROVED",
          deadlineLabel: rule.deadlineLabel,
          requiredTasks: rule.requiredTasks,
          nextTaskNumber: 1,
        },
      ]);
    } catch (err) {
      setError(err.message || "Failed to approve request");
    }
  }

  async function handleRejectPractical(request) {
    try {
      await updatePracticalRequestStatus(request.id, "REJECTED");
      setRequests((prev) => prev.filter((item) => item.id !== request.id));
    } catch (err) {
      setError(err.message || "Failed to reject request");
    }
  }

  async function handleSendTask(request, payload) {
    try {
      const res = await createPracticalTask({
        requestId: request.id,
        title: payload.title,
        description: payload.description,
      });

      const task = res.task;
      setAssignedPracticals((prev) =>
        prev.map((item) =>
          item.id === request.id
            ? {
                ...item,
                nextTaskNumber: (task.taskNumber || item.nextTaskNumber) + 1,
                lastTaskTitle: task.title,
                lastTaskDescription: task.description,
              }
            : item
        )
      );
      setUserTasks((prev) => [
        {
          id: task.id,
          requestId: task.requestId,
          level: task.user.level,
          userName: task.user.fullName,
          taskNumber: task.taskNumber,
          deadlineLabel: task.deadlineLabel,
          dueAt: task.dueAt ? task.dueAt.slice(0, 10) : "-",
          taskTitle: task.title,
          taskDescription: task.description,
          githubRepoUrl: task.githubRepoUrl,
          projectZipFilename: task.projectZipFilename,
          projectZipDownloadUrl: task.projectZipDownloadUrl,
          score: task.score,
          submissionText: task.submissionText,
          missedReason: task.missedReason,
          missedReasonProof: task.missedReasonProof,
          missedReasonStatus: task.missedReasonStatus,
          reviewNote: task.reviewNote,
          assignedAt: task.assignedAt ? task.assignedAt.slice(0, 10) : "-",
          status: mapReviewStatus(task.status),
          rawStatus: task.status,
        },
        ...prev.filter((item) => item.id !== task.id),
      ]);
    } catch (err) {
      setError(err.message || "Failed to send practical task");
    }
  }

  async function handleReviewTask(taskId, status, score) {
    try {
      const res = await reviewPracticalTask(taskId, {
        status,
        score: score === "" || typeof score === "undefined" ? undefined : Number(score),
        reviewNote: reviewNotes[taskId] || "",
      });

      setUserTasks((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                status: mapReviewStatus(res.task.status),
                rawStatus: res.task.status,
                reviewNote: res.task.reviewNote,
                score: res.task.score,
              }
            : item
        )
      );

      if (res.task.status === "APPROVED") {
        setAssignedPracticals((prev) =>
          prev.map((item) =>
            item.id === res.task.requestId
              ? {
                  ...item,
                  nextTaskNumber: (res.task.taskNumber || item.nextTaskNumber) + 1,
                  lastTaskTitle: res.task.title,
                  lastTaskDescription: res.task.description,
                }
              : item
          )
        );
      }
    } catch (err) {
      setError(err.message || "Failed to review task");
    }
  }

  async function handleReviewSubmission(taskId, action) {
    try {
      const res = await reviewPracticalSubmission(taskId, {
        action,
        meetingMessage: action === "APPROVE_SUBMISSION" ? reviewNotes[taskId] || "" : undefined,
        reviewNote: action === "REJECT_SUBMISSION" ? reviewNotes[taskId] || "" : undefined,
      });

      setUserTasks((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                status: mapReviewStatus(res.task.status),
                rawStatus: res.task.status,
                reviewNote: res.task.reviewNote,
              }
            : item
        )
      );
    } catch (err) {
      setError(err.message || "Failed to review submission");
    }
  }

  async function handleReviewExplanation(taskId, decision) {
    try {
      const res = await reviewMissedTaskExplanation(taskId, {
        decision,
        reviewNote: reviewNotes[taskId] || "",
      });

      setUserTasks((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                status: mapReviewStatus(res.task.status),
                rawStatus: res.task.status,
                reviewNote: res.task.reviewNote,
                missedReasonStatus: res.task.missedReasonStatus,
                score: res.task.score,
              }
            : item
        )
      );
    } catch (err) {
      setError(err.message || "Failed to review explanation");
    }
  }

  async function handleReopenFailedTask(taskId) {
    try {
      const res = await reopenFailedTask(taskId, {
        reviewNote: reviewNotes[taskId] || "",
      });
      setUserTasks((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                status: mapReviewStatus(res.task.status),
                rawStatus: res.task.status,
                reviewNote: res.task.reviewNote,
                missedReasonStatus: res.task.missedReasonStatus,
                score: res.task.score,
              }
            : item
        )
      );
    } catch (err) {
      setError(err.message || "Failed to reopen failed task");
    }
  }

  async function handleDeleteFailedTask(taskId) {
    try {
      await deleteFailedTask(taskId);
      setUserTasks((prev) => prev.filter((item) => item.id !== taskId));
    } catch (err) {
      setError(err.message || "Failed to delete failed task");
    }
  }

  // Helper function to render task review table for a specific level
  const renderTaskTable = (tasks, level) => {
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
                    {task.submissionText ? (
                      <div className="max-w-xs space-y-2 whitespace-pre-wrap text-slate-600">
                        {task.githubRepoUrl ? (
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              GitHub
                            </div>
                            <a
                              href={task.githubRepoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-700 underline"
                            >
                              {task.githubRepoUrl}
                            </a>
                          </div>
                        ) : null}
                        {task.projectZipFilename ? (
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              ZIP file
                            </div>
                            {task.projectZipDownloadUrl ? (
                              <a
                                href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}${task.projectZipDownloadUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-700 underline"
                              >
                                {task.projectZipFilename}
                              </a>
                            ) : (
                              <span>{task.projectZipFilename}</span>
                            )}
                          </div>
                        ) : null}
                        <div>{task.submissionText}</div>
                      </div>
                    ) : task.missedReason ? (
                      <div className="max-w-xs whitespace-pre-wrap text-slate-600">
                        <div className="font-semibold text-slate-800">Missed task explanation</div>
                        <div className="mt-1">{task.missedReason}</div>
                        {task.missedReasonProof ? (
                          <div className="mt-1 text-xs text-blue-700">
                            Proof: {task.missedReasonProof}
                          </div>
                        ) : null}
                        <div className="mt-1 text-xs text-slate-500">
                          Explanation status: {task.missedReasonStatus || "PENDING"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Not submitted yet</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        task.rawStatus === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : task.rawStatus === "REJECTED"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {task.score ?? "-"}
                  </td>
                  <td className="px-6 py-4">
                    <textarea
                      rows="4"
                      value={reviewNotes[task.id] || task.reviewNote || ""}
                      onChange={(e) =>
                        setReviewNotes((prev) => ({ ...prev, [task.id]: e.target.value }))
                      }
                      placeholder="Add review feedback or extra instructions..."
                      className="mb-2 w-64 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                    />
                    {task.rawStatus === "SUBMITTED" ? (
                      <div className="space-y-2">
                        <div className="text-xs text-slate-500">
                          Approve the submission first and send the meeting request message.
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReviewSubmission(task.id, "APPROVE_SUBMISSION")}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Approve Submission
                          </button>
                          <button
                            onClick={() => handleReviewSubmission(task.id, "REJECT_SUBMISSION")}
                            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                          >
                            Reject Submission
                          </button>
                        </div>
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
                          placeholder="Final score"
                          className="mb-2 w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
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
                          disabled={
                            (reviewScores[task.id] ?? task.score ?? "") === ""
                          }
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
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
                          disabled={
                            (reviewScores[task.id] ?? task.score ?? "") === ""
                          }
                          className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                          Mark Failed
                        </button>
                      </div>
                      </div>
                    ) : task.rawStatus === "FAILED" && task.missedReasonStatus === "PENDING" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReviewExplanation(task.id, "ACCEPTED")}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Accept Explanation
                        </button>
                        <button
                          onClick={() => handleReviewExplanation(task.id, "REJECTED")}
                          className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          Reject Explanation
                        </button>
                      </div>
                    ) : task.rawStatus === "FAILED" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReopenFailedTask(task.id)}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Reopen Task
                        </button>
                        <button
                          onClick={() => handleDeleteFailedTask(task.id)}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
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
  };

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {/* SECTION 1: Pending Requests by Level */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Pending Requests</h2>
        
        {/* L3 Requests */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-slate-100 bg-blue-50 px-6 py-4">
            <h3 className="text-lg font-bold text-blue-900">L3 Requests</h3>
            <p className="mt-1 text-sm text-blue-700">4 tasks required · 2 days deadline</p>
          </div>
          <RequestsTable
            data={requests.filter((r) => r.level === "L3")}
            onAcceptRequest={handleAssignPractical}
            onRejectRequest={handleRejectPractical}
          />
        </div>

        {/* L4 Requests */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-slate-100 bg-purple-50 px-6 py-4">
            <h3 className="text-lg font-bold text-purple-900">L4 Requests</h3>
            <p className="mt-1 text-sm text-purple-700">4 tasks required · 3 days deadline</p>
          </div>
          <RequestsTable
            data={requests.filter((r) => r.level === "L4")}
            onAcceptRequest={handleAssignPractical}
            onRejectRequest={handleRejectPractical}
          />
        </div>

        {/* L5 Requests */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-slate-100 bg-amber-50 px-6 py-4">
            <h3 className="text-lg font-bold text-amber-900">L5 Requests</h3>
            <p className="mt-1 text-sm text-amber-700">2 tasks required · 4 hours deadline</p>
          </div>
          <RequestsTable
            data={requests.filter((r) => r.level === "L5")}
            onAcceptRequest={handleAssignPractical}
            onRejectRequest={handleRejectPractical}
          />
        </div>
      </div>

      {/* SECTION 2: Assigned Practicals by Level */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Assigned Practicals</h2>
        
        {/* L3 Assigned */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-slate-100 bg-blue-50 px-6 py-4">
            <h3 className="text-lg font-bold text-blue-900">L3 Assigned Practicals</h3>
            <p className="mt-1 text-sm text-blue-700">Send tasks to approved L3 students</p>
          </div>
          <AssignedPracticals
            data={assignedPracticals.filter((a) => a.level === "L3")}
            onSendTask={handleSendTask}
          />
        </div>

        {/* L4 Assigned */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-slate-100 bg-purple-50 px-6 py-4">
            <h3 className="text-lg font-bold text-purple-900">L4 Assigned Practicals</h3>
            <p className="mt-1 text-sm text-purple-700">Send tasks to approved L4 students</p>
          </div>
          <AssignedPracticals
            data={assignedPracticals.filter((a) => a.level === "L4")}
            onSendTask={handleSendTask}
          />
        </div>

        {/* L5 Assigned */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-slate-100 bg-amber-50 px-6 py-4">
            <h3 className="text-lg font-bold text-amber-900">L5 Assigned Practicals</h3>
            <p className="mt-1 text-sm text-amber-700">Send tasks to approved L5 students</p>
          </div>
          <AssignedPracticals
            data={assignedPracticals.filter((a) => a.level === "L5")}
            onSendTask={handleSendTask}
          />
        </div>
      </div>

      {/* SECTION 3: Practical Review Queue by Level */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Practical Review Queue</h2>

        {/* L3 Tasks */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-slate-100 bg-blue-50 px-6 py-4">
            <h3 className="text-lg font-bold text-blue-900">L3 Task Reviews</h3>
            <p className="mt-1 text-sm text-blue-700">
              Review L3 submissions and track progress
            </p>
          </div>
          {renderTaskTable(userTasks, "L3")}
        </div>

        {/* L4 Tasks */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-slate-100 bg-purple-50 px-6 py-4">
            <h3 className="text-lg font-bold text-purple-900">L4 Task Reviews</h3>
            <p className="mt-1 text-sm text-purple-700">
              Review L4 submissions and track progress
            </p>
          </div>
          {renderTaskTable(userTasks, "L4")}
        </div>

        {/* L5 Tasks */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-slate-100 bg-amber-50 px-6 py-4">
            <h3 className="text-lg font-bold text-amber-900">L5 Task Reviews</h3>
            <p className="mt-1 text-sm text-amber-700">
              Review L5 submissions and track progress
            </p>
          </div>
          {renderTaskTable(userTasks, "L5")}
        </div>
      </div>
    </div>
  );
}