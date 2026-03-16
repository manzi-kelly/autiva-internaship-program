require("dotenv").config();
const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Server } = require("socket.io");
const { pool, ensureTables } = require("./db");
const { GITHUB_REPO_REGEX, validateSubmissionArtifacts } = require("./services/evaluationEngine");
const { generateCertificateAsset } = require("./services/certificateGenerationService");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = Number(process.env.PORT) || 4000;
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "autiva_dev_access_secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "autiva_dev_refresh_secret";
const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";
const REQUEST_RECEIVED_MESSAGE =
  "Your request has been received. Please wait for a response shortly.";
const PRACTICAL_RULES = {
  L3: { requiredTasks: 4, deadlineHours: 48, deadlineLabel: "2 days" },
  L4: { requiredTasks: 4, deadlineHours: 72, deadlineLabel: "3 days" },
  L5: { requiredTasks: 2, deadlineHours: 4, deadlineLabel: "4 hours" },
};

const PHONE_REGEX = /^2507\d{8}$/;
const LEVELS = ["L3", "L4", "L5"];
const PAYMENT_AMOUNT = { L3: 180000, L4: 220000, L5: 280000 };
const VALID_PAYMENT_METHODS = ["MTN", "AIRTEL", "CARD"];
const DEADLINE_SWEEP_INTERVAL_MS = Number(process.env.DEADLINE_SWEEP_INTERVAL_MS) || 60000;
const CERTIFICATE_PASS_SCORE = Number(process.env.CERTIFICATE_PASS_SCORE) || 90;
const MAX_PRACTICAL_ZIP_SIZE_BYTES =
  Number(process.env.MAX_PRACTICAL_ZIP_SIZE_BYTES) || 15 * 1024 * 1024;
const PRACTICAL_UPLOADS_DIR = path.join(__dirname, "assets", "submissions");
const PUBLIC_APP_URL = (process.env.PUBLIC_APP_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const CERTIFICATE_HASH_SECRET =
  process.env.CERTIFICATE_HASH_SECRET || "autiva_certificate_hash_secret";

const LESSON_TRACKS = {
  L3: [
    {
      id: "l3-html-foundations",
      level: "L3",
      sessionNumber: 1,
      title: "HTML Foundations",
      description: "Structure web pages with semantic HTML and forms.",
      contentUrl: "https://www.w3schools.com/html/default.asp",
    },
    {
      id: "l3-css-layout",
      level: "L3",
      sessionNumber: 2,
      title: "CSS Layout & Styling",
      description: "Play with Flexbox, Grid, and responsive spacing.",
      contentUrl: "https://www.w3schools.com/css/default.asp",
    },
    {
      id: "l3-js-basics",
      level: "L3",
      sessionNumber: 3,
      title: "JavaScript Interactivity",
      description: "Handle events, DOM updates, and basic logic.",
      contentUrl: "https://www.w3schools.com/js/default.asp",
    },
  ],
  L4: [
    {
      id: "l4-php-intro",
      level: "L4",
      sessionNumber: 1,
      title: "PHP Backend Logic",
      description: "Build forms, handle requests, and return JSON.",
      contentUrl: "https://www.w3schools.com/php/default.asp",
    },
    {
      id: "l4-node-api",
      level: "L4",
      sessionNumber: 2,
      title: "Node.js API Patterns",
      description: "Routing, middleware, and error handling.",
      contentUrl: "https://www.w3schools.com/nodejs/default.asp",
    },
    {
      id: "l4-mysql-queries",
      level: "L4",
      sessionNumber: 3,
      title: "MySQL Basics",
      description: "SELECT/INSERT/UPDATE/DELETE with real examples.",
      contentUrl: "https://www.w3schools.com/mysql/default.asp",
    },
  ],
  L5: [
    {
      id: "l5-react-modern",
      level: "L5",
      sessionNumber: 1,
      title: "React.js Modern UI",
      description: "Components, hooks, and clean architectures.",
      contentUrl: "https://www.w3schools.com/react/default.asp",
    },
    {
      id: "l5-flutter-path",
      level: "L5",
      sessionNumber: 2,
      title: "Mobile Apps with Flutter",
      description: "Follow the official Flutter learning pathway.",
      contentUrl: "https://docs.flutter.dev/learn/pathway",
    },
  ],
};

const TASKS_BY_LESSON = {
  "l3-html-foundations": [
    {
      id: "task-l3-html-1",
      lessonId: "l3-html-foundations",
      title: "Outline page structure",
      instructions: "Sketch the semantic structure of a landing page.",
      orderIndex: 1,
      status: "NOT_STARTED",
    },
    {
      id: "task-l3-html-2",
      lessonId: "l3-html-foundations",
      title: "Build accessible forms",
      instructions: "Create a contact form using labels and aria hints.",
      orderIndex: 2,
      status: "NOT_STARTED",
    },
  ],
  "l3-css-layout": [
    {
      id: "task-l3-css-1",
      lessonId: "l3-css-layout",
      title: "Flexbox hero",
      instructions: "Create a hero section that reflows with Flexbox.",
      orderIndex: 1,
      status: "NOT_STARTED",
    },
    {
      id: "task-l3-css-2",
      lessonId: "l3-css-layout",
      title: "Grid dashboard",
      instructions: "Use CSS Grid to build a three-column layout.",
      orderIndex: 2,
      status: "NOT_STARTED",
    },
  ],
  "l3-js-basics": [
    {
      id: "task-l3-js-1",
      lessonId: "l3-js-basics",
      title: "Interactive counter",
      instructions: "Build a counter that increases/decreases on clicks.",
      orderIndex: 1,
      status: "NOT_STARTED",
    },
    {
      id: "task-l3-js-2",
      lessonId: "l3-js-basics",
      title: "Form validation",
      instructions: "Add client-side validation for the contact form.",
      orderIndex: 2,
      status: "NOT_STARTED",
    },
  ],
  "l4-php-intro": [
    {
      id: "task-l4-php-1",
      lessonId: "l4-php-intro",
      title: "PHP form handler",
      instructions: "Receive form data and return JSON safely.",
      orderIndex: 1,
      status: "NOT_STARTED",
    },
    {
      id: "task-l4-php-2",
      lessonId: "l4-php-intro",
      title: "Template include",
      instructions: "Split the page into header, footer, and content parts.",
      orderIndex: 2,
      status: "NOT_STARTED",
    },
  ],
  "l4-node-api": [
    {
      id: "task-l4-node-1",
      lessonId: "l4-node-api",
      title: "Express mini API",
      instructions: "Create an endpoint that accepts JSON and responds with data.",
      orderIndex: 1,
      status: "NOT_STARTED",
    },
    {
      id: "task-l4-node-2",
      lessonId: "l4-node-api",
      title: "Error handling",
      instructions: "Add error handling and validation middleware.",
      orderIndex: 2,
      status: "NOT_STARTED",
    },
  ],
  "l4-mysql-queries": [
    {
      id: "task-l4-mysql-1",
      lessonId: "l4-mysql-queries",
      title: "ERD sketch",
      instructions: "Draw an ERD for a student enrollment system.",
      orderIndex: 1,
      status: "NOT_STARTED",
    },
    {
      id: "task-l4-mysql-2",
      lessonId: "l4-mysql-queries",
      title: "Query practice",
      instructions: "Write SELECT/INSERT statements for the enrollment example.",
      orderIndex: 2,
      status: "NOT_STARTED",
    },
  ],
  "l5-react-modern": [
    {
      id: "task-l5-react-1",
      lessonId: "l5-react-modern",
      title: "Component composition",
      instructions: "Split the dashboard UI into reusable components.",
      orderIndex: 1,
      status: "NOT_STARTED",
    },
    {
      id: "task-l5-react-2",
      lessonId: "l5-react-modern",
      title: "Data fetching hook",
      instructions: "Build a custom hook that loads lessons from an API.",
      orderIndex: 2,
      status: "NOT_STARTED",
    },
  ],
  "l5-flutter-path": [
    {
      id: "task-l5-flutter-1",
      lessonId: "l5-flutter-path",
      title: "Flutter starter",
      instructions: "Scaffold a minimal Flutter screen using Material widgets.",
      orderIndex: 1,
      status: "NOT_STARTED",
    },
  ],
};

const rawBodyCache = new WeakMap();

function captureMultipartRawBody(req, res, next) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.startsWith("multipart/form-data")) {
    return next();
  }

  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    rawBodyCache.set(req, Buffer.concat(chunks));
    next();
  });
  req.on("error", next);
}

function parseMultipartFormData(req) {
  const rawBody = rawBodyCache.get(req);
  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!rawBody || !boundaryMatch) {
    return { fields: {}, files: [] };
  }

  const boundary = boundaryMatch[1];
  const parts = rawBody.toString("latin1").split(`--${boundary}`);
  const fields = {};
  const files = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed || trimmed === "--") continue;
    const [headerSection, ...bodyParts] = trimmed.split("\r\n\r\n");
    if (!bodyParts.length) continue;
    const valueRaw = bodyParts.join("\r\n\r\n");
    const value = valueRaw.replace(/[\r\n]+$/, "");
    const headerLines = headerSection.split("\r\n");
    const disposition = headerLines.find((line) => /content-disposition/i.test(line));
    const contentTypeLine = headerLines.find((line) => /content-type/i.test(line));
    if (!disposition) continue;
    const nameMatch = disposition.match(/name="([^"]+)"/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const filenameMatch = disposition.match(/filename="([^"]*)"/);
    if (filenameMatch) {
      const fileBuffer = Buffer.from(value, "latin1");
      files.push({
        name,
        filename: filenameMatch[1],
        value,
        buffer: fileBuffer,
        size: fileBuffer.length,
        contentType: contentTypeLine ? contentTypeLine.split(":")[1]?.trim() : "",
      });
    } else {
      fields[name] = value;
    }
  }

  rawBodyCache.delete(req);
  return { fields, files };
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function isZipUpload(file) {
  if (!file?.filename || !Buffer.isBuffer(file.buffer)) {
    return false;
  }
  const name = file.filename.toLowerCase();
  const signature = file.buffer.subarray(0, 4).toString("hex");
  return name.endsWith(".zip") && ["504b0304", "504b0506", "504b0708"].includes(signature);
}

function sanitizeFilename(value = "") {
  return String(value).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function checkGithubUrlAccessible(githubUrl) {
  return new Promise((resolve) => {
    const request = https.request(
      githubUrl,
      {
        method: "HEAD",
        timeout: 5000,
        headers: {
          "User-Agent": "AutivaTechBackend/1.0",
        },
      },
      (response) => {
        resolve(response.statusCode >= 200 && response.statusCode < 400);
      }
    );

    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
    request.on("error", () => resolve(false));
    request.end();
  });
}

function wrapAsync(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function normalizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    level: row.level,
    role: row.role,
    status: row.status,
  };
}

function normalizeRwPhone(phone = "") {
  const digitsOnly = String(phone).replace(/\D/g, "");
  if (/^2507\d{8}$/.test(digitsOnly)) {
    return digitsOnly;
  }
  if (/^07\d{8}$/.test(digitsOnly)) {
    return `250${digitsOnly.slice(1)}`;
  }
  if (/^7\d{8}$/.test(digitsOnly)) {
    return `250${digitsOnly}`;
  }
  return String(phone).trim();
}

function phoneLookupCandidates(normalizedPhone) {
  const canonical = String(normalizedPhone).replace(/\D/g, "");
  const local = canonical.startsWith("250") ? `0${canonical.slice(3)}` : canonical;
  const short = canonical.startsWith("250") ? canonical.slice(3) : canonical;
  return [canonical, local, short];
}

function paymentAmountForLevel(level) {
  return PAYMENT_AMOUNT[level] ?? PAYMENT_AMOUNT.L3;
}

function mapPaymentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    payerName: row.payer_name || null,
    payerPhone: row.payer_phone || null,
    referenceCode: row.reference_code,
    method: row.method,
    amount: Number(row.amount),
    destinationAccountNumber: row.destination_account_number || null,
    destinationAccountName: row.destination_account_name || null,
    destinationProvider: row.destination_provider || null,
    status: row.status,
    adminNote: row.admin_note,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

