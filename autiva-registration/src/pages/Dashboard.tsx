import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { api } from "../lib/apiClient";
import { getStudentSocket } from "../lib/socket";

type Level = "L3" | "L4" | "L5";

type Topic =
  | "HTML"
  | "CSS"
  | "JAVASCRIPT"
  | "PHP"
  | "NODE"
  | "MYSQL"
  | "REACT"
  | "MOBILE_APP";

type Lesson = {
  id: string;
  level: Level;
  sessionNumber: number;
  topic: Topic;
  title: string;
  description: string;
  outcomes: string[];
  estMinutes: number;
};

function lessonUrl(topic: Topic): string {
  switch (topic) {
    case "HTML":
      return "https://www.w3schools.com/html/default.asp";
    case "CSS":
      return "https://www.w3schools.com/css/default.asp";
    case "JAVASCRIPT":
      return "https://www.w3schools.com/js/default.asp";
    case "PHP":
      return "https://www.w3schools.com/php/default.asp";
    case "NODE":
      return "https://www.w3schools.com/nodejs/default.asp";
    case "MYSQL":
      return "https://www.w3schools.com/mysql/default.asp";
    case "REACT":
      return "https://www.w3schools.com/react/default.asp";
    case "MOBILE_APP":
      return "https://docs.flutter.dev/learn/pathway";
    default:
      return "https://www.w3schools.com/";
  }
}

