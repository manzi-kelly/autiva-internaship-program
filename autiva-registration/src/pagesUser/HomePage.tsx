import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import { api } from "../lib/apiClient";
import { getStudentSocket } from "../lib/socket";
import { useAuth } from "../store/auth";
import DashboardLayout from "../components/user/DashboardLayout";
import StatusBadge from "../components/user/StatusBadge";
import {
  buildTrack,
  calculateLessonProgress,
  formatDateTime,
  getDefaultPracticalProgress,
  readCompletedLessonIds,
  type CertificateData,
  type Level,
  type PracticalProgress,
  type PracticalRequest,
  type PracticalTask,
  type PracticalTaskItem,
} from "../lib/userDashboard";

function OverviewCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof BookOpen;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const level = (user?.level || "L3") as Level;
  const lessons = useMemo(() => buildTrack(level), [level]);
  const completedLessonIds = useMemo(
    () => readCompletedLessonIds(user?.id, level),
    [level, user?.id]
  );

  const completedCount = completedLessonIds.length;
  const lessonProgress = calculateLessonProgress(completedCount, lessons.length);

  const currentLesson =
    lessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ||
    lessons[lessons.length - 1];

  const [request, setRequest] = useState<PracticalRequest | null>(null);
  const [task, setTask] = useState<PracticalTask | null>(null);
  const [tasks, setTasks] = useState<PracticalTaskItem[]>([]);
  const [progress, setProgress] = useState<PracticalProgress>(
    getDefaultPracticalProgress(level)
  );
  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        const [requestRes, taskRes, certificateRes] = await Promise.all([
          api.get<{ request: PracticalRequest | null }>("/requests/practical/me"),
          api.get<{
            task: PracticalTask | null;
            tasks: PracticalTaskItem[];
            progress: PracticalProgress;
          }>("/practical-tasks/me"),
          api.get<CertificateData>("/user/certificate"),
        ]);

        if (cancelled) return;

        setRequest(requestRes.data.request);
        setTask(taskRes.data.task);
        setTasks(taskRes.data.tasks || []);
        setProgress(taskRes.data.progress || getDefaultPracticalProgress(level));
        setCertificate(certificateRes.data);
      } catch {
        if (cancelled) return;

        setRequest(null);
        setTask(null);
        setTasks([]);
        setProgress(getDefaultPracticalProgress(level));
        setCertificate(null);
      }
    }

    loadOverview();

    const interval = window.setInterval(loadOverview, 15000);
    const socket = getStudentSocket();

    const handleTaskUpdate = (payload: { userId?: string }) => {
      if (payload?.userId === user?.id) loadOverview();
    };

    const handleCertificateUpdate = (payload: { userId?: string }) => {
      if (payload?.userId === user?.id) loadOverview();
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

  const participationLabel =
    progress.reputationRating >= 4
      ? "Excellent"
      : progress.reputationRating >= 2
      ? "Growing"
      : "Building";

  const latestScore =
    Math.round(progress.averageScore || certificate?.averageScore || 0) || 0;

  const learningStatus =
    lessonProgress >= 100
      ? "Completed"
      : lessonProgress >= 70
      ? "Strong progress"
      : lessonProgress >= 40
      ? "On track"
      : "Getting started";

  const analysisItems = [
    {
      label: "Track level",
      value: level,
    },
    {
      label: "Completed lessons",
      value: `${completedCount} / ${lessons.length}`,
    },
    {
      label: "Learning status",
      value: learningStatus,
    },
    {
      label: "Certificate status",
      value: certificate?.certificateStatus || "Not ready",
    },
  ];

  return (
    <DashboardLayout
      title="Overview"
      subtitle="A clean summary of your learning journey, progress, and performance."
    >
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-700 p-6 text-white shadow-xl lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-200">
                Autiva Learning Dashboard
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">
                Welcome back, {user?.fullName?.split(" ")[0] || "Student"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 lg:text-base">
                Follow your current session, progress, participation, and overall
                performance from one organized dashboard.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-200">
                  Level
                </p>
                <p className="mt-2 text-2xl font-bold">{level}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-200">
                  Progress
                </p>
                <p className="mt-2 text-2xl font-bold">{lessonProgress}%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-200">
                  Score
                </p>
                <p className="mt-2 text-2xl font-bold">{latestScore}%</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            title="Current learning session"
            value={currentLesson?.title || "Ready"}
            description={`Session ${
              currentLesson?.sessionNumber || lessons.length
            } for ${level}`}
            icon={BookOpen}
          />
          <OverviewCard
            title="Learning progress"
            value={`${lessonProgress}%`}
            description={`${completedCount} of ${lessons.length} lessons completed`}
            icon={Target}
          />
          <OverviewCard
            title="Participation level"
            value={participationLabel}
            description={`Reputation rating: ${progress.reputationRating.toFixed(
              1
            )} / 5`}
            icon={Activity}
          />
          <OverviewCard
            title="Average score"
            value={`${latestScore}%`}
            description="Your current overall performance score"
            icon={Award}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Learning activity
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Continue with your next lesson and keep building steady progress.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/user/learning")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Open learning
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Current lesson
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">
                      {currentLesson?.title || "All lessons completed"}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {currentLesson?.description ||
                        "You have completed the current learning track. You can now focus on your next academic step."}
                    </p>
                  </div>

                  <StatusBadge
                    status={completedCount >= lessons.length ? "APPROVED" : "PENDING"}
                  >
                    {completedCount >= lessons.length
                      ? "Lessons complete"
                      : "In progress"}
                  </StatusBadge>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${lessonProgress}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                  <span>{completedCount} lessons completed</span>
                  <span>{lessonProgress}% total progress</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Overall learning analysis
                  </p>
                  <p className="text-sm text-slate-500">
                    A simple summary of your academic standing and progress.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {analysisItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Participation and activity
                  </p>
                  <p className="text-sm text-slate-500">
                    Measured from consistency, reviews, and progress behavior.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-bold text-slate-950">
                      {participationLabel}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Reputation rating: {progress.reputationRating.toFixed(1)} / 5
                    </p>
                  </div>

                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-5 w-5 ${
                          index < Math.round(progress.reputationRating)
                            ? "fill-current"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Score summary
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Your current overall score and certificate readiness.
                  </p>
                </div>
                <StatusBadge status={certificate?.certificateStatus || "NOT_ELIGIBLE"} />
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Overall score
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {latestScore}%
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Certificate readiness
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {certificate?.certificateEligible
                      ? "Eligible and ready for admin decision"
                      : "Continue improving progress and score to reach certificate eligibility."}
                  </p>
                </div>

                {certificate?.certificate ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
                      Approved certificate
                    </p>
                    <p className="mt-2 text-sm font-semibold text-emerald-900">
                      {certificate.certificate.certificateId}
                    </p>
                    <p className="mt-1 text-sm text-emerald-800">
                      Issued {formatDateTime(certificate.certificate.issueDate)}
                    </p>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => navigate("/user/learning")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Continue learning
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