function mapPracticalTaskRow(row, options = {}) {
  if (!row) return null;
  const deadlineHours = Number(row.deadline_days || 0);
  return {
    id: row.id,
    requestId: row.request_id,
    userId: row.user_id,
    level: row.level || null,
    taskNumber: Number(row.task_number || 0),
    deadlineHours,
    deadlineLabel: deadlineHours >= 24 && deadlineHours % 24 === 0
      ? `${deadlineHours / 24} day${deadlineHours / 24 > 1 ? "s" : ""}`
      : `${deadlineHours} hour${deadlineHours > 1 ? "s" : ""}`,
    dueAt: row.due_at ? new Date(row.due_at).toISOString() : null,
    title: row.title,
    description: row.description,
    status: row.status,
    githubRepoUrl: row.github_repo_url || "",
    projectZipFilename: row.project_zip_filename || "",
    score: row.score === null || typeof row.score === "undefined" ? null : Number(row.score),
    assignedAt: row.assigned_at ? new Date(row.assigned_at).toISOString() : null,
    submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : null,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
    missedAt: row.missed_at ? new Date(row.missed_at).toISOString() : null,
    explanationSubmittedAt: row.explanation_submitted_at
      ? new Date(row.explanation_submitted_at).toISOString()
      : null,
    confirmedAt: row.confirmed_at ? new Date(row.confirmed_at).toISOString() : null,
    submissionText: row.submission_text || "",
    missedReason: row.missed_reason || "",
    missedReasonProof: row.missed_reason_proof || "",
    missedReasonStatus: row.missed_reason_status || null,
    reviewNote: row.review_note || "",
  };
}

function getPracticalRule(level) {
  return PRACTICAL_RULES[level] || PRACTICAL_RULES.L3;
}

function buildPracticalProgress(level, approvedCount) {
  const rule = getPracticalRule(level);
  return {
    level,
    approvedCount,
    requiredTasks: rule.requiredTasks,
    deadlineHours: rule.deadlineHours,
    deadlineLabel: rule.deadlineLabel,
    label: `${approvedCount}/${rule.requiredTasks}`,
    certificateEligible: approvedCount >= rule.requiredTasks,
  };
}

function buildPracticalProgressFromTasks(level, tasks) {
  const rule = getPracticalRule(level);
  const approvedTasks = tasks.filter((task) => task.status === "APPROVED");
  const completedCount = approvedTasks.length;
  const progressPercent = Math.min(
    100,
    Math.round((completedCount / Math.max(rule.requiredTasks, 1)) * 100)
  );
  const totalScore = approvedTasks.reduce((sum, task) => sum + Number(task.score || 0), 0);
  const averageScore = completedCount ? Math.round(totalScore / completedCount) : 0;

  return {
    level,
    approvedCount: completedCount,
    requiredTasks: rule.requiredTasks,
    deadlineHours: rule.deadlineHours,
    deadlineLabel: rule.deadlineLabel,
    label: `${completedCount}/${rule.requiredTasks}`,
    progressPercent,
    totalScore,
    averageScore,
    certificateEligible:
      completedCount >= rule.requiredTasks && averageScore >= CERTIFICATE_PASS_SCORE,
  };
}

function calculateReputationRating({
  averageScore,
  failedTasks,
  onTimeSubmissions,
  submittedTasks,
  acceptedExplanations,
  rejectedExplanations,
}) {
  const punctualityBonus = submittedTasks
    ? Math.round((onTimeSubmissions / Math.max(submittedTasks, 1)) * 10)
    : 0;
  const acceptedBonus = acceptedExplanations * 2;
  const failurePenalty = failedTasks * 8;
  const rejectedPenalty = rejectedExplanations * 5;
  const rawScore = averageScore + punctualityBonus + acceptedBonus - failurePenalty - rejectedPenalty;
  return Math.max(1, Math.min(5, Math.round(rawScore / 20) || 1));
}

async function ensureCertificateRequestForUser(user, performance) {
  if (!performance.certificateEligible) {
    return null;
  }

  const existingRequestResult = await pool.query(
    `SELECT id, status
     FROM certificate_requests
     WHERE user_id = $1
     ORDER BY requested_at DESC
     LIMIT 1`,
    [user.id]
  );

  if (existingRequestResult.rows.length) {
    const existing = existingRequestResult.rows[0];
    return existing.id;
  }

  const insertResult = await pool.query(
    `INSERT INTO certificate_requests
       (id, user_id, level, final_score, progress_percent, status, requested_at)
     VALUES ($1, $2, $3, $4, $5, 'PENDING', now())
     RETURNING id`,
    [
      crypto.randomUUID(),
      user.id,
      user.level,
      performance.averageScore,
      performance.progressPercent,
    ]
  );

  await recordActivity(
    "certificate_request",
    `${user.full_name} became eligible for certificate approval`,
    { userId: user.id, level: user.level, averageScore: performance.averageScore }
  );

  return insertResult.rows[0].id;
}

