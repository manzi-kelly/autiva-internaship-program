import { api } from "../../lib/apiClient";
import type { Lesson, Task, SubmissionStatus } from "../../types";

export async function getMyLessons() {
  const res = await api.get<{ lessons: Lesson[] }>("/lessons/my");
  return res.data.lessons;
}

export async function getTasksByLesson(lessonId: string) {
  const res = await api.get<{ tasks: Array<Task & { status: SubmissionStatus }> }>(`/tasks/by-lesson/${lessonId}`);
  return res.data.tasks;
}