function buildTrack(level: Level): Lesson[] {
  if (level === "L3") {
    return [
      {
        id: "L3-HTML",
        level: "L3",
        sessionNumber: 1,
        topic: "HTML",
        title: "HTML Fundamentals",
        description: "Learn how to structure web pages using semantic HTML.",
        estMinutes: 60,
        outcomes: [
          "Use semantic HTML tags correctly",
          "Build forms with labels and validation hints",
          "Create clean page structure for real projects",
        ],
      },
      {
        id: "L3-CSS",
        level: "L3",
        sessionNumber: 2,
        topic: "CSS",
        title: "CSS Essentials",
        description: "Learn styling, layout, spacing, typography, and responsiveness.",
        estMinutes: 90,
        outcomes: [
          "Understand the box model and spacing system",
          "Layout using Flexbox and Grid",
          "Build responsive UI that works on mobile",
        ],
      },
      {
        id: "L3-JS",
        level: "L3",
        sessionNumber: 3,
        topic: "JAVASCRIPT",
        title: "JavaScript Basics",
        description: "Learn JavaScript logic and DOM events to build interactive UI.",
        estMinutes: 100,
        outcomes: [
          "Variables, functions, arrays, objects",
          "Handle events and update the DOM",
          "Build a small interactive feature (e.g., form validation)",
        ],
      },
    ];
  }

  if (level === "L4") {
    return [
      {
        id: "L4-PHP",
        level: "L4",
        sessionNumber: 1,
        topic: "PHP",
        title: "PHP Backend Basics",
        description: "Learn PHP to handle server-side logic and request data.",
        estMinutes: 100,
        outcomes: [
          "PHP syntax and core concepts",
          "Work with forms and request data",
          "Basic backend validation patterns",
        ],
      },
      {
        id: "L4-NODE",
        level: "L4",
        sessionNumber: 2,
        topic: "NODE",
        title: "Node.js API Basics",
        description: "Learn Node.js to build APIs and connect frontend to backend.",
        estMinutes: 120,
        outcomes: [
          "Create simple REST endpoints",
          "Understand routing and middleware",
          "Handle errors with proper status codes",
        ],
      },
      {
        id: "L4-MYSQL",
        level: "L4",
        sessionNumber: 3,
        topic: "MYSQL",
        title: "MySQL Database Basics",
        description: "Learn SQL and relational database fundamentals using MySQL.",
        estMinutes: 110,
        outcomes: [
          "Tables, keys, relationships",
          "Write SQL queries (SELECT/INSERT/UPDATE/DELETE)",
          "Model data for real systems",
        ],
      },
    ];
  }

  return [
    {
      id: "L5-REACT",
      level: "L5",
      sessionNumber: 1,
      topic: "REACT",
      title: "React.js (Modern UI Engineering)",
      description: "Build scalable UIs with reusable components and clean architecture.",
      estMinutes: 120,
      outcomes: [
        "Components, props, state, composition",
        "Routing and protected pages",
        "Production UI structure patterns",
      ],
    },
    {
      id: "L5-FLUTTER",
      level: "L5",
      sessionNumber: 2,
      topic: "MOBILE_APP",
      title: "Mobile App Development (Flutter Pathway)",
      description: "Follow the official Flutter pathway and build real mobile apps.",
      estMinutes: 140,
      outcomes: [
        "Flutter fundamentals and widgets",
        "State management basics",
        "Build and run a real Flutter app end-to-end",
      ],
    },
  ];
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-emerald-100 p-4">
          <h3 className="text-sm font-semibold text-emerald-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-emerald-600 hover:bg-emerald-50"
          >
            x
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const { user, clearAuth } = useAuth();

  const level = (user?.level || "L3") as Level;
  const lessons = useMemo(() => buildTrack(level), [level]);

  const [activeId, setActiveId] = useState<string>(lessons[0]?.id || "");
  const activeLesson = useMemo(
    () => lessons.find((l) => l.id === activeId) || lessons[0],
    [lessons, activeId]
  );

  const progressKey = user?.id
    ? `autiva_completed_${user.id}_${level}`
    : `autiva_completed_unknown_${level}`;

  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(progressKey);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const allCompleted = lessons.length > 0 && completedIds.length >= lessons.length;

  const [practicalStatus, setPracticalStatus] = useState<
    "NONE" | "PENDING" | "APPROVED" | "REJECTED"
  >("NONE");
  const [practicalMessage, setPracticalMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [readyOpen, setReadyOpen] = useState(false);
  const [practicalTask, setPracticalTask] = useState<{
    id: string;
    taskNumber: number;
    deadlineHours: number;
    deadlineLabel: string;
    dueAt: string | null;
    title: string;
    description: string;
    status: "ASSIGNED" | "SEEN" | "CONFIRMED" | "SUBMITTED" | "MEETING_REQUESTED" | "APPROVED" | "REJECTED" | "FAILED" | "FAILED_REVIEW";
    githubRepoUrl?: string;
    projectZipFilename?: string;
    evaluationStatus?: string;
    score?: number | null;
    missedReason?: string;
    missedReasonProof?: string;
    missedReasonStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | null;
    reviewNote?: string;
  } | null>(null);
  const [practicalTasks, setPracticalTasks] = useState<
    Array<{
      id: string;
      taskNumber: number;
      title: string;
      status: "ASSIGNED" | "SEEN" | "CONFIRMED" | "SUBMITTED" | "MEETING_REQUESTED" | "APPROVED" | "REJECTED" | "FAILED" | "FAILED_REVIEW";
      dueAt: string | null;
      deadlineLabel?: string;
      score?: number | null;
    }>
  >([]);
  const [practicalProgress, setPracticalProgress] = useState({
    approvedCount: 0,
    requiredTasks: level === "L5" ? 2 : 4,
    label: `0/${level === "L5" ? 2 : 4}`,
    progressPercent: 0,
    totalScore: 0,
    averageScore: 0,
    deadlineHours: level === "L5" ? 4 : level === "L4" ? 72 : 48,
    deadlineLabel: level === "L5" ? "4 hours" : level === "L4" ? "3 days" : "2 days",
    certificateEligible: false,
    reputationRating: 0,
    completedTasks: 0,
    levelStatus: "LEARNING",
    internshipEligible: false,
    certificateStatus: "NOT_ELIGIBLE",
  });
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [projectZipFile, setProjectZipFile] = useState<File | null>(null);
  const [missedReason, setMissedReason] = useState("");
  const [missedReasonProof, setMissedReasonProof] = useState("");
  const [taskLoading, setTaskLoading] = useState(false);
  const [certificateData, setCertificateData] = useState<{
    certificateStatus: string;
    certificateEligible: boolean;
    averageScore: number;
    completedTasks: number;
    request: {
      id: string;
      level: string;
      finalScore: number;
      progressPercent: number;
      status: string;
      requestedAt: string | null;
      reviewedAt: string | null;
      adminNote: string;
    } | null;
    certificate: {
      certificateId: string;
      level: string;
      finalScore: number;
      issueDate: string | null;
      isValid: boolean;
      generatedFormat?: string;
      viewUrl: string;
      verifyUrl: string;
      downloadUrl: string;
    } | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPracticalState() {
      try {
        const [requestRes, taskRes, certificateRes] = await Promise.all([
          api.get<{
            request: { status: "PENDING" | "APPROVED" | "REJECTED"; message?: string } | null;
          }>("/requests/practical/me"),
          api.get<{
            task: {
              id: string;
              taskNumber: number;
              deadlineHours: number;
              deadlineLabel: string;
              dueAt: string | null;
              title: string;
              description: string;
              status: "ASSIGNED" | "SEEN" | "CONFIRMED" | "SUBMITTED" | "MEETING_REQUESTED" | "APPROVED" | "REJECTED" | "FAILED" | "FAILED_REVIEW";
              score?: number | null;
              githubRepoUrl?: string;
              projectZipFilename?: string;
              missedReason?: string;
              missedReasonProof?: string;
              missedReasonStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | null;
              reviewNote?: string;
            } | null;
            tasks: Array<{
              id: string;
              taskNumber: number;
              title: string;
              dueAt: string | null;
              deadlineLabel?: string;
              status: "ASSIGNED" | "SEEN" | "CONFIRMED" | "SUBMITTED" | "MEETING_REQUESTED" | "APPROVED" | "REJECTED" | "FAILED" | "FAILED_REVIEW";
              score?: number | null;
            }>;
            progress: {
              approvedCount: number;
              requiredTasks: number;
              label: string;
              progressPercent: number;
              totalScore: number;
              averageScore: number;
              deadlineHours: number;
              deadlineLabel: string;
              certificateEligible: boolean;
              reputationRating?: number;
              completedTasks?: number;
              levelStatus?: string;
              internshipEligible?: boolean;
              certificateStatus?: string;
            };
          }>("/practical-tasks/me"),
          api.get<{
            certificateStatus: string;
            certificateEligible: boolean;
            averageScore: number;
            completedTasks: number;
            request: {
              id: string;
              level: string;
              finalScore: number;
              progressPercent: number;
              status: string;
              requestedAt: string | null;
              reviewedAt: string | null;
              adminNote: string;
            } | null;
            certificate: {
              certificateId: string;
              level: string;
              finalScore: number;
              issueDate: string | null;
              isValid: boolean;
              generatedFormat?: string;
              viewUrl: string;
              verifyUrl: string;
              downloadUrl: string;
            } | null;
          }>("/user/certificate"),
        ]);

        if (cancelled) return;

        if (!requestRes.data.request) {
          setPracticalStatus("NONE");
        } else {
          setPracticalStatus(requestRes.data.request.status);
          setPracticalMessage(requestRes.data.request.message || "");
        }

        setPracticalTask(taskRes.data.task);
        setPracticalTasks(taskRes.data.tasks || []);
        if (taskRes.data.progress) {
          setPracticalProgress(taskRes.data.progress);
        }
        setCertificateData(certificateRes.data);
        setGithubRepoUrl(taskRes.data.task?.githubRepoUrl || "");
        setProjectZipFile(null);
        setMissedReason(taskRes.data.task?.missedReason || "");
        setMissedReasonProof(taskRes.data.task?.missedReasonProof || "");
      } catch {
        if (cancelled) return;
        setPracticalStatus("NONE");
        setPracticalTask(null);
        setPracticalTasks([]);
        setCertificateData(null);
      }
    }

    loadPracticalState();
    const interval = window.setInterval(loadPracticalState, 15000);
    const socket = getStudentSocket();
    const handleTaskUpdate = (payload: { userId?: string }) => {
      if (payload?.userId && payload.userId === user?.id) {
        loadPracticalState();
      }
    };
    const handleCertificateUpdate = (payload: { userId?: string }) => {
      if (payload?.userId && payload.userId === user?.id) {
        loadPracticalState();
      }
    };
    socket.on("task:updated", handleTaskUpdate);
    socket.on("certificate:updated", handleCertificateUpdate);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      socket.off("task:updated", handleTaskUpdate);
      socket.off("certificate:updated", handleCertificateUpdate);
    };
  }, [user?.id]);

  function markCompleted(lessonId: string) {
    if (completedSet.has(lessonId)) return;
    const next = [...completedIds, lessonId];
    setCompletedIds(next);
    localStorage.setItem(progressKey, JSON.stringify(next));
  }

  async function requestPractical() {
    setRequestError("");
    setRequestLoading(true);

    try {
      const res = await api.post<{
        message: string;
        request: { status: "PENDING" | "APPROVED" | "REJECTED" };
      }>("/requests/practical", {});

      setPracticalStatus(res.data.request.status);
      setPracticalMessage(res.data.message);
      setReadyOpen(false);
    } catch (error: any) {
      setRequestError(error?.response?.data?.message || "Failed to submit practical request");
    } finally {
      setRequestLoading(false);
    }
  }

  async function confirmPracticalTask() {
    if (!practicalTask) return;
    setTaskLoading(true);
    setRequestError("");

    try {
      const res = await api.post<{
        message: string;
        task: {
          id: string;
          taskNumber: number;
          deadlineHours: number;
          deadlineLabel: string;
          dueAt: string | null;
          title: string;
          description: string;
          status: "ASSIGNED" | "SEEN" | "CONFIRMED" | "SUBMITTED" | "MEETING_REQUESTED" | "APPROVED" | "REJECTED" | "FAILED" | "FAILED_REVIEW";
          score?: number | null;
          submissionText?: string;
          missedReason?: string;
          missedReasonProof?: string;
          missedReasonStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | null;
          reviewNote?: string;
        };
      }>(`/practical-tasks/${practicalTask.id}/confirm`, {});
      setPracticalTask(res.data.task);
    } catch (error: any) {
      setRequestError(error?.response?.data?.message || "Failed to confirm practical task");
    } finally {
      setTaskLoading(false);
    }
  }

  async function submitPracticalWork() {
    if (!practicalTask) return;
    setTaskLoading(true);
    setRequestError("");

    try {
      const formData = new FormData();
      formData.append("githubRepoUrl", githubRepoUrl);
      if (projectZipFile) {
        formData.append("projectZip", projectZipFile);
      }

      const res = await api.post<{
        task: {
          id: string;
          taskNumber: number;
          deadlineHours: number;
          deadlineLabel: string;
          dueAt: string | null;
          title: string;
          description: string;
          status: "ASSIGNED" | "SEEN" | "CONFIRMED" | "SUBMITTED" | "MEETING_REQUESTED" | "APPROVED" | "REJECTED" | "FAILED" | "FAILED_REVIEW";
          githubRepoUrl?: string;
              projectZipFilename?: string;
              evaluationStatus?: string;
              score?: number | null;
          missedReason?: string;
          missedReasonProof?: string;
          missedReasonStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | null;
          reviewNote?: string;
        };
      }>(`/practical-tasks/${practicalTask.id}/submit`, formData);
      setPracticalTask(res.data.task);
      setGithubRepoUrl(res.data.task.githubRepoUrl || githubRepoUrl);
      setProjectZipFile(null);
    } catch (error: any) {
      setRequestError(error?.response?.data?.message || "Failed to submit practical work");
    } finally {
      setTaskLoading(false);
    }
  }

  async function submitMissedReason() {
    if (!practicalTask) return;
    setTaskLoading(true);
    setRequestError("");

    try {
      const res = await api.post<{
        task: {
          id: string;
          taskNumber: number;
          deadlineHours: number;
          deadlineLabel: string;
          dueAt: string | null;
          title: string;
          description: string;
          status: "ASSIGNED" | "SEEN" | "CONFIRMED" | "SUBMITTED" | "MEETING_REQUESTED" | "APPROVED" | "REJECTED" | "FAILED" | "FAILED_REVIEW";
          score?: number | null;
          submissionText?: string;
          missedReason?: string;
          missedReasonStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | null;
          reviewNote?: string;
        };
      }>(`/practical-tasks/${practicalTask.id}/explanation`, {
        reason: missedReason,
        proofReference: missedReasonProof,
      });
      setPracticalTask(res.data.task as any);
    } catch (error: any) {
      setRequestError(error?.response?.data?.message || "Failed to submit explanation");
    } finally {
      setTaskLoading(false);
    }
  }

  function openLesson() {
    if (!activeLesson) return;
    const url = lessonUrl(activeLesson.topic);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-emerald-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-900">Student Dashboard</h1>
            <p className="mt-1 text-sm text-emerald-700">
              Welcome, <span className="font-semibold text-emerald-900">{user?.fullName}</span> - Level{" "}
              <span className="font-semibold text-emerald-900">{level}</span>
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={() => {
              clearAuth();
              nav("/", { replace: true });
            }}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          >
            Logout
          </Button>
        </div>

        {requestError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {requestError}
          </div>
        ) : null}

        {practicalStatus !== "NONE" ? (
          <div
            className={[
              "rounded-2xl border p-4 text-sm",
              practicalStatus === "PENDING"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : practicalStatus === "APPROVED"
                ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800",
            ].join(" ")}
          >
            {practicalStatus === "PENDING" && (
              <div>
                <div className="font-semibold">Practical Requested</div>
                <div className="mt-1">
                  {practicalMessage || "Your request has been received. Please wait for a response shortly."}
                </div>
              </div>
            )}
            {practicalStatus === "APPROVED" && (
              <div>
                <div className="font-semibold">Practical Approved</div>
                <div className="mt-1">Your practical is approved. You can proceed with the assigned task.</div>
              </div>
            )}
            {practicalStatus === "REJECTED" && (
              <div>
                <div className="font-semibold">Practical Rejected</div>
                <div className="mt-1">Admin rejected your request. You can request again after reviewing your lessons.</div>
              </div>
            )}
          </div>
        ) : null}

        {practicalTask ? (
          <div
            className={[
              "rounded-2xl border p-4 text-sm",
              practicalTask.status === "APPROVED"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : practicalTask.status === "FAILED"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : practicalTask.status === "REJECTED"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-blue-200 bg-blue-50 text-blue-800",
            ].join(" ")}
          >
            <div className="font-semibold">
              {practicalTask.status === "APPROVED"
                ? "Practical Task Approved"
                : practicalTask.status === "MEETING_REQUESTED"
                ? "Meeting Requested"
                : practicalTask.status === "FAILED"
                ? `Fail Task ${practicalTask.taskNumber}`
                : practicalTask.status === "FAILED_REVIEW"
                ? "Practical Task Failed"
                : practicalTask.status === "REJECTED"
                ? "Practical Task Rejected"
                : practicalTask.status === "SUBMITTED"
                ? "Practical Work Submitted"
                : practicalTask.status === "CONFIRMED"
                ? "Practical Task Confirmed"
                : "New Practical Task Assigned"}
            </div>
            <div className="mt-1">
              {practicalTask.status === "APPROVED"
                ? "This task has been approved by admin."
                : practicalTask.status === "MEETING_REQUESTED"
                ? "Your submission was accepted. Please attend the requested meeting for manual review."
                : practicalTask.status === "FAILED"
                ? "Deadline exceeded. Submission is no longer allowed."
                : practicalTask.status === "FAILED_REVIEW"
                ? "Your task was reviewed after the meeting and marked as failed."
                : practicalTask.status === "REJECTED"
                ? "Your submission was rejected. Review the feedback and submit again."
                : practicalTask.status === "SUBMITTED"
                ? "Submission Status: Under Review. Waiting for Admin Approval."
                : practicalTask.status === "CONFIRMED"
                ? "You confirmed the task. You can now start working on it and submit your work."
                : "Please confirm that you are ready to start this task."}
            </div>
            <div className="mt-3 rounded-xl bg-white/70 p-4">
              <div className="font-semibold text-slate-900">
                Task {practicalTask.taskNumber}: {practicalTask.title}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Deadline: {practicalTask.dueAt ? practicalTask.dueAt.slice(0, 10) : "-"} (
                {practicalTask.deadlineLabel})
              </div>
              <div className="mt-1 text-slate-700">{practicalTask.description}</div>
              {(practicalTask.status === "APPROVED" || practicalTask.status === "FAILED" || practicalTask.status === "FAILED_REVIEW") &&
              practicalTask.score !== null &&
              typeof practicalTask.score !== "undefined" ? (
                <div className="mt-3 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  Score: {practicalTask.score}
                </div>
              ) : null}
              {practicalTask.githubRepoUrl ? (
                <div className="mt-3 text-xs text-slate-600">
                  GitHub:{" "}
                  <a
                    href={practicalTask.githubRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-blue-700 underline"
                  >
                    Open repository
                  </a>
                </div>
              ) : null}
              {practicalTask.projectZipFilename ? (
                <div className="mt-1 text-xs text-slate-600">
                  Uploaded ZIP: <span className="font-semibold">{practicalTask.projectZipFilename}</span>
                </div>
              ) : null}
              {practicalTask.status === "SUBMITTED" ? (
                <div className="mt-1 text-xs text-slate-600">
                  Review process: <span className="font-semibold">Waiting for admin approval</span>
                </div>
              ) : null}
            </div>
            {practicalTask.reviewNote ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-4 text-slate-700">
                <div className="font-semibold text-slate-900">Admin Feedback</div>
                <div className="mt-1">{practicalTask.reviewNote}</div>
              </div>
            ) : null}
            {(practicalTask.status === "ASSIGNED" || practicalTask.status === "SEEN") ? (
              <Button
                className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
                onClick={confirmPracticalTask}
                disabled={taskLoading}
              >
                {taskLoading ? "Confirming..." : "Confirm"}
              </Button>
            ) : null}
            {(practicalTask.status === "CONFIRMED" || practicalTask.status === "REJECTED") ? (
              <div className="mt-4">
                <label className="mb-2 block font-semibold text-slate-900">GitHub Repository URL</label>
                <input
                  type="url"
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/project"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                />
                <label className="mb-2 mt-4 block font-semibold text-slate-900">Project ZIP File</label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setProjectZipFile(e.target.files?.[0] || null)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                />
                <div className="mt-2 text-xs text-slate-500">
                  Submit either a valid GitHub repository link or upload the full project as a ZIP file.
                </div>
                <Button
                  className="mt-3 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={submitPracticalWork}
                  disabled={taskLoading || (!githubRepoUrl.trim() && !projectZipFile)}
                >
                  {taskLoading ? "Submitting..." : "Submit Practical Work"}
                </Button>
              </div>
            ) : null}
            {practicalTask.status === "FAILED" ? (
              <div className="mt-4">
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <div className="font-semibold text-rose-700">N.B: You failed this practical because your time was not used well.</div>
                  <div className="mt-1">Deadline exceeded. Submission is no longer allowed.</div>
                  <div className="mt-2 text-sm">Default score: 0</div>
                </div>
                <label className="mt-4 mb-2 block font-semibold text-slate-900">
                  Reason for missing submission
                </label>
                <textarea
                  rows={6}
                  value={missedReason}
                  onChange={(e) => setMissedReason(e.target.value)}
                  placeholder="Explain why you missed the submission and include proof details or proof links..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                />
                <div className="mt-2 text-xs text-slate-500">
                  Note: Reasons will only be accepted if they include valid proof.
                </div>
                <label className="mt-4 mb-2 block font-semibold text-slate-900">
                  Proof document or photo
                </label>
                <input
                  type="text"
                  value={missedReasonProof}
                  onChange={(e) => setMissedReasonProof(e.target.value)}
                  placeholder="Paste proof link, document path, or photo reference..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                />
                {practicalTask.missedReasonStatus ? (
                  <div className="mt-3 text-sm text-slate-700">
                    Explanation status: <span className="font-semibold">{practicalTask.missedReasonStatus}</span>
                  </div>
                ) : null}
                <Button
                  className="mt-3 bg-slate-900 text-white hover:bg-slate-800"
                  onClick={submitMissedReason}
                  disabled={taskLoading || !missedReason.trim() || !missedReasonProof.trim() || practicalTask.missedReasonStatus === "PENDING"}
                >
                  {taskLoading ? "Sending..." : "Submit Explanation"}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-0 bg-white p-6 shadow-md lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-emerald-900">Your Track</h2>
              <span className="text-xs text-emerald-600">{lessons.length} sessions</span>
            </div>

            <div className="mt-4 space-y-2">
              {lessons.map((l) => {
                const isActive = l.id === activeId;
                const done = completedSet.has(l.id);

                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setActiveId(l.id)}
                    className={[
                      "w-full rounded-xl border p-3 text-left transition hover:shadow-sm",
                      isActive
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-emerald-100 bg-white hover:bg-emerald-50/50",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-emerald-600">Session {l.sessionNumber}</div>
                      <span
                        className={[
                          "text-[11px] font-semibold px-2 py-1 rounded-full",
                          done ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-800",
                        ].join(" ")}
                      >
                        {done ? "Completed" : "Not completed"}
                      </span>
                    </div>

                    <div className="mt-1 text-sm font-semibold text-emerald-900">{l.title}</div>
                    <div className="mt-1 text-xs text-emerald-600">{l.estMinutes} min</div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="border-0 bg-white p-6 shadow-md lg:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-emerald-600">
                  Session {activeLesson?.sessionNumber} - {level}
                </div>
                <h2 className="mt-1 text-lg font-semibold text-emerald-900">{activeLesson?.title}</h2>
                <p className="mt-2 text-sm text-emerald-700">{activeLesson?.description}</p>
              </div>

              <div className="shrink-0">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                  <div className="text-[11px] text-emerald-600">Estimated</div>
                  <div className="text-sm font-semibold text-emerald-900">{activeLesson?.estMinutes} min</div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm font-semibold text-emerald-900">What you will learn</div>
              <ul className="mt-3 space-y-2">
                {(activeLesson?.outcomes || []).map((x, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-emerald-700">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-600" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={openLesson}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              >
                Open Lesson
              </Button>

              <Button
                onClick={() => activeLesson?.id && markCompleted(activeLesson.id)}
                disabled={!activeLesson?.id || completedSet.has(activeLesson.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-300"
              >
                {completedSet.has(activeLesson?.id || "") ? "Completed" : "Mark as Completed"}
              </Button>
            </div>

            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-sm font-semibold text-emerald-900">Tip</div>
              <p className="mt-1 text-sm text-emerald-700">
                Open the lesson, learn the topic, then come back and mark it as completed to unlock practical.
              </p>
            </div>
          </Card>
        </div>

        <Card className="border-0 bg-white p-6 shadow-md">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-emerald-900">Practical Request</h3>
              <p className="mt-1 text-sm text-emerald-700 max-w-2xl">
                When you feel ready, request the practical task. You will only confirm readiness.
              </p>
              {!allCompleted && (
                <p className="mt-2 text-xs text-emerald-600">Complete all sessions to unlock Practical Request.</p>
              )}
              {practicalStatus === "REJECTED" && (
                <p className="mt-2 text-xs text-rose-600">
                  Your previous request was rejected. You may request again after reviewing your lessons.
                </p>
              )}
            </div>

            <Button
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setReadyOpen(true)}
              disabled={!allCompleted || practicalStatus === "PENDING" || practicalStatus === "APPROVED"}
            >
              {practicalStatus === "PENDING"
                ? "Request Sent (Pending)"
                : practicalStatus === "APPROVED"
                ? "Approved"
                : "Request Practical"}
            </Button>
          </div>
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-sm font-semibold text-emerald-900">Practical Progress</div>
            <div className="mt-1 text-sm text-emerald-700">
              Approved tasks: <span className="font-semibold">{practicalProgress.label}</span>
            </div>
            <div className="mt-1 text-sm text-emerald-700">
              Progress: <span className="font-semibold">{practicalProgress.progressPercent}%</span>
            </div>
            <div className="mt-1 text-sm text-emerald-700">
              Final score: <span className="font-semibold">{practicalProgress.averageScore}%</span>
            </div>
            <div className="mt-1 text-sm text-emerald-700">
              Reputation: <span className="font-semibold">{"⭐".repeat(practicalProgress.reputationRating || 0)}</span>
            </div>
            <div className="mt-1 text-sm text-emerald-700">
              Level status: <span className="font-semibold">{practicalProgress.levelStatus}</span>
            </div>
            <div className="mt-1 text-sm text-emerald-700">
              Certificate status: <span className="font-semibold">{practicalProgress.certificateStatus}</span>
            </div>
            <div className="mt-1 text-xs text-emerald-600">
              {level} requires {practicalProgress.requiredTasks} tasks with a{" "}
              {practicalProgress.deadlineLabel} deadline for each task before certificate approval.
            </div>
            {practicalProgress.certificateEligible ? (
              <div className="mt-2 text-sm font-semibold text-emerald-800">
                Certificate eligible.
              </div>
            ) : practicalProgress.progressPercent === 100 ? (
              <div className="mt-2 text-sm font-semibold text-rose-700">
                Progress: 100% but certificate requires a final score of 90% or higher.
              </div>
            ) : null}
            {practicalProgress.internshipEligible ? (
              <div className="mt-2 text-sm font-semibold text-blue-800">
                Internship pipeline status: Ready for Internship.
              </div>
            ) : null}
          </div>
          {practicalTasks.length ? (
            <div className="mt-4 space-y-2">
              {practicalTasks
                .slice()
                .sort((a, b) => b.taskNumber - a.taskNumber)
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        Task {task.taskNumber}: {task.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        Due: {task.dueAt ? task.dueAt.slice(0, 10) : "-"}{task.deadlineLabel ? ` - ${task.deadlineLabel}` : ""}
                      </div>
                      {(task.status === "APPROVED" || task.status === "FAILED") &&
                      task.score !== null &&
                      typeof task.score !== "undefined" ? (
                        <div className="text-xs font-semibold text-emerald-700">
                          Score: {task.score}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ) : null}
        </Card>

        <Card className="border-0 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-emerald-900">Certificate</h3>
              <p className="mt-1 text-sm text-emerald-700">
                Certificate access is enabled only after admin approval for your completed level.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {certificateData?.certificateStatus || practicalProgress.certificateStatus}
            </span>
          </div>

          {!certificateData?.certificateEligible ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Certificate not yet available. Finish all required tasks for {level} and keep the final score at 90% or above.
            </div>
          ) : null}

          {certificateData?.certificateEligible && !certificateData?.certificate ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="font-semibold">Certificate Pending Admin Approval</div>
              <div className="mt-1">
                Your level is completed. Wait for admin to accept the certificate request.
              </div>
              {certificateData.request?.adminNote ? (
                <div className="mt-2 text-slate-700">Admin note: {certificateData.request.adminNote}</div>
              ) : null}
            </div>
          ) : null}

          {certificateData?.certificateStatus === "REJECTED" ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <div className="font-semibold">Certificate request was rejected</div>
              {certificateData.request?.adminNote ? (
                <div className="mt-1">Admin note: {certificateData.request.adminNote}</div>
              ) : null}
            </div>
          ) : null}

          {certificateData?.certificate ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Certificate ID
                  </div>
                  <div className="mt-1 font-semibold text-emerald-950">
                    {certificateData.certificate.certificateId}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Issue Date
                  </div>
                  <div className="mt-1 font-semibold text-emerald-950">
                    {certificateData.certificate.issueDate
                      ? new Date(certificateData.certificate.issueDate).toISOString().slice(0, 10)
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Level
                  </div>
                  <div className="mt-1 font-semibold text-emerald-950">
                    {certificateData.certificate.level}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Verification
                  </div>
                  <div className="mt-1 font-semibold text-emerald-950">
                    {certificateData.certificate.isValid ? "Valid Certificate" : "Invalid Certificate"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}${certificateData.certificate.viewUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  View Certificate
                </a>
                <a
                  href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}${certificateData.certificate.downloadUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Download Certificate
                </a>
                <a
                  href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}${certificateData.certificate.verifyUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Verify Certificate
                </a>
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <Modal open={readyOpen} title="Confirm readiness" onClose={() => setReadyOpen(false)}>
        <p className="text-sm text-emerald-700">
          Confirm that you completed the learning sessions and you are ready to start the practical task.
        </p>

        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            className="w-1/2 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            onClick={() => setReadyOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={requestPractical}
            disabled={requestLoading}
          >
            {requestLoading ? "Sending..." : "Yes, Request Practical"}
          </Button>
        </div>

        <div className="mt-3 text-[11px] text-emerald-600">
          Your request will be sent as <span className="font-semibold">Pending</span> until admin approval.
        </div>
      </Modal>
    </div>
  );
}