async function refreshUserPerformance(userId) {
  const userResult = await pool.query(
    `SELECT id, full_name, level, status, certificate_status
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) {
    return null;
  }

  const tasksResult = await pool.query(
    `SELECT id, status, score, due_at, submitted_at, missed_reason_status
     FROM practical_tasks
     WHERE user_id = $1`,
    [userId]
  );
  const tasks = tasksResult.rows;
  const progress = buildPracticalProgressFromTasks(user.level, tasks);
  const submittedTasks = tasks.filter((task) => task.submitted_at).length;
  const onTimeSubmissions = tasks.filter(
    (task) => task.submitted_at && (!task.due_at || new Date(task.submitted_at) <= new Date(task.due_at))
  ).length;
  const failedTasks = tasks.filter((task) => ["FAILED", "FAILED_REVIEW"].includes(task.status)).length;
  const acceptedExplanations = tasks.filter(
    (task) => task.missed_reason_status === "ACCEPTED"
  ).length;
  const rejectedExplanations = tasks.filter(
    (task) => task.missed_reason_status === "REJECTED"
  ).length;
  const reputationRating = calculateReputationRating({
    averageScore: progress.averageScore,
    failedTasks,
    onTimeSubmissions,
    submittedTasks,
    acceptedExplanations,
    rejectedExplanations,
  });

  let levelStatus = "LEARNING";
  if (progress.progressPercent === 100) {
    levelStatus = progress.averageScore >= CERTIFICATE_PASS_SCORE ? "COMPLETED" : "COMPLETED_LOW_SCORE";
  } else if (tasks.some((task) => ["ASSIGNED", "SEEN", "CONFIRMED", "SUBMITTED", "MEETING_REQUESTED", "REJECTED"].includes(task.status))) {
    levelStatus = "PRACTICAL";
  } else if (tasks.length) {
    levelStatus = "PRACTICAL_REVIEW";
  } else if (user.status === "ACTIVE") {
    levelStatus = "LEARNING";
  }

  const internshipEligible =
    progress.progressPercent === 100 && progress.averageScore >= CERTIFICATE_PASS_SCORE;
  const certificateEligible = internshipEligible;
  let certificateStatus = certificateEligible ? "PENDING_APPROVAL" : "NOT_ELIGIBLE";

  const latestCertificateResult = await pool.query(
    `SELECT c.is_valid, cr.status
     FROM certificate_requests cr
     LEFT JOIN certificates c ON c.certificate_request_id = cr.id
     WHERE cr.user_id = $1
     ORDER BY cr.requested_at DESC
     LIMIT 1`,
    [userId]
  );
  if (latestCertificateResult.rows.length) {
    const latest = latestCertificateResult.rows[0];
    if (latest.status === "APPROVED" && latest.is_valid !== false) {
      certificateStatus = "APPROVED";
    } else if (latest.status === "REJECTED") {
      certificateStatus = "REJECTED";
    }
  }

  await pool.query(
    `UPDATE users
     SET overall_score = $1,
         average_score = $2,
         reputation_rating = $3,
         completed_tasks = $4,
         level_status = $5,
         internship_eligible = $6,
         certificate_eligible = $7,
         certificate_status = $8,
         updated_at = now()
     WHERE id = $9`,
    [
      progress.totalScore,
      progress.averageScore,
      reputationRating,
      progress.approvedCount,
      levelStatus,
      internshipEligible,
      certificateEligible,
      certificateStatus,
      userId,
    ]
  );

  if (certificateEligible) {
    const requestId = await ensureCertificateRequestForUser(user, progress);
    if (requestId) {
      certificateStatus = "PENDING_APPROVAL";
      await pool.query(
        "UPDATE users SET certificate_status = $1, updated_at = now() WHERE id = $2",
        [certificateStatus, userId]
      );
    }
  }

  return {
    ...progress,
    overallScore: progress.totalScore,
    averageScore: progress.averageScore,
    reputationRating,
    completedTasks: progress.approvedCount,
    levelStatus,
    internshipEligible,
    certificateEligible,
    certificateStatus,
    failedTasks,
    onTimeSubmissions,
  };
}

async function generateCertificateId(level) {
  const year = new Date().getFullYear();
  const prefix = `AUTIVA-CERT-${level}-${year}-`;
  const sequenceResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM certificates
     WHERE certificate_id LIKE $1`,
    [`${prefix}%`]
  );
  const nextSequence = Number(sequenceResult.rows[0]?.total || 0) + 1;
  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

function mapNotificationRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    targetPage: row.target_page,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

function buildCertificateVerificationUrl(certificateId) {
  return `${PUBLIC_APP_URL}/certificate/verify/${certificateId}`;
}

function computeCertificateHash({ fullName, level, issueDate, certificateId }) {
  const payload = [
    String(fullName || "").trim(),
    String(level || "").trim(),
    new Date(issueDate).toISOString(),
    String(certificateId || "").trim(),
    CERTIFICATE_HASH_SECRET,
  ].join("|");
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function renderCertificateVerificationPage({
  certificateId,
  fullName,
  level,
  issueDate,
  status,
  isValid,
  tampered,
  verificationCount,
  blockchainTx,
  downloadUrl,
}) {
  const badgeClass = tampered
    ? "background:#fee2e2;color:#b91c1c;"
    : isValid
      ? "background:#dcfce7;color:#166534;"
      : "background:#fef3c7;color:#92400e;";
  const summary = tampered
    ? "This certificate record failed integrity validation and should not be trusted."
    : isValid
      ? "This certificate is officially issued by Autiva Tech and is valid."
      : "This certificate is not currently valid.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate Verification - ${certificateId}</title>
  <style>
    body{font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:32px;color:#0f172a}
    .card{max-width:860px;margin:0 auto;background:#fff;border-radius:24px;padding:32px;box-shadow:0 20px 45px rgba(15,23,42,.08)}
    .badge{display:inline-block;padding:8px 14px;border-radius:999px;font-weight:700;font-size:12px;letter-spacing:.04em;${badgeClass}}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:24px}
    .item{border:1px solid #e2e8f0;border-radius:16px;padding:16px;background:#f8fafc}
    .label{font-size:12px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.06em}
    .value{margin-top:8px;font-size:16px;font-weight:700}
    .actions{margin-top:28px;display:flex;gap:12px;flex-wrap:wrap}
    .button{display:inline-flex;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700}
    .primary{background:#047857;color:#fff}
    .secondary{background:#fff;color:#0f172a;border:1px solid #cbd5e1}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${tampered ? "Tampered" : status}</div>
    <h1 style="margin:16px 0 8px;">Certificate Verification</h1>
    <p style="margin:0;color:#475569;line-height:1.6;">${summary}</p>
    <div class="grid">
      <div class="item"><div class="label">Student Name</div><div class="value">${fullName}</div></div>
      <div class="item"><div class="label">Program Level</div><div class="value">${level}</div></div>
      <div class="item"><div class="label">Certificate ID</div><div class="value">${certificateId}</div></div>
      <div class="item"><div class="label">Issue Date</div><div class="value">${new Date(issueDate).toISOString().slice(0, 10)}</div></div>
      <div class="item"><div class="label">Verification Count</div><div class="value">${verificationCount}</div></div>
      <div class="item"><div class="label">Blockchain Record</div><div class="value">${blockchainTx ? `Verified (${blockchainTx})` : "Not anchored"}</div></div>
    </div>
    <div class="actions">
      ${downloadUrl && isValid && !tampered ? `<a class="button primary" href="${downloadUrl}">Download Certificate</a>` : ""}
      <a class="button secondary" href="${PUBLIC_APP_URL}">Autiva Tech</a>
    </div>
  </div>
</body>
</html>`;
}

async function markOverduePracticalTasks(userId = null) {
  const values = [];
  let whereClause = `
    due_at IS NOT NULL
    AND due_at < now()
    AND status IN ('ASSIGNED', 'SEEN', 'CONFIRMED')
  `;
  if (userId) {
    values.push(userId);
    whereClause += ` AND user_id = $1`;
  }

  const result = await pool.query(
    `UPDATE practical_tasks
     SET status = 'FAILED',
         score = 0,
         missed_at = COALESCE(missed_at, now()),
         review_note = COALESCE(review_note, 'Deadline exceeded. Submission is no longer allowed.')
     WHERE ${whereClause}
     RETURNING id, user_id, task_number`,
    values
  );

  for (const row of result.rows) {
    const userRes = await pool.query("SELECT full_name FROM users WHERE id = $1 LIMIT 1", [row.user_id]);
    await recordActivity(
      "task_failed",
      `${userRes.rows[0]?.full_name || "A student"} missed practical task ${row.task_number}`,
      { taskId: row.id, userId: row.user_id, taskNumber: row.task_number, score: 0 }
    );
  }

  for (const userIdToRefresh of [...new Set(result.rows.map((row) => row.user_id))]) {
    await refreshUserPerformance(userIdToRefresh);
  }

  if (result.rows.length) {
    io.emit("deadline:processed", { count: result.rows.length, time: new Date().toISOString() });
  }
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfWeek() {
  const today = startOfToday();
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1;
  today.setDate(today.getDate() - diff);
  return today;
}

async function recordActivity(type, message, metadata = {}) {
  const activity = {
    id: crypto.randomUUID(),
    type,
    message,
    metadata,
    createdAt: new Date().toISOString(),
  };

  await pool.query(
    `INSERT INTO activity_logs (id, type, message, metadata, created_at)
     VALUES ($1, $2, $3, $4::jsonb, now())`,
    [activity.id, type, message, JSON.stringify(metadata)]
  );

  io.emit("activity:new", activity);
  return activity;
}

async function createNotification({ userId, title, message, type = "GENERAL", targetPage = "/user/notifications" }) {
  const notificationId = crypto.randomUUID();
  const result = await pool.query(
    `INSERT INTO notifications (id, user_id, title, message, type, target_page, is_read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE, now())
     RETURNING id, title, message, type, target_page, is_read, created_at`,
    [notificationId, userId, title, message, type, targetPage]
  );

  const notification = mapNotificationRow(result.rows[0]);
  io.emit("notification:new", { userId, notification });
  return notification;
}

async function getDashboardSnapshot() {
  await markOverduePracticalTasks();
  const today = startOfToday();
  const week = startOfWeek();

  const [
    usersRes,
    paymentsRes,
    practicalRes,
    tasksRes,
    certificateRes,
    latestUsersRes,
    latestPaymentsRes,
    latestRequestsRes,
    latestTasksRes,
    activitiesRes,
    leaderboardRes,
    internshipRes,
  ] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*)::int AS total_users,
         COUNT(*) FILTER (WHERE created_at >= $1)::int AS new_users_today,
         COUNT(*) FILTER (WHERE created_at >= $2)::int AS new_users_this_week,
         COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_students,
         COUNT(*) FILTER (WHERE level = 'L3')::int AS l3_count,
         COUNT(*) FILTER (WHERE level = 'L4')::int AS l4_count,
         COUNT(*) FILTER (WHERE level = 'L5')::int AS l5_count
       FROM users
       WHERE role = 'STUDENT'`,
      [today.toISOString(), week.toISOString()]
    ),
    pool.query(
      `SELECT
         COUNT(*)::int AS total_payments,
         COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending_payments,
         COUNT(*) FILTER (WHERE created_at >= $1)::int AS payments_today,
         COALESCE(SUM(amount) FILTER (WHERE status IN ('APPROVED', 'CONFIRMED')), 0)::int AS total_revenue
       FROM payments`,
      [today.toISOString()]
    ),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending_requests,
         COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS accepted_requests
       FROM practical_requests`
    ),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('ASSIGNED', 'SEEN', 'CONFIRMED', 'SUBMITTED', 'REJECTED'))::int AS active_practical_tasks,
         COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS completed_practicals,
         COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed_practicals,
         COUNT(*) FILTER (WHERE status = 'SUBMITTED')::int AS pending_reviews,
         COUNT(DISTINCT user_id) FILTER (WHERE status IN ('ASSIGNED', 'SEEN', 'CONFIRMED', 'SUBMITTED', 'REJECTED'))::int AS students_doing_practical,
         COUNT(DISTINCT user_id) FILTER (WHERE status = 'APPROVED')::int AS students_completed_practicals
       FROM practical_tasks`
    ),
    pool.query(
      `SELECT
         COUNT(*)::int AS total_requests,
         COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending_requests,
         COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved_certificates,
         COUNT(*) FILTER (WHERE status = 'REJECTED')::int AS rejected_requests,
         COUNT(*) FILTER (
           WHERE status = 'APPROVED'
             AND EXISTS (
               SELECT 1 FROM certificates c
               WHERE c.certificate_request_id = certificate_requests.id
                 AND c.is_valid = FALSE
             )
         )::int AS revoked_certificates
       FROM certificate_requests`
    ),
    pool.query(
      `SELECT id, full_name, level, created_at
       FROM users
       WHERE role = 'STUDENT'
       ORDER BY created_at DESC
       LIMIT 5`
    ),
    pool.query(
      `SELECT p.id, p.amount, p.method, p.status, p.created_at, u.full_name
       FROM payments p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT 5`
    ),
    pool.query(
      `SELECT pr.id, pr.level, pr.status, pr.requested_at, u.full_name
       FROM practical_requests pr
       JOIN users u ON u.id = pr.user_id
       ORDER BY pr.requested_at DESC
       LIMIT 5`
    ),
    pool.query(
      `SELECT pt.id, pt.title, pt.task_number, pt.status, pt.submitted_at, pt.assigned_at, u.full_name
       FROM practical_tasks pt
       JOIN users u ON u.id = pt.user_id
       ORDER BY COALESCE(pt.submitted_at, pt.assigned_at) DESC
       LIMIT 5`
    ),
    pool.query(
      `SELECT id, type, message, metadata, created_at
       FROM activity_logs
       ORDER BY created_at DESC
       LIMIT 15`
    ),
    pool.query(
      `SELECT id, full_name, level, average_score, reputation_rating
       FROM users
       WHERE role = 'STUDENT' AND completed_tasks > 0
       ORDER BY average_score DESC, reputation_rating DESC, created_at ASC
       LIMIT 5`
    ),
    pool.query(
      `SELECT id, full_name, level, average_score, level_status
       FROM users
       WHERE role = 'STUDENT' AND internship_eligible = TRUE
       ORDER BY average_score DESC, updated_at ASC
       LIMIT 5`
    ),
  ]);

  const users = usersRes.rows[0];
  const payments = paymentsRes.rows[0];
  const practical = practicalRes.rows[0];
  const tasks = tasksRes.rows[0];
  const certificates = certificateRes.rows[0];
  const studentsLearning = Math.max(
    Number(users.active_students || 0) - Number(tasks.students_doing_practical || 0),
    0
  );

  return {
    summary: {
      totalUsers: Number(users.total_users || 0),
      newUsersToday: Number(users.new_users_today || 0),
      newUsersThisWeek: Number(users.new_users_this_week || 0),
      activeStudents: Number(users.active_students || 0),
      studentsByLevel: {
        L3: Number(users.l3_count || 0),
        L4: Number(users.l4_count || 0),
        L5: Number(users.l5_count || 0),
      },
      totalPayments: Number(payments.total_payments || 0),
      pendingPaymentApprovals: Number(payments.pending_payments || 0),
      totalRevenue: Number(payments.total_revenue || 0),
      paymentsToday: Number(payments.payments_today || 0),
      pendingPracticalRequests: Number(practical.pending_requests || 0),
      acceptedRequests: Number(practical.accepted_requests || 0),
      activePracticalTasks: Number(tasks.active_practical_tasks || 0),
      completedPracticals: Number(tasks.completed_practicals || 0),
      failedPracticals: Number(tasks.failed_practicals || 0),
      pendingReviews: Number(tasks.pending_reviews || 0),
      studentsLearning,
      studentsRequestedPractical:
        Number(practical.pending_requests || 0) + Number(practical.accepted_requests || 0),
      studentsDoingPractical: Number(tasks.students_doing_practical || 0),
      studentsCompletedPracticals: Number(tasks.students_completed_practicals || 0),
      certificateRequests: Number(certificates.total_requests || 0),
      pendingCertificateApprovals: Number(certificates.pending_requests || 0),
      certificatesIssued: Number(certificates.approved_certificates || 0),
      rejectedCertificates: Number(certificates.rejected_requests || 0),
      revokedCertificates: Number(certificates.revoked_certificates || 0),
    },
    latest: {
      registrations: latestUsersRes.rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        level: row.level,
        createdAt: row.created_at,
      })),
      payments: latestPaymentsRes.rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        amount: Number(row.amount),
        method: row.method,
        status: row.status,
        createdAt: row.created_at,
      })),
      practicalRequests: latestRequestsRes.rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        level: row.level,
        status: row.status,
        requestedAt: row.requested_at,
      })),
      taskSubmissions: latestTasksRes.rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        title: row.title,
        taskNumber: row.task_number,
        status: row.status,
        activityAt: row.submitted_at || row.assigned_at,
      })),
    },
    activityFeed: activitiesRes.rows.map((row) => ({
      id: row.id,
      type: row.type,
      message: row.message,
      metadata: row.metadata || {},
      createdAt: row.created_at,
    })),
    leaderboard: leaderboardRes.rows.map((row, index) => ({
      rank: index + 1,
      id: row.id,
      fullName: row.full_name,
      level: row.level,
      averageScore: Number(row.average_score || 0),
      reputationRating: Number(row.reputation_rating || 0),
    })),
    internshipCandidates: internshipRes.rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      level: row.level,
      averageScore: Number(row.average_score || 0),
      levelStatus: row.level_status,
      status: "Ready for Internship",
    })),
  };
}

async function getPaymentDestinationSettings() {
  const { rows } = await pool.query(
    "SELECT value FROM system_settings WHERE key = 'payment_destination' LIMIT 1"
  );
  const settings = rows[0]?.value || {};
  return {
    accountNumber: (settings.accountNumber || "").toString().trim(),
    accountName: (settings.accountName || "").toString().trim(),
    provider: (settings.provider || "BANK").toString().trim().toUpperCase(),
  };
}

async function issueTokensForUser(userId, role) {
  const accessToken = jwt.sign({ sub: userId, role }, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
  const refreshToken = jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });
  await pool.query("UPDATE users SET refresh_token = $1, updated_at = now() WHERE id = $2", [
    refreshToken,
    userId,
  ]);
  return { accessToken, refreshToken };
}

const requireAuth = wrapAsync(async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing access token" });
  }

  const token = header.replace("Bearer ", "").trim();
  let payload;
  try {
    payload = jwt.verify(token, JWT_ACCESS_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const { rows } = await pool.query(
    "SELECT id, full_name, phone, email, level, role, status FROM users WHERE id = $1",
    [payload.sub]
  );

  if (!rows.length) {
    return res.status(401).json({ message: "User not found" });
  }

  req.user = normalizeUser(rows[0]);
  next();
});

function requireAdminKey(req, res, next) {
  if (!ADMIN_API_KEY) {
    return res.status(503).json({ message: "Admin settings key is not configured on server" });
  }

  const incomingKey = req.headers["x-admin-key"];
  if (incomingKey !== ADMIN_API_KEY) {
    return res.status(403).json({ message: "Invalid admin key" });
  }

  next();
}

app.use(cors());
app.use(captureMultipartRawBody);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/healthz", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString(), uptime: process.uptime() });
});

app.get(
  "/test-db",
  wrapAsync(async (req, res) => {
    const { rows } = await pool.query("SELECT NOW() AS current_time");
    return res.json({ success: true, server_time: rows[0].current_time });
  })
);

