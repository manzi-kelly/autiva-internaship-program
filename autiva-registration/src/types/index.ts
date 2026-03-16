export type Level = "L3" | "L4" | "L5";

export type UserStatus =
  | "NEW"
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "REJECTED_PAYMENT";

export type Role = "STUDENT" | "ADMIN";

export type User = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  level: Level;
  role: Role;
  status: UserStatus;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type PaymentMethod = "MTN" | "AIRTEL" | "CARD";

export type PaymentProof = {
  id: string;
  referenceCode: string;
  method: PaymentMethod;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string | null;
  createdAt: string;
};

export type Lesson = {
  id: string;
  level: Level;
  sessionNumber: number;
  title: string;
  description: string;
  contentUrl?: string | null;
};

export type Task = {
  id: string;
  lessonId: string;
  title: string;
  instructions: string;
  orderIndex: number;
};

export type SubmissionStatus = "NOT_STARTED" | "SUBMITTED" | "REJECTED" | "APPROVED";

export type TaskSubmission = {
  id: string;
  taskId: string;
  status: Exclude<SubmissionStatus, "NOT_STARTED">;
  attemptNumber: number;
  screenshotUrl: string;
  adminNote?: string | null;
  createdAt: string;
};