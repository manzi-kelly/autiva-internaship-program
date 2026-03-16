import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileArchive,
  FileWarning,
  Link as LinkIcon,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api } from "../lib/apiClient";
import { getStudentSocket } from "../lib/socket";
import { useAuth } from "../store/auth";
import DashboardLayout from "../components/user/DashboardLayout";
import StatusBadge from "../components/user/StatusBadge";
import {
  buildTrack,
  formatDateTime,
  getDefaultPracticalProgress,
  readCompletedLessonIds,
  type CertificateData,
  type Level,
  type PracticalProgress,
  type PracticalRequest,
  type PracticalRequestStatus,
  type PracticalTask,
  type PracticalTaskItem,
} from "../lib/userDashboard";

function CardSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function SummaryCard({
  title,
  value,
  description,
  badge,
}: {
  title: string;
  value: string;
  description: string;
  badge?: ReactNode;
}) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {badge}
      </div>
    </div>
  );
}

export default function PracticalPage() {
  const { user } = useAuth();
  const level = (user?.level || "L3") as Level;
  const lessons = useMemo(() => buildTrack(level), [level]);
  const allLessonsCompleted = readCompletedLessonIds(user?.id, level).length >= lessons.length;

  const [requestStatus, setRequestStatus] = useState<PracticalRequestStatus>("NONE");
  const [requestMessage, setRequestMessage] = useState("");
  const [task, setTask] = useState<PracticalTask | null>(null);
  const [taskHistory, setTaskHistory] = useState<PracticalTaskItem[]>([]);
  const [progress, setProgress] = useState<PracticalProgress>(getDefaultPracticalProgress(level));
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [projectZipFile, setProjectZipFile] = useState<File | null>(null);
  const [missedReason, setMissedReason] = useState("");
  const [missedReasonProof, setMissedReasonProof] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPracticalState() {
      try {
        const [requestRes, taskRes, certificateRes] = await Promise.all([
          api.get<{ request: PracticalRequest | null }>("/requests/practical/me"),
          api.get<{ task: PracticalTask | null; tasks: PracticalTaskItem[]; progress: PracticalProgress }>("/practical-tasks/me"),
          api.get<CertificateData>("/user/certificate"),
        ]);

        if (cancelled) return;

        setRequestStatus(requestRes.data.request?.status || "NONE");
        setRequestMessage(requestRes.data.request?.message || "");
        setTask(taskRes.data.task);
        setTaskHistory(taskRes.data.tasks || []);
        setProgress(taskRes.data.progress || getDefaultPracticalProgress(level));
        setCertificate(certificateRes.data);
        setGithubRepoUrl(taskRes.data.task?.githubRepoUrl || "");
        setMissedReason(taskRes.data.task?.missedReason || "");
        setMissedReasonProof(taskRes.data.task?.missedReasonProof || "");
        setProjectZipFile(null);
      } catch (error: any) {
        if (cancelled) return;
        setErrorMessage(error?.response?.data?.message || "Failed to load practical workflow");
      }
    }

    loadPracticalState();

    const interval = window.setInterval(loadPracticalState, 15000);
    const socket = getStudentSocket();

    const handleTaskUpdate = (payload: { userId?: string }) => {
      if (payload?.userId === user?.id) loadPracticalState();
    };

    const handleCertificateUpdate = (payload: { userId?: string }) => {
      if (payload?.userId === user?.id) loadPracticalState();
    };

    socket.on("task:updated", handleTaskUpdate);
    socket.on("certificate:updated", handleCertificateUpdate);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      socket.off("task:updated", handleTaskUpdate);
      socket.off("certificate:updated", handleCertificateUpdate);
    };
  }, [level, user?.id]);

  async function requestPractical() {
    setErrorMessage("");
    setRequestLoading(true);
    try {
      const res = await api.post<{ message: string; request: PracticalRequest }>("/requests/practical", {});
      setRequestStatus(res.data.request.status);
      setRequestMessage(res.data.message);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || "Failed to submit practical request");
    } finally {
      setRequestLoading(false);
    }
  }

  async function confirmTask() {
    if (!task) return;
    setErrorMessage("");
    setTaskLoading(true);
    try {
      const res = await api.post<{ task: PracticalTask }>(`/practical-tasks/${task.id}/confirm`, {});
      setTask(res.data.task);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || "Failed to confirm practical task");
    } finally {
      setTaskLoading(false);
    }
  }

  async function submitTask() {
    if (!task) return;
    setErrorMessage("");
    setTaskLoading(true);

    try {
      const formData = new FormData();
      if (githubRepoUrl) formData.append("githubRepoUrl", githubRepoUrl);
      if (projectZipFile) formData.append("projectZip", projectZipFile);

      const res = await api.post<{ task: PracticalTask }>(`/practical-tasks/${task.id}/submit`, formData);
      setTask(res.data.task);
      setProjectZipFile(null);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || "Failed to submit practical work");
    } finally {
      setTaskLoading(false);
    }
  }

  async function submitExplanation() {
    if (!task) return;
    setErrorMessage("");
    setTaskLoading(true);

    try {
      const res = await api.post<{ task: PracticalTask }>(`/practical-tasks/${task.id}/explanation`, {
        reason: missedReason,
        proofReference: missedReasonProof,
      });
      setTask(res.data.task);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || "Failed to submit explanation");
    } finally {
      setTaskLoading(false);
    }
  }

  const canShowAssignedTask = allLessonsCompleted && !!task;
  const allowSubmission = task?.status === "CONFIRMED" || task?.status === "REJECTED";
  const hasSubmittedWork = Boolean(task?.githubRepoUrl || task?.projectZipFilename || task?.status === "SUBMITTED" || task?.status === "MEETING_REQUESTED" || task?.status === "APPROVED" || task?.status === "FAILED_REVIEW");
  const showMeetingState = task?.status === "MEETING_REQUESTED" || task?.status === "SUBMITTED";
  const showFailureReason = task?.status === "FAILED";
  const showFinalReview = task?.status === "APPROVED" || task?.status === "FAILED_REVIEW";

  return (
    <DashboardLayout
      title="Practical"
      subtitle="Manage your practical request, task submission, review status, and certificate access."
    >
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-700 p-6 text-white shadow-xl lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-200">
                Practical Workflow
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">
                Practical Session
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 lg:text-base">
                Follow your practical request, assigned task, submission process, and certificate readiness in one clean page.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-200">Request</p>
                <p className="mt-2 text-lg font-semibold">{requestStatus}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-200">Progress</p>
                <p className="mt-2 text-lg font-semibold">{progress.progressPercent}%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-200">Certificate</p>
                <p className="mt-2 text-lg font-semibold">{certificate?.certificateStatus || "Not ready"}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Request status"
            value={requestStatus}
            description={requestMessage || "No practical request submitted yet."}
            badge={<StatusBadge status={requestStatus} />}
          />
          <SummaryCard
            title="Task progress"
            value={progress.label}
            description={`${progress.progressPercent}% complete · ${progress.deadlineLabel}`}
          />
          <SummaryCard
            title="Average score"
            value={`${Math.round(progress.averageScore || certificate?.averageScore || 0)}%`}
            description="Visible after admin completes the review."
          />
          <SummaryCard
            title="Certificate"
            value={certificate?.certificateStatus || "Not ready"}
            description={certificate?.certificateEligible ? "Ready for admin approval" : "Keep progressing"}
            badge={<StatusBadge status={certificate?.certificateStatus || "NOT_ELIGIBLE"} />}
          />
        </section>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.45fr,1fr]">
          <div className="space-y-6">
            <CardSection
              title="Practical request"
              subtitle="You can request a practical task only after finishing all lessons in your learning track."
            >
              {allLessonsCompleted ? (
                <div className="space-y-4">
                  <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Learning completed</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          You completed all lessons for {level}. You can now continue with the practical request process.
                        </p>
                      </div>
                      <StatusBadge status={requestStatus}>
                        {requestStatus === "NONE" ? "Ready" : requestStatus}
                      </StatusBadge>
                    </div>
                  </div>

                  {requestStatus === "NONE" ? (
                    <button
                      type="button"
                      onClick={requestPractical}
                      disabled={requestLoading}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {requestLoading ? "Submitting..." : "Request practical"}
                    </button>
                  ) : (
                    <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      {requestMessage || "Your practical request is in progress. Please wait for admin review."}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                  You must finish all lessons first before the practical session becomes available.
                </div>
              )}
            </CardSection>

            {canShowAssignedTask ? (
              <CardSection
                title="Assigned practical task"
                subtitle="This section becomes available after you complete learning and receive a task from admin."
              >
                <div className="space-y-5">
                  <div className="rounded-[1.8rem] bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Task {task.taskNumber}</p>
                        <h3 className="mt-2 text-xl font-bold text-slate-950">{task.title}</h3>
                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                          {task.description}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <StatusBadge status={task.status} />
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                          <div className="flex items-center gap-2 text-slate-900">
                            <Clock3 className="h-4 w-4" />
                            <span className="font-semibold">Deadline</span>
                          </div>
                          <p className="mt-2">{task.deadlineLabel}</p>
                          <p className="text-xs text-slate-500">Due {formatDateTime(task.dueAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(task.status === "ASSIGNED" || task.status === "SEEN") && !hasSubmittedWork ? (
                    <div className="rounded-[1.6rem] border border-blue-200 bg-blue-50 p-5">
                      <div className="flex items-start gap-3">
                        <Sparkles className="mt-0.5 h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900">Task assigned</p>
                          <p className="mt-1 text-sm text-blue-800">
                            Please confirm that you are ready to start this practical task.
                          </p>
                          <button
                            type="button"
                            onClick={confirmTask}
                            disabled={taskLoading}
                            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {taskLoading ? "Confirming..." : "Confirm task"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {allowSubmission && !hasSubmittedWork ? (
                    <div className="grid gap-4 rounded-[1.6rem] border border-slate-200 bg-white p-5 lg:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-900">GitHub Repository URL</label>
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <LinkIcon className="h-4 w-4 text-slate-400" />
                          <input
                            value={githubRepoUrl}
                            onChange={(event) => setGithubRepoUrl(event.target.value)}
                            placeholder="https://github.com/username/project"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-900">Project ZIP upload</label>
                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-100">
                          <FileArchive className="h-5 w-5 text-slate-400" />
                          <span>{projectZipFile?.name || task.projectZipFilename || "Choose a .zip project file"}</span>
                          <input
                            type="file"
                            accept=".zip"
                            className="hidden"
                            onChange={(event) => setProjectZipFile(event.target.files?.[0] || null)}
                          />
                        </label>
                      </div>

                      <div className="lg:col-span-2">
                        <button
                          type="button"
                          onClick={submitTask}
                          disabled={taskLoading}
                          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <Send className="h-4 w-4" />
                          {taskLoading ? "Submitting..." : "Submit task"}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {hasSubmittedWork ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">GitHub link</p>
                        <a
                          href={task.githubRepoUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          {task.githubRepoUrl || "Not submitted"}
                          {task.githubRepoUrl ? <ExternalLink className="h-4 w-4" /> : null}
                        </a>
                      </div>

                      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Uploaded ZIP</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {task.projectZipFilename || "No ZIP uploaded"}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {showMeetingState ? (
                    <div className="rounded-[1.6rem] border border-blue-200 bg-blue-50 p-5">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900">Submission under review</p>
                          <p className="mt-1 text-sm text-blue-800">
                            Your task has already been submitted. Please wait for admin review.
                          </p>
                          {task.reviewNote ? (
                            <p className="mt-3 text-sm text-blue-900">{task.reviewNote}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {showFinalReview ? (
                    <div
                      className={`rounded-[1.6rem] border p-5 ${
                        task.status === "APPROVED"
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-rose-200 bg-rose-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {task.status === "APPROVED" ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-600" />
                        )}

                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              task.status === "APPROVED" ? "text-emerald-900" : "text-rose-900"
                            }`}
                          >
                            {task.status === "APPROVED" ? "Task approved" : "Task review failed"}
                          </p>
                          <p
                            className={`mt-1 text-sm ${
                              task.status === "APPROVED" ? "text-emerald-800" : "text-rose-800"
                            }`}
                          >
                            Final score: {task.score ?? 0}
                          </p>
                          {task.reviewNote ? (
                            <p
                              className={`mt-3 text-sm ${
                                task.status === "APPROVED" ? "text-emerald-900" : "text-rose-900"
                              }`}
                            >
                              {task.reviewNote}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {showFailureReason ? (
                    <div className="rounded-[1.6rem] border border-rose-200 bg-rose-50 p-5">
                      <div className="flex items-start gap-3">
                        <FileWarning className="mt-0.5 h-5 w-5 text-rose-600" />
                        <div className="w-full">
                          <p className="text-sm font-semibold text-rose-900">Task failed</p>
                          <p className="mt-1 text-sm text-rose-800">
                            Deadline exceeded. Submission is no longer allowed.
                          </p>

                          <div className="mt-4 grid gap-4">
                            <div>
                              <label className="text-sm font-semibold text-slate-900">
                                Reason for missing submission
                              </label>
                              <textarea
                                value={missedReason}
                                onChange={(event) => setMissedReason(event.target.value)}
                                rows={4}
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
                                placeholder="Explain why you missed the deadline"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-semibold text-slate-900">
                                Proof document or photo reference
                              </label>
                              <input
                                value={missedReasonProof}
                                onChange={(event) => setMissedReasonProof(event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
                                placeholder="Paste proof link or file reference"
                              />
                              <p className="mt-2 text-xs text-slate-500">
                                Reasons are only accepted if valid proof is included.
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={submitExplanation}
                                disabled={taskLoading || task.missedReasonStatus === "PENDING"}
                                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                              >
                                <Send className="h-4 w-4" />
                                {taskLoading
                                  ? "Sending..."
                                  : task.missedReasonStatus === "PENDING"
                                  ? "Explanation pending"
                                  : "Submit explanation"}
                              </button>

                              {task.missedReasonStatus ? (
                                <StatusBadge status={task.missedReasonStatus}>
                                  {task.missedReasonStatus}
                                </StatusBadge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardSection>
            ) : null}
          </div>

          <div className="space-y-6">
            <CardSection
              title="Practical progress"
              subtitle="Your current practical completion and score overview."
            >
              <div className="space-y-4">
                <div className="rounded-[1.6rem] bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">Progress</p>
                    <StatusBadge status={progress.certificateEligible ? "APPROVED" : "PENDING"}>
                      {progress.label}
                    </StatusBadge>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${progress.progressPercent}%` }}
                    />
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    Progress: {progress.progressPercent}%
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Final score</p>
                  <p className="mt-2 text-xl font-bold text-slate-950">
                    {Math.round(progress.averageScore)}%
                  </p>
                </div>
              </div>
            </CardSection>

            <CardSection
              title="Task history"
              subtitle="All practical tasks and their latest review status."
            >
              <div className="space-y-3">
                {taskHistory.length ? (
                  taskHistory.map((item) => (
                    <div key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Task {item.taskNumber}</p>
                          <p className="mt-1 text-sm text-slate-600">{item.title}</p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500">
                        <span>Due {formatDateTime(item.dueAt)}</span>
                        <span>Score: {item.score ?? "Pending"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-600">
                    Your task history will appear after your first practical task is assigned.
                  </div>
                )}
              </div>
            </CardSection>

            <CardSection
              title="Certificate summary"
              subtitle="Certificate access appears only after all practical requirements are completed and approved."
            >
              <div className="space-y-4">
                <div className="rounded-[1.6rem] bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">Certificate status</p>
                    <StatusBadge status={certificate?.certificateStatus || "NOT_ELIGIBLE"} />
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {certificate?.certificate
                      ? `Certificate ${certificate.certificate.certificateId} is available.`
                      : certificate?.request?.status === "PENDING"
                      ? "Certificate pending admin approval"
                      : "Certificate not yet available"}
                  </p>
                </div>

                {certificate?.certificate ? (
                  <div className="grid gap-3">
                    <a
                      href={certificate.certificate.viewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      View certificate
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    <a
                      href={certificate.certificate.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Download certificate
                      <Download className="h-4 w-4" />
                    </a>

                    <a
                      href={certificate.certificate.verifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Verify certificate
                      <ShieldCheck className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                    {certificate?.request?.status === "REJECTED"
                      ? certificate.request.adminNote || "Certificate request was rejected by admin."
                      : "Your certificate will appear here after you complete the practical process and receive admin approval."}
                  </div>
                )}
              </div>
            </CardSection>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