app.post(
  "/auth/register",
  wrapAsync(async (req, res) => {
    const { fullName, phone, email, level, password } = req.body ?? {};
    const cleanedPhone = normalizeRwPhone(phone);
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ message: "Full name is required" });
    }
    if (!cleanedPhone || !PHONE_REGEX.test(cleanedPhone)) {
      return res.status(400).json({ message: "Phone number must be in Rwanda format" });
    }
    if (!level || !LEVELS.includes(level)) {
      return res.status(400).json({ message: "Level must be L3, L4 or L5" });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must have at least 8 characters" });
    }

    const normalizedEmail = email ? (typeof email === "string" && email.trim() !== "" ? email.trim() : null) : null;
    const registerCandidates = phoneLookupCandidates(cleanedPhone);

    try {
      const existing = await pool.query(
        `SELECT id
         FROM users
         WHERE regexp_replace(phone, '[^0-9]', '', 'g') = ANY($1::text[])
         LIMIT 1`,
        [registerCandidates]
      );
      if (existing.rows.length) {
        return res.status(409).json({ message: "Phone number already registered" });
      }

      const id = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(
        `INSERT INTO users
         (id, full_name, phone, email, level, role, status, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
         RETURNING id, full_name, phone, email, level, role, status`,
        [id, fullName.trim(), cleanedPhone, normalizedEmail, level, "STUDENT", "NEW", hashedPassword]
      );

      const tokens = await issueTokensForUser(id, "STUDENT");
    await recordActivity("registration", `${rows[0].full_name} registered for ${rows[0].level}`, {
        userId: id,
        level: rows[0].level,
      });
      return res.status(201).json({ user: normalizeUser(rows[0]), tokens });
    } catch (err) {
      if (err.code === "23505") {
        return res.status(409).json({ message: "Phone number already registered" });
      }
      throw err;
    }
  })
);

app.post(
  "/auth/login",
  wrapAsync(async (req, res) => {
    const { phone, password } = req.body ?? {};
    const cleanedPhone = normalizeRwPhone(phone);
    if (!cleanedPhone || !PHONE_REGEX.test(cleanedPhone)) {
      return res.status(400).json({ message: "Phone number must be in Rwanda format" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const loginCandidates = phoneLookupCandidates(cleanedPhone);
    const { rows } = await pool.query(
      `SELECT id, full_name, phone, email, level, role, status, password_hash
       FROM users
       WHERE regexp_replace(phone, '[^0-9]', '', 'g') = ANY($1::text[])`,
      [loginCandidates]
    );
    if (!rows.length) {
      return res.status(401).json({ message: "Invalid phone or password" });
    }

    const userRow = rows[0];
    let matched = false;
    const storedPassword = userRow.password_hash || "";

    try {
      matched = await bcrypt.compare(password, storedPassword);
    } catch {
      // Legacy rows may contain plain text instead of bcrypt hash.
      matched = storedPassword === password;
    }

    if (!matched && storedPassword === password) {
      matched = true;
    }

    if (!matched) {
      return res.status(401).json({ message: "Invalid phone or password" });
    }

    // Upgrade legacy plain-text password to bcrypt hash after successful login.
    if (storedPassword === password) {
      const upgradedHash = await bcrypt.hash(password, 10);
      await pool.query("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2", [
        upgradedHash,
        userRow.id,
      ]);
    }

    const tokens = await issueTokensForUser(userRow.id, userRow.role);
    return res.json({ user: normalizeUser(userRow), tokens });
  })
);

app.post(
  "/auth/refresh",
  wrapAsync(async (req, res) => {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const { rows } = await pool.query(
      "SELECT id, full_name, phone, email, level, role, status, refresh_token FROM users WHERE id = $1",
      [payload.sub]
    );

    if (!rows.length || rows[0].refresh_token !== refreshToken) {
      return res.status(401).json({ message: "Refresh token mismatch" });
    }

    const tokens = await issueTokensForUser(rows[0].id, rows[0].role);
    return res.json({ user: normalizeUser(rows[0]), tokens });
  })
);

app.get(
  "/lessons/my",
  requireAuth,
  wrapAsync(async (req, res) => {
    const levelLessons = LESSON_TRACKS[req.user.level] ?? LESSON_TRACKS.L3;
    return res.json({ lessons: levelLessons });
  })
);

app.get(
  "/tasks/by-lesson/:lessonId",
  requireAuth,
  wrapAsync(async (req, res) => {
    const lessonId = req.params.lessonId;
    const allLessons = Object.values(LESSON_TRACKS).flat();
    if (!allLessons.find((lesson) => lesson.id === lessonId)) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const tasks = TASKS_BY_LESSON[lessonId] ?? [];
    return res.json({ tasks });
  })
);

app.get(
  "/payments/status",
  requireAuth,
  wrapAsync(async (req, res) => {
    const { rows } = await pool.query(
      "SELECT id, payer_name, payer_phone, reference_code, method, amount, destination_account_number, destination_account_name, destination_provider, status, admin_note, created_at FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [req.user.id]
    );

    return res.json({ payment: mapPaymentRow(rows[0]) });
  })
);

app.get(
  "/settings/payment",
  wrapAsync(async (req, res) => {
    const destination = await getPaymentDestinationSettings();
    return res.json({ destination });
  })
);

app.put(
  "/settings/payment",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const accountNumber = (req.body?.accountNumber || "").toString().trim();
    const accountName = (req.body?.accountName || "").toString().trim();
    const provider = (req.body?.provider || "BANK").toString().trim().toUpperCase();

    if (!accountNumber) {
      return res.status(400).json({ message: "accountNumber is required" });
    }

    await pool.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ('payment_destination', $1::jsonb, now())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [JSON.stringify({ accountNumber, accountName, provider })]
    );

    return res.json({
      message: "Payment destination updated",
      destination: { accountNumber, accountName, provider },
    });
  })
);

app.get(
  "/notifications/me",
  requireAuth,
  wrapAsync(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, title, message, type, target_page, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.json({ notifications: rows.map(mapNotificationRow) });
  })
);

app.get(
  "/notifications/me/unread-count",
  requireAuth,
  wrapAsync(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );

    return res.json({ unreadCount: Number(rows[0]?.total || 0) });
  })
);

app.patch(
  "/notifications/:id/read",
  requireAuth,
  wrapAsync(async (req, res) => {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, message, type, target_page, is_read, created_at`,
      [req.params.id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ notification: mapNotificationRow(result.rows[0]) });
  })
);

app.post(
  "/requests/practical",
  requireAuth,
  wrapAsync(async (req, res) => {
    const existingPending = await pool.query(
      "SELECT id, status, requested_at FROM practical_requests WHERE user_id = $1 AND status = 'PENDING' ORDER BY requested_at DESC LIMIT 1",
      [req.user.id]
    );

    if (existingPending.rows.length) {
      return res.status(200).json({
        message: REQUEST_RECEIVED_MESSAGE,
        request: {
          id: existingPending.rows[0].id,
          status: existingPending.rows[0].status,
          requestedAt: existingPending.rows[0].requested_at,
        },
      });
    }

    const requestId = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO practical_requests (id, user_id, level, message, status, requested_at)
       VALUES ($1, $2, $3, $4, 'PENDING', now())
       RETURNING id, status, requested_at`,
      [requestId, req.user.id, req.user.level, REQUEST_RECEIVED_MESSAGE]
    );

    await recordActivity("practical_request", `${req.user.fullName} requested a practical for ${req.user.level}`, {
      userId: req.user.id,
      level: req.user.level,
      requestId,
    });

    return res.status(201).json({
      message: REQUEST_RECEIVED_MESSAGE,
      request: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        requestedAt: result.rows[0].requested_at,
      },
    });
  })
);

app.get(
  "/requests/practical/me",
  requireAuth,
  wrapAsync(async (req, res) => {
    const { rows } = await pool.query(
      "SELECT id, status, message, requested_at FROM practical_requests WHERE user_id = $1 ORDER BY requested_at DESC LIMIT 1",
      [req.user.id]
    );

    if (!rows.length) {
      return res.json({ request: null });
    }

    return res.json({
      request: {
        id: rows[0].id,
        status: rows[0].status,
        message: rows[0].message,
        requestedAt: rows[0].requested_at,
      },
    });
  })
);

app.get(
  "/practical-tasks/me",
  requireAuth,
  wrapAsync(async (req, res) => {
    await markOverduePracticalTasks(req.user.id);
    const { rows } = await pool.query(
      `SELECT id, request_id, user_id, level, task_number, deadline_days, due_at, title, description,
              status, score,
              github_repo_url, project_zip_filename, project_zip_path, submission_text, missed_reason, missed_reason_proof, missed_reason_status, review_note,
              assigned_at, submitted_at, reviewed_at, missed_at, explanation_submitted_at, confirmed_at
       FROM practical_tasks
       WHERE user_id = $1
       ORDER BY assigned_at DESC
      `,
      [req.user.id]
    );

    let latestTask = rows[0] || null;
    if (latestTask && latestTask.status === "ASSIGNED") {
      const seenResult = await pool.query(
        `UPDATE practical_tasks
         SET status = 'SEEN'
         WHERE id = $1
         RETURNING id, request_id, user_id, level, task_number, deadline_days, due_at, title, description,
                   status, score,
                   github_repo_url, project_zip_filename, project_zip_path, submission_text, missed_reason, missed_reason_proof, missed_reason_status, review_note,
                   assigned_at, submitted_at, reviewed_at, missed_at, explanation_submitted_at, confirmed_at`,
        [latestTask.id]
      );
      latestTask = seenResult.rows[0];
      rows[0] = latestTask;
    }

    const progress = (await refreshUserPerformance(req.user.id)) || buildPracticalProgressFromTasks(req.user.level, rows);

    return res.json({
      task: mapPracticalTaskRow(latestTask),
      tasks: rows.map(mapPracticalTaskRow),
      progress,
    });
  })
);

