import type {
  AuthTokens,
  Lesson,
  PaymentMethod,
  PaymentProof,
  User,
} from "../types";

const DB_KEY = "autiva_mock_db_v1";

type MockDB = {
  users: Array<User & { password: string }>;
  payments: Record<string, PaymentProof | null>; // userId -> payment
  tokens: Record<string, AuthTokens>; // userId -> tokens
};

function uid() {
  // crypto.randomUUID() is supported in modern browsers
  return crypto.randomUUID();
}

function nowISO() {
  return new Date().toISOString();
}

function readDB(): MockDB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as MockDB;
  } catch {}
  return { users: [], payments: {}, tokens: {} };
}

function writeDB(db: MockDB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function makeTokens(): AuthTokens {
  return {
    accessToken: "mock_access_" + Math.random().toString(36).slice(2),
    refreshToken: "mock_refresh_" + Math.random().toString(36).slice(2),
  };
}

function amountByLevel(level: User["level"]) {
  if (level === "L3") return 10000;
  if (level === "L4") return 20000;
  return 30000; // L5
}

function lessonsFor(level: User["level"]): Lesson[] {
  const base = [
    {
      sessionNumber: 1,
      title: "Program Onboarding",
      description: "Tools setup, workflow, expectations, and fundamentals.",
    },
    {
      sessionNumber: 2,
      title: "UI Development",
      description: "Reusable components, layouts, and clean UI structure.",
    },
    {
      sessionNumber: 3,
      title: "Working with APIs",
      description: "Auth, requests, error handling, and data fetching patterns.",
    },
  ];

  return base.map((s) => ({
    id: uid(),
    level,
    sessionNumber: s.sessionNumber,
    title: `${level} • ${s.title}`,
    description: s.description,
    contentUrl: "https://example.com",
  }));
}

// Rwanda phone: 07xxxxxxxx or +2507xxxxxxxx
const RW_PHONE = /^(\+250|250)?7\d{8}$/;

export const mockServer = {
  async register(input: {
    fullName: string;
    phone: string;
    email?: string | null;
    level: User["level"];
    password: string;
  }) {
    const db = readDB();

    if (!input.fullName || input.fullName.trim().length < 2) {
      throw new Error("Full name is required.");
    }
    if (!RW_PHONE.test(input.phone)) {
      throw new Error("Invalid Rwanda phone number format.");
    }
    if (!input.level) {
      throw new Error("Level is required.");
    }
    if (!input.password || input.password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    const exists = db.users.find((u) => u.phone === input.phone);
    if (exists) {
      throw new Error("Phone number already registered. Please login.");
    }

    const user: User & { password: string } = {
      id: uid(),
      fullName: input.fullName,
      phone: input.phone,
      email: input.email ?? null,
      level: input.level,
      role: "STUDENT",
      status: "NEW",
      password: input.password, // stored only for mock; in real backend hash it
    };

    const tokens = makeTokens();

    db.users.push(user);
    db.tokens[user.id] = tokens;
    db.payments[user.id] = null;

    writeDB(db);

    // return user without password
    const { password, ...safeUser } = user;
    return { user: safeUser as User, tokens };
  },

  async login(input: { phone: string; password: string }) {
    const db = readDB();

    if (!RW_PHONE.test(input.phone)) {
      throw new Error("Invalid Rwanda phone number format.");
    }

    const user = db.users.find((u) => u.phone === input.phone);
    if (!user) throw new Error("Account not found. Please create an account.");

    // In mock, we can check password for realism:
    if (user.password !== input.password) {
      throw new Error("Invalid phone or password.");
    }

    const tokens = db.tokens[user.id] ?? makeTokens();
    db.tokens[user.id] = tokens;
    writeDB(db);

    const { password, ...safeUser } = user;
    return { user: safeUser as User, tokens };
  },

  async refresh(_input: { refreshToken: string }) {
    // Always return fresh tokens in mock
    return { tokens: makeTokens() };
  },

  async getPaymentStatus(userId: string) {
    const db = readDB();
    return { payment: db.payments[userId] ?? null };
  },

  async uploadPaymentProof(input: {
    userId: string;
    method: PaymentMethod;
    referenceCode: string;
    amount?: number;
  }) {
    const db = readDB();
    const user = db.users.find((u) => u.id === input.userId);
    if (!user) throw new Error("User not found.");

    const payment: PaymentProof = {
      id: uid(),
      referenceCode: input.referenceCode || `AUTIVA-${Date.now()}`,
      method: input.method,
      amount: input.amount ?? amountByLevel(user.level),
      status: "PENDING",
      adminNote: null,
      createdAt: nowISO(),
    };

    db.payments[user.id] = payment;
    user.status = "PENDING_VERIFICATION";
    writeDB(db);

    const { password, ...safeUser } = user;
    return { payment, user: safeUser as User };
  },

  async getLessonsMy(userId: string) {
    const db = readDB();
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found.");
    const lessons = lessonsFor(user.level);
    return { lessons };
  },

  // Optional dev helper: approve payment to unlock dashboard
  async approvePayment(userId: string) {
    const db = readDB();
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found.");

    const payment = db.payments[userId];
    if (!payment) throw new Error("No payment found.");

    payment.status = "APPROVED";
    user.status = "ACTIVE";
    writeDB(db);

    const { password, ...safeUser } = user;
    return { user: safeUser as User, payment };
  },

  // Optional dev helper: reset mock DB
  async reset() {
    localStorage.removeItem(DB_KEY);
    return true;
  },
};