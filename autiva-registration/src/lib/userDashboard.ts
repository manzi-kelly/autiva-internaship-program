import type { User } from "../types";

export type Level = "L3" | "L4" | "L5";

export type Topic =
  | "HTML"
  | "CSS"
  | "JAVASCRIPT"
  | "PHP"
  | "NODE"
  | "MYSQL"
  | "REACT"
  | "MOBILE_APP";

export type Lesson = {
  id: string;
  level: Level;
  sessionNumber: number;
  topic: Topic;
  title: string;
  description: string;
  outcomes: string[];
  estMinutes: number;
};

export type PracticalTaskStatus =
  | "ASSIGNED"
  | "SEEN"
  | "CONFIRMED"
  | "SUBMITTED"
  | "MEETING_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "FAILED"
  | "FAILED_REVIEW";

export type PracticalRequestStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export type PracticalRequest = {
  id: string;
  status: Exclude<PracticalRequestStatus, "NONE">;
  message?: string;
  requestedAt: string | null;
};

export type PracticalTask = {
  id: string;
  taskNumber: number;
  deadlineHours: number;
  deadlineLabel: string;
  dueAt: string | null;
  title: string;
  description: string;
  status: PracticalTaskStatus;
  githubRepoUrl?: string;
  projectZipFilename?: string;
  score?: number | null;
  missedReason?: string;
  missedReasonProof?: string;
  missedReasonStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | null;
  reviewNote?: string;
};

export type PracticalTaskItem = {
  id: string;
  taskNumber: number;
  title: string;
  status: PracticalTaskStatus;
  dueAt: string | null;
  deadlineLabel?: string;
  score?: number | null;
};

export type PracticalProgress = {
  approvedCount: number;
  requiredTasks: number;
  label: string;
  progressPercent: number;
  totalScore: number;
  averageScore: number;
  deadlineHours: number;
  deadlineLabel: string;
  certificateEligible: boolean;
  reputationRating: number;
  completedTasks: number;
  levelStatus: string;
  internshipEligible: boolean;
  certificateStatus: string;
};

export type CertificateRequest = {
  id: string;
  level: string;
  finalScore: number;
  progressPercent: number;
  status: string;
  requestedAt: string | null;
  reviewedAt: string | null;
  adminNote: string;
};

export type CertificateRecord = {
  certificateId: string;
  level: string;
  finalScore: number;
  issueDate: string | null;
  isValid: boolean;
  generatedFormat?: string;
  viewUrl: string;
  verifyUrl: string;
  downloadUrl: string;
};

export type CertificateData = {
  certificateStatus: string;
  certificateEligible: boolean;
  averageScore: number;
  completedTasks: number;
  request: CertificateRequest | null;
  certificate: CertificateRecord | null;
};

export type UserNotification = {
  id: string;
  title: string;
  message: string;
  type: "GENERAL" | "PRACTICAL" | "SCORE" | "CERTIFICATE" | string;
  targetPage: string;
  isRead: boolean;
  createdAt: string | null;
};

export type DashboardUser = Pick<User, "id" | "fullName" | "level" | "status">;

export function lessonUrl(topic: Topic): string {
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

export function buildTrack(level: Level): Lesson[] {
  if (level === "L3") {
    return [
      {
        id: "L3-HTML",
        level: "L3",
        sessionNumber: 1,
        topic: "HTML",
        title: "HTML Fundamentals",
        description: "Learn how to structure modern web pages using semantic HTML.",
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
        description: "Learn styling, spacing, layout, and responsiveness.",
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
          "Variables, functions, arrays, and objects",
          "Handle events and update the DOM",
          "Build an interactive feature such as form validation",
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
          "Understand PHP syntax and core concepts",
          "Work with forms and request data",
          "Apply backend validation patterns",
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
        description: "Learn relational database fundamentals using MySQL.",
        estMinutes: 110,
        outcomes: [
          "Create tables, keys, and relationships",
          "Write core SQL queries",
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
      title: "React.js Modern UI Engineering",
      description: "Build scalable UIs with reusable components and strong architecture.",
      estMinutes: 120,
      outcomes: [
        "Use components, props, state, and composition",
        "Build routing and protected pages",
        "Apply production-ready UI structure patterns",
      ],
    },
    {
      id: "L5-FLUTTER",
      level: "L5",
      sessionNumber: 2,
      topic: "MOBILE_APP",
      title: "Mobile App Development Pathway",
      description: "Follow the Flutter pathway and build real mobile apps.",
      estMinutes: 140,
      outcomes: [
        "Learn Flutter fundamentals and widgets",
        "Understand state management basics",
        "Build and run a real Flutter app end to end",
      ],
    },
  ];
}

export function getDefaultPracticalProgress(level: Level): PracticalProgress {
  const requiredTasks = level === "L5" ? 2 : 4;
  const deadlineHours = level === "L5" ? 4 : level === "L4" ? 72 : 48;
  const deadlineLabel = level === "L5" ? "4 hours" : level === "L4" ? "3 days" : "2 days";

  return {
    approvedCount: 0,
    requiredTasks,
    label: `0/${requiredTasks}`,
    progressPercent: 0,
    totalScore: 0,
    averageScore: 0,
    deadlineHours,
    deadlineLabel,
    certificateEligible: false,
    reputationRating: 0,
    completedTasks: 0,
    levelStatus: "LEARNING",
    internshipEligible: false,
    certificateStatus: "NOT_ELIGIBLE",
  };
}

export function getLessonProgressKey(userId: string | undefined, level: Level): string {
  return userId ? `autiva_completed_${userId}_${level}` : `autiva_completed_unknown_${level}`;
}

export function readCompletedLessonIds(userId: string | undefined, level: Level): string[] {
  try {
    const raw = localStorage.getItem(getLessonProgressKey(userId, level));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function writeCompletedLessonIds(userId: string | undefined, level: Level, ids: string[]) {
  localStorage.setItem(getLessonProgressKey(userId, level), JSON.stringify(ids));
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function calculateLessonProgress(completedCount: number, totalLessons: number) {
  if (!totalLessons) return 0;
  return Math.min(100, Math.round((completedCount / totalLessons) * 100));
}

export function getNotificationTarget(notification: UserNotification) {
  if (notification.targetPage) return notification.targetPage;
  if (notification.type === "PRACTICAL") return "/user/practical";
  if (notification.type === "SCORE") return "/user/home";
  if (notification.type === "CERTIFICATE") return "/user/practical";
  return "/user/notifications";
}