app.post(
  "/practical-tasks/:id/confirm",
  requireAuth,
  wrapAsync(async (req, res) => {
    await markOverduePracticalTasks(req.user.id);
    const taskId = req.params.id;
    const result = await pool.query(
      `UPDATE practical_tasks
       SET status = 'CONFIRMED', confirmed_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING id, request_id, user_id, level, task_number, deadline_days, due_at, title, description, status,
                 score,
                 github_repo_url, project_zip_filename, project_zip_path, submission_text, missed_reason, missed_reason_proof, missed_reason_status, review_note, assigned_at, submitted_at,
                 reviewed_at, missed_at, explanation_submitted_at, confirmed_at`,
      [taskId, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Practical task not found" });
    }

    await recordActivity("task_seen", `${req.user.fullName} confirmed readiness for practical task`, {
      userId: req.user.id,
      taskId,
    });

    return res.json({
      message: "Practical task confirmed successfully.",
      task: mapPracticalTaskRow(result.rows[0]),
    });
  })
);

app.post(
  "/practical-tasks/:id/submit",
  requireAuth,
  wrapAsync(async (req, res) => {
    await markOverduePracticalTasks(req.user.id);
    const taskId = req.params.id;
    const { fields, files } = parseMultipartFormData(req);
    const payload = Object.keys(fields).length ? fields : req.body;
    const githubRepoUrl = (payload.githubRepoUrl || payload.github_repo_url || "").toString().trim();
    const projectZip = files.find((file) => file.name === "projectZip" || file.name === "project_zip");

    const hasGithub = Boolean(githubRepoUrl);
    const hasZip = Boolean(projectZip);

    if (!hasGithub && !hasZip) {
      return res.status(400).json({
        message: "Submission rejected. Please upload a ZIP project file or provide a valid GitHub repository URL.",
      });
    }

    if (hasGithub && !GITHUB_REPO_REGEX.test(githubRepoUrl)) {
      return res.status(400).json({
        message: "Submission rejected. Please provide a valid GitHub repository URL.",
      });
    }

    if (hasZip && !isZipUpload(projectZip)) {
      return res.status(400).json({
        message: "Submission rejected. Please upload a real ZIP project file.",
      });
    }

    if (hasZip && projectZip.size > MAX_PRACTICAL_ZIP_SIZE_BYTES) {
      return res.status(400).json({
        message: `Submission rejected. ZIP file must be smaller than ${Math.round(
          MAX_PRACTICAL_ZIP_SIZE_BYTES / (1024 * 1024)
        )}MB.`,
      });
    }

    if (hasGithub) {
      const githubAccessible = await checkGithubUrlAccessible(githubRepoUrl);
      if (!githubAccessible) {
        return res.status(400).json({
          message: "Submission rejected. Please provide a valid GitHub repository URL.",
        });
      }
    }

    const taskLookup = await pool.query(
      `SELECT id, title, description, level
       FROM practical_tasks
       WHERE id = $1 AND user_id = $2 AND status IN ('CONFIRMED', 'REJECTED')
       LIMIT 1`,
      [taskId, req.user.id]
    );

    if (!taskLookup.rows.length) {
      return res.status(400).json({ message: "Task is not ready for submission" });
    }

    const projectValidation = validateSubmissionArtifacts({
      githubUrl: githubRepoUrl,
      zipBuffer: hasZip ? projectZip.buffer : null,
      level: taskLookup.rows[0].level || req.user.level,
      taskTitle: taskLookup.rows[0].title,
      taskDescription: taskLookup.rows[0].description,
    });

    if (!projectValidation.valid) {
      return res.status(400).json({
        message: projectValidation.message,
      });
    }

    let storedZipPath = null;
    if (hasZip) {
      ensureDirectoryExists(PRACTICAL_UPLOADS_DIR);
      const storedZipName = `${taskId}-${Date.now()}-${sanitizeFilename(projectZip.filename)}`;
      storedZipPath = path.join(PRACTICAL_UPLOADS_DIR, storedZipName);
      fs.writeFileSync(storedZipPath, projectZip.buffer);
    }

    const result = await pool.query(
      `UPDATE practical_tasks
       SET status = 'SUBMITTED',
           github_repo_url = $1,
           project_zip_filename = $2,
           project_zip_path = $3,
           submission_text = $4,
           submitted_at = now()
       WHERE id = $5 AND user_id = $6 AND status IN ('CONFIRMED', 'REJECTED')
       RETURNING id, request_id, user_id, level, task_number, deadline_days, due_at, title, description,
                 status, score,
                 github_repo_url, project_zip_filename, project_zip_path, submission_text, review_note, assigned_at, submitted_at, reviewed_at, confirmed_at`,
      [
        githubRepoUrl || null,
        hasZip ? projectZip.filename : null,
        storedZipPath,
        [githubRepoUrl ? `GitHub Repository: ${githubRepoUrl}` : null, hasZip ? `Uploaded ZIP: ${projectZip.filename}` : null]
          .filter(Boolean)
          .join("\n"),
        taskId,
        req.user.id,
      ]
    );

    if (!result.rows.length) {
      if (storedZipPath && fs.existsSync(storedZipPath)) {
        fs.unlinkSync(storedZipPath);
      }
      return res.status(400).json({ message: "Task is not ready for submission" });
    }

    await recordActivity(
      "task_submission",
      `${req.user.fullName} submitted practical task ${result.rows[0].task_number || ""}`.trim(),
      {
        userId: req.user.id,
        taskId,
        taskNumber: result.rows[0].task_number,
        githubRepoUrl: githubRepoUrl || null,
        zipUploaded: hasZip,
      }
    );

    await refreshUserPerformance(req.user.id);

    return res.json({
      message: "Practical work submitted successfully. Waiting for admin review.",
      task: mapPracticalTaskRow(result.rows[0]),
    });
  })
);

app.post(
  "/practical-tasks/:id/explanation",
  requireAuth,
  wrapAsync(async (req, res) => {
    await markOverduePracticalTasks(req.user.id);
    const taskId = req.params.id;
    const reason = (req.body?.reason || "").toString().trim();
    const proofReference = (req.body?.proofReference || "").toString().trim();

    if (!reason) {
      return res.status(400).json({ message: "reason is required" });
    }

    const result = await pool.query(
      `UPDATE practical_tasks
       SET missed_reason = $1,
           missed_reason_proof = $2,
           missed_reason_status = 'PENDING',
           explanation_submitted_at = now()
       WHERE id = $3 AND user_id = $4 AND status = 'FAILED'
       RETURNING id, request_id, user_id, level, task_number, deadline_days, due_at, title, description, status,
                 score,
                 github_repo_url, project_zip_filename, project_zip_path, submission_text, missed_reason, missed_reason_proof, missed_reason_status, review_note, assigned_at, submitted_at,
                 reviewed_at, missed_at, explanation_submitted_at, confirmed_at`,
      [reason, proofReference || null, taskId, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "Explanation is only allowed for failed tasks" });
    }

    await recordActivity(
      "task_explanation",
      `${req.user.fullName} submitted an explanation for missed practical task ${result.rows[0].task_number}`,
      { taskId, userId: req.user.id, taskNumber: result.rows[0].task_number }
    );

    return res.json({
      message: "Explanation submitted successfully. Admin will review it.",
      task: mapPracticalTaskRow(result.rows[0]),
    });
  })
);

app.get(
  "/user/certificate",
  requireAuth,
  wrapAsync(async (req, res) => {
    const [requestResult, certificateResult, userResult] = await Promise.all([
      pool.query(
        `SELECT id, level, final_score, progress_percent, status, requested_at, reviewed_at, admin_note
         FROM certificate_requests
         WHERE user_id = $1
         ORDER BY requested_at DESC
         LIMIT 1`,
        [req.user.id]
      ),
      pool.query(
        `SELECT certificate_id, level, final_score, issue_date, is_valid, generated_path, generated_format,
                status, verification_count, blockchain_tx
         FROM certificates
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [req.user.id]
      ),
      pool.query(
        `SELECT certificate_eligible, certificate_status, average_score, completed_tasks
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [req.user.id]
      ),
    ]);

    const request = requestResult.rows[0] || null;
    const certificate = certificateResult.rows[0] || null;
    const user = userResult.rows[0] || null;

    return res.json({
      certificateStatus: user?.certificate_status || "NOT_ELIGIBLE",
      certificateEligible: Boolean(user?.certificate_eligible),
      averageScore: Number(user?.average_score || 0),
      completedTasks: Number(user?.completed_tasks || 0),
      request: request
        ? {
            id: request.id,
            level: request.level,
            finalScore: Number(request.final_score || 0),
            progressPercent: Number(request.progress_percent || 0),
            status: request.status,
            requestedAt: request.requested_at,
            reviewedAt: request.reviewed_at,
            adminNote: request.admin_note || "",
          }
        : null,
      certificate: certificate
        ? {
            certificateId: certificate.certificate_id,
            level: certificate.level,
            finalScore: Number(certificate.final_score || 0),
            issueDate: certificate.issue_date,
            isValid: Boolean(certificate.is_valid),
            generatedFormat: certificate.generated_format || "svg",
            status: certificate.status || (certificate.is_valid ? "VALID" : "REVOKED"),
            verificationCount: Number(certificate.verification_count || 0),
            blockchainTx: certificate.blockchain_tx || null,
            viewUrl: `/certificate/view/${certificate.certificate_id}`,
            verifyUrl: `/certificate/verify/${certificate.certificate_id}`,
            downloadUrl: `/certificate/download/${certificate.certificate_id}`,
          }
        : null,
    });
  })
);

app.get(
  "/admin/requests/practical",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const status = (req.query.status || "PENDING").toString().toUpperCase();
    const { rows } = await pool.query(
      `SELECT pr.id, pr.status, pr.message, pr.requested_at, pr.level,
              u.id AS user_id, u.full_name, u.phone
       FROM practical_requests pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.status = $1
       ORDER BY pr.requested_at DESC`,
      [status]
    );

    const requests = rows.map((row) => ({
      id: row.id,
      status: row.status,
      message: row.message,
      level: row.level,
      requestedAt: row.requested_at,
      user: {
        id: row.user_id,
        fullName: row.full_name,
        phone: row.phone,
      },
    }));

    return res.json({ requests });
  })
);

app.get(
  "/admin/practical-tasks",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    await markOverduePracticalTasks();
    const { rows } = await pool.query(
      `SELECT pt.id, pt.request_id, pt.user_id, pt.level, pt.task_number, pt.deadline_days, pt.due_at,
              pt.title, pt.description, pt.status, pt.score, pt.github_repo_url, pt.project_zip_filename, pt.project_zip_path, pt.submission_text, pt.missed_reason,
              pt.missed_reason_proof, pt.missed_reason_status, pt.review_note, pt.assigned_at, pt.submitted_at,
              pt.reviewed_at, pt.missed_at, pt.explanation_submitted_at, pt.confirmed_at,
              u.full_name, u.phone, pr.level
       FROM practical_tasks pt
       JOIN users u ON u.id = pt.user_id
       JOIN practical_requests pr ON pr.id = pt.request_id
       ORDER BY pt.assigned_at DESC`
    );

    const tasks = rows.map((row) => ({
      ...mapPracticalTaskRow(row, { includeSystemReview: true }),
      user: {
        id: row.user_id,
        fullName: row.full_name,
        phone: row.phone,
        level: row.level,
      },
      projectZipDownloadUrl: row.project_zip_path ? `/admin/practical-tasks/${row.id}/project-zip` : null,
    }));

    return res.json({ tasks });
  })
);

app.post(
  "/admin/practical-tasks",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const requestId = (req.body?.requestId || "").toString().trim();
    const title = (req.body?.title || "").toString().trim();
    const description = (req.body?.description || "").toString().trim();

    if (!requestId) {
      return res.status(400).json({ message: "requestId is required" });
    }

    if (!description) {
      return res.status(400).json({ message: "description is required" });
    }

    const requestResult = await pool.query(
      `SELECT pr.id, pr.user_id, pr.status, pr.level, u.full_name, u.phone
       FROM practical_requests pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.id = $1
       LIMIT 1`,
      [requestId]
    );

    if (!requestResult.rows.length) {
      return res.status(404).json({ message: "Practical request not found" });
    }

    const requestRow = requestResult.rows[0];
    if (requestRow.status !== "APPROVED") {
      return res.status(400).json({ message: "Only approved requests can receive tasks" });
    }

    const countsResult = await pool.query(
      `SELECT COUNT(*)::int AS total_tasks,
              COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved_tasks
       FROM practical_tasks
       WHERE request_id = $1`,
      [requestId]
    );
    const counts = countsResult.rows[0];
    const rule = getPracticalRule(requestRow.level);
    const nextTaskNumber = Number(counts.total_tasks || 0) + 1;
    if (Number(counts.total_tasks || 0) >= rule.requiredTasks) {
      return res.status(400).json({
        message: `This student already has all ${rule.requiredTasks} required tasks for ${requestRow.level}.`,
      });
    }

    const normalizedTitle = title || `${requestRow.level} Practical Task ${nextTaskNumber}`;
    const insert = await pool.query(
        `INSERT INTO practical_tasks
         (id, request_id, user_id, level, task_number, deadline_days, due_at, title, description, status, assigned_at)
       VALUES ($1, $2, $3, $4, $5, $6, now() + ($7 * interval '1 hour'), $8, $9, 'ASSIGNED', now())
       RETURNING id, request_id, user_id, level, task_number, deadline_days, due_at, title, description, status,
                 score,
                 github_repo_url, project_zip_filename, project_zip_path, submission_text, review_note, assigned_at, submitted_at, reviewed_at, confirmed_at`,
      [
        crypto.randomUUID(),
        requestId,
        requestRow.user_id,
        requestRow.level,
        nextTaskNumber,
        rule.deadlineHours,
        rule.deadlineHours,
        normalizedTitle,
        description,
      ]
    );
    const taskRow = insert.rows[0];

    await recordActivity(
      "task_assigned",
      `Admin assigned practical task ${taskRow.task_number} to ${requestRow.full_name}`,
      { taskId: taskRow.id, userId: requestRow.user_id, level: requestRow.level }
    );
    await createNotification({
      userId: requestRow.user_id,
      title: "New Practical Task Assigned",
      message: `A new practical task has been assigned for ${requestRow.level}. Please confirm that you are ready to start.`,
      type: "PRACTICAL",
      targetPage: "/user/practical",
    });
    io.emit("task:updated", { taskId: taskRow.id, userId: requestRow.user_id, status: taskRow.status });

    return res.status(201).json({
      message: "Practical task sent successfully.",
      task: {
        ...mapPracticalTaskRow(taskRow, { includeSystemReview: true }),
        user: {
          id: requestRow.user_id,
          fullName: requestRow.full_name,
          phone: requestRow.phone,
          level: requestRow.level,
        },
        progress: buildPracticalProgressFromTasks(requestRow.level, []),
      },
    });
  })
);

app.get(
  "/admin/practical-tasks/:id/project-zip",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const taskId = req.params.id;
    const { rows } = await pool.query(
      `SELECT project_zip_filename, project_zip_path
       FROM practical_tasks
       WHERE id = $1
       LIMIT 1`,
      [taskId]
    );

    if (!rows.length || !rows[0].project_zip_path || !fs.existsSync(rows[0].project_zip_path)) {
      return res.status(404).json({ message: "Project ZIP file not found" });
    }

    return res.download(
      path.resolve(rows[0].project_zip_path),
      rows[0].project_zip_filename || `${taskId}.zip`
    );
  })
);

