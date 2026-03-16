import { useEffect, useState, useCallback } from "react";
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
const DEFAULT_MEETING_MESSAGE =
  "Your project submission has been received. Please join a meeting so we can review your project together.";

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

export default function usePracticalRequests() {
  const [requests, setRequests] = useState([]);
  const [assignedPracticals, setAssignedPracticals] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [reviewNotes, setReviewNotes] = useState({});
  const [reviewScores, setReviewScores] = useState({});
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
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
            nextTaskNumber:
              approvedCount + levelTasks.filter((task) => task.status !== "APPROVED").length + 1,
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
  }, []);

  useEffect(() => {
    loadRequests();
    const socket = getAdminSocket();
    socket.on("activity:new", loadRequests);
    return () => socket.off("activity:new", loadRequests);
  }, [loadRequests]);

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
    } catch (err) {
      setError(err.message || "Failed to review task");
    }
  }

  async function handleReviewSubmission(taskId, action) {
    try {
      const meetingMessage =
        action === "APPROVE_SUBMISSION"
          ? (reviewNotes[taskId] || "").trim() || DEFAULT_MEETING_MESSAGE
          : undefined;

      const res = await reviewPracticalSubmission(taskId, {
        action,
        meetingMessage,
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

      if (meetingMessage) {
        setReviewNotes((prev) => ({
          ...prev,
          [taskId]: meetingMessage,
        }));
      }
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

  return {
    requests,
    assignedPracticals,
    userTasks,
    reviewNotes,
    reviewScores,
    error,
    setReviewNotes,
    setReviewScores,
    handleAssignPractical,
    handleRejectPractical,
    handleSendTask,
    handleReviewTask,
    handleReviewSubmission,
    handleReviewExplanation,
    handleReopenFailedTask,
    handleDeleteFailedTask,
  };
}
