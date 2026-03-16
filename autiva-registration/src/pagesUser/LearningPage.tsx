import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookMarked, CheckCircle2, Clock3, ExternalLink, GraduationCap } from "lucide-react";
import DashboardLayout from "../components/user/DashboardLayout";
import StatusBadge from "../components/user/StatusBadge";
import { useAuth } from "../store/auth";
import {
  buildTrack,
  calculateLessonProgress,
  lessonUrl,
  readCompletedLessonIds,
  writeCompletedLessonIds,
  type Level,
} from "../lib/userDashboard";

export default function LearningPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const level = (user?.level || "L3") as Level;
  const lessons = useMemo(() => buildTrack(level), [level]);
  const [completedIds, setCompletedIds] = useState<string[]>(() => readCompletedLessonIds(user?.id, level));
  const [activeLessonId, setActiveLessonId] = useState<string>(lessons[0]?.id || "");

  const activeLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0],
    [activeLessonId, lessons]
  );
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const progressPercent = calculateLessonProgress(completedIds.length, lessons.length);
  const allCompleted = lessons.length > 0 && completedIds.length >= lessons.length;

  function markLessonCompleted(lessonId: string) {
    if (completedSet.has(lessonId)) return;
    const next = [...completedIds, lessonId];
    setCompletedIds(next);
    writeCompletedLessonIds(user?.id, level, next);
  }

  return (
    <DashboardLayout
      title="Learning"
      subtitle="Follow the lesson pathway for your level, save progress locally, and unlock your practical request."
    >
      <div className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[340px,1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Your lesson track</p>
                <p className="mt-1 text-sm text-slate-500">Level {level} guided sessions</p>
              </div>
              <StatusBadge status={allCompleted ? "APPROVED" : "PENDING"}>{allCompleted ? "Ready" : "Learning"}</StatusBadge>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>{completedIds.length}/{lessons.length} complete</span>
              <span>{progressPercent}%</span>
            </div>

            <div className="mt-6 space-y-3">
              {lessons.map((lesson) => {
                const isCompleted = completedSet.has(lesson.id);
                const isActive = activeLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setActiveLessonId(lesson.id)}
                    className={[
                      "w-full rounded-2xl border p-4 text-left transition",
                      isActive ? "border-emerald-200 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Session {lesson.sessionNumber}</p>
                        <h3 className="mt-2 text-sm font-semibold text-slate-900">{lesson.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{lesson.topic}</p>
                      </div>
                      {isCompleted ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <BookMarked className="h-5 w-5 text-slate-300" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-700 p-6 text-white shadow-xl lg:p-8">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-200">Focused Study Session</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">{activeLesson?.title}</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200 lg:text-base">{activeLesson?.description}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-100">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
                  <Clock3 className="h-4 w-4" />
                  {activeLesson?.estMinutes} mins
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
                  <GraduationCap className="h-4 w-4" />
                  {level} track
                </span>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Expected outcomes</p>
                  <p className="mt-1 text-sm text-slate-500">Use the lesson material and complete each session before moving to the practical page.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => window.open(lessonUrl(activeLesson.topic), "_blank", "noopener,noreferrer")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Open material
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => markLessonCompleted(activeLesson.id)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Mark completed
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {activeLesson.outcomes.map((outcome) => (
                  <div key={outcome} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <p className="text-sm text-slate-700">{outcome}</p>
                  </div>
                ))}
              </div>
            </section>

            {allCompleted ? (
              <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Learning complete</p>
                    <h2 className="mt-2 text-xl font-bold text-emerald-950">You are now eligible to request a practical task.</h2>
                    <p className="mt-2 text-sm text-emerald-800">
                      Please go to the Practical page to submit your request and continue with the internship program.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/user/practical")}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    Go to Practical page
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