app.patch(
  "/admin/practical-tasks/:id/submission",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const taskId = req.params.id;
    const action = (req.body?.action || "").toString().trim().toUpperCase();
    const meetingMessage = (req.body?.meetingMessage || "").toString().trim();
    const reviewNote = (req.body?.reviewNote || "").toString().trim();

    if (!["APPROVE_SUBMISSION", "REJECT_SUBMISSION"].includes(action)) {
      return res.status(400).json({ message: "action must be APPROVE_SUBMISSION or REJECT_SUBMISSION" });
    }

    if (action === "APPROVE_SUBMISSION" && !meetingMessage) {
      return res.status(400).json({ message: "meetingMessage is required when approving a submission" });
    }

    const nextStatus = action === "APPROVE_SUBMISSION" ? "MEETING_REQUESTED" : "REJECTED";
    const nextNote = action === "APPROVE_SUBMISSION" ? meetingMessage : reviewNote || "Please resubmit a valid project.";

    const result = await pool.query(
      `UPDATE practical_tasks
       SET status = $1,
           review_note = $2,
           reviewed_at = now()
       WHERE id = $3 AND status = 'SUBMITTED'
       RETURNING id, request_id, user_id, level, task_number, deadline_days, due_at, title, description, status,
                 score,
                 github_repo_url, project_zip_filename, project_zip_path, submission_text, missed_reason, missed_reason_proof, missed_reason_status, review_note, assigned_at, submitted_at,
                 reviewed_at, missed_at, explanation_submitted_at, confirmed_at`,
      [nextStatus, nextNote, taskId]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "Only submitted tasks can be processed for manual review" });
    }

    const taskRow = result.rows[0];
    const userRes = await pool.query("SELECT full_name FROM users WHERE id = $1 LIMIT 1", [taskRow.user_id]);

    await recordActivity(
      "task_submission_review",
      action === "APPROVE_SUBMISSION"
        ? `Admin approved submission and requested a meeting for ${userRes.rows[0]?.full_name || "a student"}`
        : `Admin rejected submission for ${userRes.rows[0]?.full_name || "a student"}`,
      { taskId, userId: taskRow.user_id, action, taskNumber: taskRow.task_number }
    );
    await createNotification({
      userId: taskRow.user_id,
      title: action === "APPROVE_SUBMISSION" ? "Meeting Requested" : "Submission Rejected",
      message:
        action === "APPROVE_SUBMISSION"
          ? nextNote
          : nextNote || "Your practical submission was rejected. Please review and resubmit.",
      type: "PRACTICAL",
      targetPage: "/user/practical",
    });
    io.emit("task:updated", { taskId, userId: taskRow.user_id, status: taskRow.status });

    return res.json({
      message:
        action === "APPROVE_SUBMISSION"
          ? "Submission approved. Meeting request sent to the student."
          : "Submission rejected. Student must resubmit.",
      task: mapPracticalTaskRow(taskRow, { includeSystemReview: true }),
    });
  })
);

app.patch(
  "/admin/practical-tasks/:id/review",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const taskId = req.params.id;
    const status = (req.body?.status || "").toString().trim().toUpperCase();
    const reviewNote = (req.body?.reviewNote || "").toString().trim();
    const scoreValue =
      typeof req.body?.score === "number" || typeof req.body?.score === "string"
        ? Number(req.body.score)
        : null;

    if (!["APPROVED", "FAILED_REVIEW"].includes(status)) {
      return res.status(400).json({ message: "status must be APPROVED or FAILED_REVIEW" });
    }

    if (scoreValue === null || Number.isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
      return res.status(400).json({ message: "Admin must enter a score between 0 and 100" });
    }

    const result = await pool.query(
      `UPDATE practical_tasks
       SET status = $1, review_note = $2, score = $3, reviewed_at = now()
       WHERE id = $4 AND status = 'MEETING_REQUESTED'
       RETURNING id, request_id, user_id, level, task_number, deadline_days, due_at, title, description, status,
                 score,
                 github_repo_url, project_zip_filename, project_zip_path, submission_text, missed_reason, missed_reason_proof, missed_reason_status, review_note, assigned_at, submitted_at,
                 reviewed_at, missed_at, explanation_submitted_at, confirmed_at`,
      [status, reviewNote || null, scoreValue, taskId]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "Only meeting-approved tasks can receive final manual scores" });
    }

    const taskRow = result.rows[0];
    const allTasksResult = await pool.query(
      `SELECT id, request_id, user_id, level, task_number, deadline_days, due_at, title, description, status,
              score,
              github_repo_url, project_zip_filename, project_zip_path, submission_text, missed_reason, missed_reason_proof, missed_reason_status, review_note, assigned_at, submitted_at,
              reviewed_at, missed_at, explanation_submitted_at, confirmed_at
       FROM practical_tasks
       WHERE request_id = $1`,
      [taskRow.request_id]
    );

    const userRes = await pool.query("SELECT full_name FROM users WHERE id = $1 LIMIT 1", [taskRow.user_id]);
    await recordActivity(
      "task_review",
      `Admin ${status === "APPROVED" ? "completed" : "failed"} practical task ${taskRow.task_number} for ${userRes.rows[0]?.full_name || "a student"}`,
      { taskId, userId: taskRow.user_id, status, taskNumber: taskRow.task_number }
    );
    await createNotification({
      userId: taskRow.user_id,
      title: status === "APPROVED" ? "Task Approved" : "Task Failed",
      message:
        status === "APPROVED"
          ? `Your practical task ${taskRow.task_number} was approved with score ${taskRow.score}.`
          : `Your practical task ${taskRow.task_number} was marked failed with score ${taskRow.score}.`,
      type: "SCORE",
      targetPage: "/user/practical",
    });
    io.emit("task:updated", { taskId, userId: taskRow.user_id, status: taskRow.status });

    const refreshedProgress = await refreshUserPerformance(taskRow.user_id);

    return res.json({
      message: status === "APPROVED" ? "Task completed successfully." : "Task marked as failed successfully.",
      task: mapPracticalTaskRow(taskRow, { includeSystemReview: true }),
      progress: refreshedProgress || buildPracticalProgressFromTasks(taskRow.level, allTasksResult.rows),
    });
  })
);

app.patch(
  "/admin/practical-tasks/:id/explanation",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const taskId = req.params.id;
    const decision = (req.body?.decision || "").toString().trim().toUpperCase();
    const reviewNote = (req.body?.reviewNote || "").toString().trim();

    if (!["ACCEPTED", "REJECTED"].includes(decision)) {
      return res.status(400).json({ message: "decision must be ACCEPTED or REJECTED" });
    }

    const result = await pool.query(
      `UPDATE practical_tasks
       SET missed_reason_status = $1,
           review_note = $2,
           reviewed_at = now(),
           status = CASE WHEN $1 = 'ACCEPTED' THEN 'CONFIRMED' ELSE 'FAILED' END,
           score = CASE WHEN $1 = 'ACCEPTED' THEN NULL ELSE 0 END,
           due_at = CASE WHEN $1 = 'ACCEPTED' THEN now() + (deadline_days * interval '1 hour') ELSE due_at END
       WHERE id = $3 AND status = 'FAILED' AND missed_reason_status = 'PENDING'
       RETURNING id, request_id, user_id, level, task_number, deadline_days, due_at, title, description, status,
                 score,
                 github_repo_url, project_zip_filename, project_zip_path, submission_text, missed_reason, missed_reason_proof, missed_reason_status, review_note, assigned_at, submitted_at,
                 reviewed_at, missed_at, explanation_submitted_at, confirmed_at`,
      [decision, reviewNote || null, taskId]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "No pending missed-task explanation found" });
    }

    const taskRow = result.rows[0];
    const userRes = await pool.query("SELECT full_name FROM users WHERE id = $1 LIMIT 1", [taskRow.user_id]);
    await recordActivity(
      "task_explanation_review",
      `Admin ${decision === "ACCEPTED" ? "accepted" : "rejected"} explanation for missed practical task ${taskRow.task_number} from ${userRes.rows[0]?.full_name || "a student"}`,
      { taskId, userId: taskRow.user_id, decision, taskNumber: taskRow.task_number }
    );
    await createNotification({
      userId: taskRow.user_id,
      title: decision === "ACCEPTED" ? "Explanation Accepted" : "Explanation Rejected",
      message:
        decision === "ACCEPTED"
          ? "Your missed-task explanation was accepted. Please check your practical page."
          : "Your missed-task explanation was rejected. The failed result remains.",
      type: "PRACTICAL",
      targetPage: "/user/practical",
    });
    io.emit("task:updated", { taskId, userId: taskRow.user_id, status: taskRow.status });

    await refreshUserPerformance(taskRow.user_id);

    return res.json({
      message:
        decision === "ACCEPTED"
          ? "Explanation accepted. Student can redo the task."
          : "Explanation rejected. Score remains 0.",
      task: mapPracticalTaskRow(taskRow, { includeSystemReview: true }),
    });
  })
);

app.patch(
  "/admin/practical-tasks/:id/reopen",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const taskId = req.params.id;
    const reviewNote = (req.body?.reviewNote || "").toString().trim();
    const result = await pool.query(
      `UPDATE practical_tasks
       SET status = 'CONFIRMED',
           score = NULL,
           review_note = $1,
           reviewed_at = now(),
           due_at = now() + (deadline_days * interval '1 hour'),
           missed_reason_status = 'ACCEPTED'
       WHERE id = $2 AND status = 'FAILED'
       RETURNING id, request_id, user_id, level, task_number, deadline_days, due_at, title, description, status,
                 score,
                 github_repo_url, project_zip_filename, project_zip_path, submission_text, missed_reason, missed_reason_proof, missed_reason_status, review_note, assigned_at, submitted_at,
                 reviewed_at, missed_at, explanation_submitted_at, confirmed_at`,
      [reviewNote || "Admin reopened this failed task.", taskId]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "Only failed tasks can be reopened" });
    }

    await refreshUserPerformance(result.rows[0].user_id);
    await createNotification({
      userId: result.rows[0].user_id,
      title: "Task Reopened",
      message: "Admin reopened your failed practical task. You can continue from the practical page.",
      type: "PRACTICAL",
      targetPage: "/user/practical",
    });
    io.emit("task:updated", { taskId, userId: result.rows[0].user_id, status: result.rows[0].status });

    return res.json({
      message: "Failed task reopened successfully.",
      task: mapPracticalTaskRow(result.rows[0], { includeSystemReview: true }),
    });
  })
);

app.delete(
  "/admin/practical-tasks/:id",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const taskId = req.params.id;
    const result = await pool.query(
      `DELETE FROM practical_tasks
       WHERE id = $1 AND status = 'FAILED'
       RETURNING id, user_id, task_number`,
      [taskId]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "Only failed tasks can be deleted" });
    }

    await refreshUserPerformance(result.rows[0].user_id);

    return res.json({ message: "Failed task deleted successfully.", taskId });
  })
);

app.get(
  "/admin/dashboard/overview",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const snapshot = await getDashboardSnapshot();
    return res.json(snapshot);
  })
);

app.get(
  "/leaderboard",
  wrapAsync(async (req, res) => {
    const level = (req.query.level || "").toString().trim().toUpperCase();
    const scope = (req.query.scope || "all").toString().trim().toLowerCase();
    const values = [];
    const conditions = ["role = 'STUDENT'", "completed_tasks > 0"];

    if (LEVELS.includes(level)) {
      values.push(level);
      conditions.push(`level = $${values.length}`);
    }

    if (scope === "month") {
      values.push(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      conditions.push(`updated_at >= $${values.length}`);
    }

    const { rows } = await pool.query(
      `SELECT id, full_name, level, average_score, reputation_rating, completed_tasks, level_status
       FROM users
       WHERE ${conditions.join(" AND ")}
       ORDER BY average_score DESC, reputation_rating DESC, updated_at ASC
       LIMIT 10`,
      values
    );

    return res.json({
      students: rows.map((row, index) => ({
        rank: index + 1,
        id: row.id,
        fullName: row.full_name,
        level: row.level,
        averageScore: Number(row.average_score || 0),
        reputationRating: Number(row.reputation_rating || 0),
        completedTasks: Number(row.completed_tasks || 0),
        levelStatus: row.level_status,
      })),
    });
  })
);

app.get(
  "/admin/internship-candidates",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, full_name, level, average_score, reputation_rating, completed_tasks, level_status
       FROM users
       WHERE role = 'STUDENT' AND internship_eligible = TRUE
       ORDER BY average_score DESC, reputation_rating DESC, updated_at ASC`
    );

    return res.json({
      candidates: rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        level: row.level,
        averageScore: Number(row.average_score || 0),
        reputationRating: Number(row.reputation_rating || 0),
        completedTasks: Number(row.completed_tasks || 0),
        levelStatus: row.level_status,
        status: "Ready for Internship",
      })),
    });
  })
);

app.get(
  "/admin/certificate-requests",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const status = (req.query.status || "").toString().trim().toUpperCase();
    const values = [];
    const where = [];
    if (status) {
      values.push(status);
      where.push(`cr.status = $${values.length}`);
    }

    const { rows } = await pool.query(
      `SELECT cr.id, cr.user_id, cr.level, cr.final_score, cr.progress_percent, cr.status, cr.requested_at,
              cr.reviewed_at, cr.reviewed_by, cr.admin_note, u.full_name,
              c.certificate_id AS issued_certificate_id, c.status AS certificate_record_status,
              c.verification_count, c.blockchain_tx, c.is_valid
       FROM certificate_requests cr
       JOIN users u ON u.id = cr.user_id
       LEFT JOIN certificates c ON c.certificate_request_id = cr.id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY cr.requested_at DESC`,
      values
    );

    return res.json({
      requests: rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        fullName: row.full_name,
        level: row.level,
        finalScore: Number(row.final_score || 0),
        progressPercent: Number(row.progress_percent || 0),
        status: row.status,
        requestedAt: row.requested_at,
        reviewedAt: row.reviewed_at,
        reviewedBy: row.reviewed_by,
        adminNote: row.admin_note || "",
        certificate: row.issued_certificate_id
          ? {
              certificateId: row.issued_certificate_id,
              status: row.certificate_record_status || (row.is_valid ? "VALID" : "REVOKED"),
              verificationCount: Number(row.verification_count || 0),
              blockchainTx: row.blockchain_tx || null,
              viewUrl: `/certificate/view/${row.issued_certificate_id}`,
              verifyUrl: `/certificate/verify/${row.issued_certificate_id}`,
              downloadUrl: `/certificate/download/${row.issued_certificate_id}`,
            }
          : null,
      })),
    });
  })
);

app.patch(
  "/admin/certificate-requests/:id",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const requestId = req.params.id;
    const status = (req.body?.status || "").toString().trim().toUpperCase();
    const adminNote = (req.body?.adminNote || "").toString().trim();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "status must be APPROVED or REJECTED" });
    }

    const requestResult = await pool.query(
      `SELECT cr.id, cr.user_id, cr.level, cr.final_score, cr.progress_percent, cr.status, u.full_name
       FROM certificate_requests cr
       JOIN users u ON u.id = cr.user_id
       WHERE cr.id = $1
       LIMIT 1`,
      [requestId]
    );

    if (!requestResult.rows.length) {
      return res.status(404).json({ message: "Certificate request not found" });
    }

    const requestRow = requestResult.rows[0];
    if (requestRow.status !== "PENDING") {
      return res.status(400).json({ message: "Certificate request already reviewed" });
    }

    const performance = await refreshUserPerformance(requestRow.user_id);
    if (status === "APPROVED" && !performance?.certificateEligible) {
      return res.status(400).json({ message: "User is not eligible for certificate approval" });
    }

    await pool.query(
      `UPDATE certificate_requests
       SET status = $1, admin_note = $2, reviewed_at = now(), reviewed_by = 'ADMIN'
       WHERE id = $3`,
      [status, adminNote || null, requestId]
    );

    let certificate = null;
    if (status === "APPROVED") {
      const certificateId = await generateCertificateId(requestRow.level);
      const issueDate = new Date();
      const certificateHash = computeCertificateHash({
        fullName: requestRow.full_name,
        level: requestRow.level,
        issueDate,
        certificateId,
      });
      const verificationUrl = buildCertificateVerificationUrl(certificateId);
      const certificateInsert = await pool.query(
        `INSERT INTO certificates
           (id, user_id, certificate_request_id, certificate_id, level, final_score, issue_date, verification_token, is_valid, created_at, certificate_hash, status, blockchain_tx)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, now(), $9, 'VALID', $10)
         RETURNING id, certificate_id, level, final_score, issue_date, is_valid, status, verification_count, blockchain_tx`,
        [
          crypto.randomUUID(),
          requestRow.user_id,
          requestId,
          certificateId,
          requestRow.level,
          requestRow.final_score,
          issueDate,
          crypto.randomUUID(),
          certificateHash,
          null,
        ]
      );
      certificate = certificateInsert.rows[0];

      const generatedAsset = await generateCertificateAsset({
        certificateId,
        fullName: requestRow.full_name,
        level: requestRow.level,
        issueDate,
        verificationUrl,
      });

      await pool.query(
        `UPDATE certificates
         SET generated_path = $1, generated_format = $2, pdf_path = $1, qr_code_path = $3
         WHERE id = $4`,
        [generatedAsset.generatedPath, generatedAsset.generatedFormat, verificationUrl, certificate.id]
      );

      await pool.query(
        `INSERT INTO certificate_audit_logs (id, certificate_id, action, actor_type, actor_id, description, created_at)
         VALUES ($1, $2, 'APPROVED', 'ADMIN', 'ADMIN_API_KEY', $3, now())`,
        [crypto.randomUUID(), certificate.id, `Certificate approved for ${requestRow.full_name}`]
      );
    }

    await pool.query(
      "UPDATE users SET certificate_status = $1, updated_at = now() WHERE id = $2",
      [status === "APPROVED" ? "APPROVED" : "REJECTED", requestRow.user_id]
    );

    await recordActivity(
      status === "APPROVED" ? "certificate_generated" : "certificate_rejected",
      `Admin ${status === "APPROVED" ? "approved" : "rejected"} certificate request for ${requestRow.full_name}`,
      { requestId, userId: requestRow.user_id, status }
    );
    await createNotification({
      userId: requestRow.user_id,
      title: status === "APPROVED" ? "Certificate Approved" : "Certificate Rejected",
      message:
        status === "APPROVED"
          ? "Your certificate has been approved. You can now view and download it."
          : adminNote || "Your certificate request was rejected by admin.",
      type: "CERTIFICATE",
      targetPage: "/user/practical",
    });
    io.emit("certificate:updated", {
      requestId,
      userId: requestRow.user_id,
      status,
      certificateId: certificate?.certificate_id || null,
    });

    return res.json({
      message:
        status === "APPROVED"
          ? "Certificate request approved successfully."
          : "Certificate request rejected successfully.",
      certificate: certificate
        ? {
            certificateId: certificate.certificate_id,
            level: certificate.level,
            finalScore: Number(certificate.final_score || 0),
            issueDate: certificate.issue_date,
            isValid: Boolean(certificate.is_valid),
            status: certificate.status,
            verificationCount: Number(certificate.verification_count || 0),
            blockchainTx: certificate.blockchain_tx || null,
            viewUrl: `/certificate/view/${certificate.certificate_id}`,
            downloadUrl: `/certificate/download/${certificate.certificate_id}`,
            verifyUrl: `/certificate/verify/${certificate.certificate_id}`,
          }
        : null,
    });
  })
);

app.get(
  "/certificate/view/:certificateId",
  wrapAsync(async (req, res) => {
    const certificateId = (req.params.certificateId || "").toString().trim();
    const { rows } = await pool.query(
      `SELECT generated_path, generated_format, is_valid, status
       FROM certificates
       WHERE certificate_id = $1
       LIMIT 1`,
      [certificateId]
    );

    if (!rows.length || !rows[0].is_valid || rows[0].status === "REVOKED") {
      return res.status(404).json({ message: "Certificate preview not available" });
    }

    const generatedPath = rows[0].generated_path;
    if (!generatedPath || !fs.existsSync(generatedPath)) {
      return res.status(404).json({ message: "Generated certificate not found" });
    }

    if ((rows[0].generated_format || "svg") === "svg") {
      res.type("image/svg+xml");
    }

    return res.sendFile(path.resolve(generatedPath));
  })
);

app.get(
  "/certificate/verify/:certificateId",
  wrapAsync(async (req, res) => {
    const certificateId = (req.params.certificateId || "").toString().trim();
    const { rows } = await pool.query(
      `SELECT c.id, c.certificate_id, c.level, c.final_score, c.issue_date, c.is_valid, c.pdf_path,
              c.generated_path, c.generated_format, c.certificate_hash, c.verification_token,
              c.blockchain_tx, c.status, c.verification_count,
              u.full_name
       FROM certificates c
       JOIN users u ON u.id = c.user_id
       WHERE c.certificate_id = $1
       LIMIT 1`,
      [certificateId]
    );

    if (!rows.length) {
      return res.status(404).json({
        valid: false,
        message: "Certificate not found",
        certificateId,
      });
    }

    const certificate = rows[0];
    const expectedHash = computeCertificateHash({
      fullName: certificate.full_name,
      level: certificate.level,
      issueDate: certificate.issue_date,
      certificateId: certificate.certificate_id,
    });
    const tampered = certificate.certificate_hash && certificate.certificate_hash !== expectedHash;
    const isValid = Boolean(certificate.is_valid) && !tampered && certificate.status !== "REVOKED";
    const statusLabel = tampered
      ? "TAMPERED"
      : certificate.status === "REVOKED"
        ? "REVOKED"
        : isValid
          ? "VALID"
          : "INVALID";

    await pool.query(
      `UPDATE certificates
       SET verification_count = verification_count + 1
       WHERE id = $1`,
      [certificate.id]
    );
    await pool.query(
      `INSERT INTO certificate_verification_logs
         (id, certificate_id, certificate_lookup_id, verified_at, status, source, metadata)
       VALUES ($1, $2, $3, now(), $4, 'PUBLIC_VERIFY', $5::jsonb)`,
      [
        crypto.randomUUID(),
        certificate.id,
        certificate.certificate_id,
        statusLabel,
        JSON.stringify({
          ip: req.ip,
          userAgent: req.headers["user-agent"] || "",
        }),
      ]
    );

    const payload = {
      valid: isValid,
      tampered,
      certificateId: certificate.certificate_id,
      fullName: certificate.full_name,
      level: certificate.level,
      finalScore: Number(certificate.final_score || 0),
      issuedBy: "Autiva Tech",
      issueDate: certificate.issue_date,
      blockchainTx: certificate.blockchain_tx || null,
      verificationCount: Number(certificate.verification_count || 0) + 1,
      viewUrl: `/certificate/view/${certificate.certificate_id}`,
      downloadUrl: isValid ? `/certificate/download/${certificate.certificate_id}` : null,
      status: statusLabel,
    };

    const wantsHtml =
      !req.headers.accept ||
      req.headers.accept.includes("text/html") ||
      req.headers.accept.includes("*/*");
    if (wantsHtml) {
      return res.type("html").send(
        renderCertificateVerificationPage({
          certificateId: payload.certificateId,
          fullName: payload.fullName,
          level: payload.level,
          issueDate: payload.issueDate,
          status: payload.status,
          isValid: payload.valid,
          tampered: payload.tampered,
          verificationCount: payload.verificationCount,
          blockchainTx: payload.blockchainTx,
          downloadUrl: payload.downloadUrl ? `${PUBLIC_APP_URL}${payload.downloadUrl}` : null,
        })
      );
    }

    return res.json(payload);
  })
);

app.get(
  "/certificate/download/:certificateId",
  wrapAsync(async (req, res) => {
    const certificateId = (req.params.certificateId || "").toString().trim();
    const { rows } = await pool.query(
      `SELECT generated_path, generated_format, pdf_path, is_valid, status
       FROM certificates
       WHERE certificate_id = $1
       LIMIT 1`,
      [certificateId]
    );

    if (!rows.length || !rows[0].is_valid || rows[0].status === "REVOKED") {
      return res.status(404).json({ message: "Certificate file not available" });
    }

    const generatedPath = rows[0].generated_path || rows[0].pdf_path;
    const generatedFormat = rows[0].generated_format || "svg";
    if (!generatedPath || !fs.existsSync(generatedPath)) {
      return res.status(404).json({ message: "Certificate file not generated yet" });
    }

    return res.download(path.resolve(generatedPath), `${certificateId}.${generatedFormat}`);
  })
);

app.get(
  "/admin/certificates/:certificateId/history",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const certificateId = (req.params.certificateId || "").toString().trim();
    const { rows } = await pool.query(
      `SELECT cvl.id, cvl.verified_at, cvl.status, cvl.source, cvl.metadata
       FROM certificate_verification_logs cvl
       JOIN certificates c ON c.id = cvl.certificate_id
       WHERE c.certificate_id = $1
       ORDER BY cvl.verified_at DESC`,
      [certificateId]
    );

    return res.json({
      history: rows.map((row) => ({
        id: row.id,
        verifiedAt: row.verified_at,
        status: row.status,
        source: row.source,
        metadata: row.metadata || {},
      })),
    });
  })
);

app.patch(
  "/admin/certificates/:certificateId/revoke",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const certificateId = (req.params.certificateId || "").toString().trim();
    const adminNote = (req.body?.adminNote || "Certificate revoked by admin").toString().trim();
    const result = await pool.query(
      `UPDATE certificates
       SET is_valid = FALSE, status = 'REVOKED'
       WHERE certificate_id = $1
       RETURNING id, user_id, certificate_id`,
      [certificateId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    await pool.query(
      `INSERT INTO certificate_audit_logs (id, certificate_id, action, actor_type, actor_id, description, created_at)
       VALUES ($1, $2, 'REVOKED', 'ADMIN', 'ADMIN_API_KEY', $3, now())`,
      [crypto.randomUUID(), result.rows[0].id, adminNote]
    );
    await pool.query(
      "UPDATE users SET certificate_status = 'REVOKED', updated_at = now() WHERE id = $1",
      [result.rows[0].user_id]
    );
    await createNotification({
      userId: result.rows[0].user_id,
      title: "Certificate Revoked",
      message: adminNote,
      type: "CERTIFICATE",
      targetPage: "/user/practical",
    });
    io.emit("certificate:updated", {
      userId: result.rows[0].user_id,
      certificateId,
      status: "REVOKED",
    });

    return res.json({ message: "Certificate revoked successfully." });
  })
);

app.post(
  "/admin/certificates/:certificateId/regenerate",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const certificateId = (req.params.certificateId || "").toString().trim();
    const result = await pool.query(
      `SELECT c.id, c.user_id, c.certificate_id, c.level, c.issue_date, u.full_name
       FROM certificates c
       JOIN users u ON u.id = c.user_id
       WHERE c.certificate_id = $1
       LIMIT 1`,
      [certificateId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    const row = result.rows[0];
    const generatedAsset = await generateCertificateAsset({
      certificateId: row.certificate_id,
      fullName: row.full_name,
      level: row.level,
      issueDate: row.issue_date,
      verificationUrl: buildCertificateVerificationUrl(row.certificate_id),
    });

    await pool.query(
      `UPDATE certificates
       SET generated_path = $1, generated_format = $2, pdf_path = $1, is_valid = TRUE,
           status = 'VALID'
       WHERE id = $3`,
      [generatedAsset.generatedPath, generatedAsset.generatedFormat, row.id]
    );
    await pool.query(
      `INSERT INTO certificate_audit_logs (id, certificate_id, action, actor_type, actor_id, description, created_at)
       VALUES ($1, $2, 'REGENERATED', 'ADMIN', 'ADMIN_API_KEY', $3, now())`,
      [crypto.randomUUID(), row.id, `Certificate regenerated for ${row.full_name}`]
    );
    await pool.query(
      "UPDATE users SET certificate_status = 'APPROVED', updated_at = now() WHERE id = $1",
      [row.user_id]
    );
    await createNotification({
      userId: row.user_id,
      title: "Certificate Regenerated",
      message: "Your certificate has been regenerated and remains available for verification.",
      type: "CERTIFICATE",
      targetPage: "/user/practical",
    });
    io.emit("certificate:updated", {
      userId: row.user_id,
      certificateId: row.certificate_id,
      status: "APPROVED",
    });

    return res.json({
      message: "Certificate regenerated successfully.",
      certificate: {
        certificateId: row.certificate_id,
        viewUrl: `/certificate/view/${row.certificate_id}`,
        downloadUrl: `/certificate/download/${row.certificate_id}`,
        verifyUrl: `/certificate/verify/${row.certificate_id}`,
      },
    });
  })
);

app.get(
  "/admin/payments",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const status = (req.query.status || "").toString().trim().toUpperCase();
    const query = `
      SELECT p.id, p.payer_name, p.payer_phone, p.reference_code, p.method, p.amount,
             p.destination_account_number, p.destination_account_name, p.destination_provider,
             p.status, p.admin_note, p.created_at,
             u.id AS user_id, u.full_name, u.phone, u.email, u.level
      FROM payments p
      JOIN users u ON u.id = p.user_id
      ${status ? "WHERE p.status = $1" : ""}
      ORDER BY p.created_at DESC
    `;
    const { rows } = await pool.query(query, status ? [status] : []);

    const payments = rows.map((row) => ({
      ...mapPaymentRow(row),
      user: {
        id: row.user_id,
        fullName: row.full_name,
        phone: row.phone,
        email: row.email,
        level: row.level,
      },
    }));

    return res.json({ payments });
  })
);

app.patch(
  "/admin/payments/:id",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const paymentId = req.params.id;
    const status = (req.body?.status || "").toString().trim().toUpperCase();
    const adminNote = (req.body?.adminNote || "").toString().trim();

    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return res.status(400).json({ message: "status must be PENDING, APPROVED or REJECTED" });
    }

    let result;
    if (status === "REJECTED") {
      result = await pool.query(
        `DELETE FROM payments
         WHERE id = $1
         RETURNING id, user_id, payer_name, payer_phone, reference_code, method, amount,
                   destination_account_number, destination_account_name, destination_provider,
                   status, admin_note, created_at`,
        [paymentId]
      );
    } else {
      result = await pool.query(
        `UPDATE payments
         SET status = $1, admin_note = $2
         WHERE id = $3
         RETURNING id, user_id, payer_name, payer_phone, reference_code, method, amount,
                   destination_account_number, destination_account_name, destination_provider,
                   status, admin_note, created_at`,
        [status, adminNote || null, paymentId]
      );
    }

    if (!result.rows.length) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const paymentRow = result.rows[0];
    await pool.query("UPDATE users SET status = $1, updated_at = now() WHERE id = $2", [
      status === "APPROVED" ? "ACTIVE" : "NEW",
      paymentRow.user_id,
    ]);

    const userRes = await pool.query("SELECT full_name FROM users WHERE id = $1 LIMIT 1", [
      paymentRow.user_id,
    ]);
    const fullName = userRes.rows[0]?.full_name || "A student";
    await recordActivity(
      "payment_review",
      `Admin ${status === "APPROVED" ? "approved" : status === "REJECTED" ? "rejected" : "updated"} payment for ${fullName}`,
      { paymentId, userId: paymentRow.user_id, status }
    );
    await createNotification({
      userId: paymentRow.user_id,
      title: status === "APPROVED" ? "Payment Approved" : status === "REJECTED" ? "Payment Rejected" : "Payment Updated",
      message:
        status === "APPROVED"
          ? "Your payment was approved. You can continue in the platform."
          : status === "REJECTED"
            ? "Your payment was rejected. Please submit a new payment."
            : "Your payment status is still pending admin review.",
      type: "GENERAL",
      targetPage: "/user/home",
    });

    return res.json({
      payment: status === "REJECTED" ? null : mapPaymentRow(paymentRow),
      message:
        status === "REJECTED"
          ? "Payment rejected and removed successfully."
          : "Payment updated successfully.",
    });
  })
);

app.get(
  "/admin/users",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, phone, level, status, average_score, reputation_rating,
              completed_tasks, level_status, internship_eligible, certificate_eligible, certificate_status, created_at
       FROM users
       WHERE role = 'STUDENT'
       ORDER BY created_at DESC`
    );

    const users = rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      level: row.level,
      status: row.status,
      averageScore: Number(row.average_score || 0),
      reputationRating: Number(row.reputation_rating || 0),
      completedTasks: Number(row.completed_tasks || 0),
      levelStatus: row.level_status,
      internshipEligible: Boolean(row.internship_eligible),
      certificateEligible: Boolean(row.certificate_eligible),
      certificateStatus: row.certificate_status,
      registrationDate: row.created_at ? new Date(row.created_at).toISOString() : null,
    }));

    return res.json({ users });
  })
);

app.patch(
  "/admin/requests/practical/:id",
  requireAdminKey,
  wrapAsync(async (req, res) => {
    const requestId = req.params.id;
    const status = (req.body?.status || "").toString().toUpperCase();
    const allowed = ["PENDING", "APPROVED", "REJECTED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "status must be PENDING, APPROVED or REJECTED" });
    }

    const result = await pool.query(
      "UPDATE practical_requests SET status = $1 WHERE id = $2 RETURNING id, status, requested_at, user_id",
      [status, requestId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Practical request not found" });
    }

    const userRes = await pool.query("SELECT full_name FROM users WHERE id = $1 LIMIT 1", [
      result.rows[0].user_id,
    ]);
    await recordActivity(
      "request_review",
      `Admin ${status === "APPROVED" ? "accepted" : status === "REJECTED" ? "rejected" : "updated"} practical request for ${userRes.rows[0]?.full_name || "a student"}`,
      { requestId, userId: result.rows[0].user_id, status }
    );
    await createNotification({
      userId: result.rows[0].user_id,
      title: status === "APPROVED" ? "Practical Request Approved" : status === "REJECTED" ? "Practical Request Rejected" : "Practical Request Updated",
      message:
        status === "APPROVED"
          ? "Your practical request was approved. Check the practical page for the assigned task."
          : status === "REJECTED"
            ? "Your practical request was rejected. Review your work and try again later."
            : "Your practical request is still pending admin review.",
      type: "PRACTICAL",
      targetPage: "/user/practical",
    });

    return res.json({
      request: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        requestedAt: result.rows[0].requested_at,
        userId: result.rows[0].user_id,
      },
    });
  })
);

app.post(
  "/payments/proof",
  requireAuth,
  wrapAsync(async (req, res) => {
    const { fields, files } = parseMultipartFormData(req);
    const payload = Object.keys(fields).length ? fields : req.body;
    const method = (payload.method || "").toUpperCase();
    const rawAmount = payload.amount;
    const referenceCode = (payload.referenceCode || payload.reference_code || "").toString().trim();
    const payerName = (payload.payerName || payload.payer_name || req.user.fullName || "").toString().trim();
    const payerPhone = normalizeRwPhone(
      payload.payerPhone || payload.payer_phone || req.user.phone || ""
    );

    if (!VALID_PAYMENT_METHODS.includes(method)) {
      return res.status(400).json({ message: "Unsupported payment method" });
    }

    const destination = await getPaymentDestinationSettings();
    if (!destination.accountNumber) {
      return res.status(400).json({
        message: "Payment destination account is not configured yet",
      });
    }

    const amount = Number(rawAmount) || paymentAmountForLevel(req.user.level);
    const proofFile = files.find((file) => file.name === "proof");
    const proofFileName = proofFile ? proofFile.filename : null;

    const paymentId = crypto.randomUUID();
    const insert = await pool.query(
      `INSERT INTO payments
         (id, user_id, payer_name, payer_phone, reference_code, method, amount, destination_account_number, destination_account_name, destination_provider, status, proof_filename, admin_note, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now())
         RETURNING id, payer_name, payer_phone, reference_code, method, amount, destination_account_number, destination_account_name, destination_provider, status, admin_note, created_at`,
      [
        paymentId,
        req.user.id,
        payerName || req.user.fullName,
        payerPhone || req.user.phone,
        referenceCode || `AUTIVA-${Date.now()}`,
        method,
        amount,
        destination.accountNumber,
        destination.accountName || null,
        destination.provider,
        "PENDING",
        proofFileName,
        null,
      ]
    );

    await pool.query("UPDATE users SET status = $1, updated_at = now() WHERE id = $2", [
      "PENDING_PAYMENT",
      req.user.id,
    ]);

    await recordActivity("payment_submitted", `${req.user.fullName} submitted a payment`, {
      userId: req.user.id,
      level: req.user.level,
      amount,
      method,
    });

    return res.status(201).json({
      payment: mapPaymentRow(insert.rows[0]),
      message: "Payment submitted successfully. Please wait for admin approval.",
    });
  })
);

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({ message: err.message || "Unexpected error" });
});

io.on("connection", (socket) => {
  socket.emit("connected", { id: socket.id, time: new Date().toISOString() });
});

async function start() {
  await ensureTables();
  ensureDirectoryExists(PRACTICAL_UPLOADS_DIR);
  await markOverduePracticalTasks();
  setInterval(() => {
    markOverduePracticalTasks().catch((err) => {
      console.error("Deadline sweep failed", err);
    });
  }, DEADLINE_SWEEP_INTERVAL_MS);
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
