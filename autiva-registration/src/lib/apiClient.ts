import axios from "axios";
import { env } from "./env";
import { MOCK_MODE } from "./mock";
import { mockServer } from "./mockServer";

const AUTH_KEY = "autiva_auth_v1";

// -------- helpers ----------
function readAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeAuth(auth: any) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

// This fixes your error: config.data may be an object OR a string
function parseBody(data: any) {
  if (!data) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data; // already object
}

// -------- axios instance ----------
export const api = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 20000,
});

let refreshRequest: Promise<any> | null = null;

// ===================================
// MOCK MODE: intercept and respond
// ===================================
if (MOCK_MODE) {
  api.interceptors.request.use(async (config) => {
    const method = (config.method || "get").toLowerCase();
    const url = config.url || "";
    const auth = readAuth();
    const userId = auth?.user?.id as string | undefined;

    // mimic network latency
    await new Promise((r) => setTimeout(r, 250));

    // AUTH
    if (method === "post" && url === "/auth/register") {
      const data = parseBody(config.data);
      const res = await mockServer.register(data);
      (config as any).mockResponse = { data: res, status: 200 };
      return config;
    }

    if (method === "post" && url === "/auth/login") {
      const data = parseBody(config.data);
      const res = await mockServer.login(data);
      (config as any).mockResponse = { data: res, status: 200 };
      return config;
    }

    if (method === "post" && url === "/auth/refresh") {
      const data = parseBody(config.data);
      const res = await mockServer.refresh(data);
      (config as any).mockResponse = { data: res, status: 200 };
      return config;
    }

    // PAYMENTS
    if (method === "get" && url === "/payments/status") {
      if (!userId) throw new Error("Not authenticated.");
      const res = await mockServer.getPaymentStatus(userId);
      (config as any).mockResponse = { data: res, status: 200 };
      return config;
    }

    if (method === "post" && url === "/payments/proof") {
      if (!userId) throw new Error("Not authenticated.");

      const fd = config.data as FormData;
      const methodVal = String(fd.get("method") || "MTN");
      const referenceCode = String(fd.get("referenceCode") || "");
      const amount = Number(fd.get("amount") || 0);

      const res = await mockServer.uploadPaymentProof({
        userId,
        method: methodVal as any,
        referenceCode,
        amount,
      });

      (config as any).mockResponse = { data: { payment: res.payment }, status: 200 };
      return config;
    }

    // LESSONS
    if (method === "get" && url === "/lessons/my") {
      if (!userId) throw new Error("Not authenticated.");
      const res = await mockServer.getLessonsMy(userId);
      (config as any).mockResponse = { data: res, status: 200 };
      return config;
    }

    // anything else: still tries real backend (optional)
    return config;
  });

  // adapter: if mockResponse exists, return it as axios response
  api.defaults.adapter = async (config: any) => {
    if (config.mockResponse) {
      return {
        data: config.mockResponse.data,
        status: config.mockResponse.status,
        statusText: "OK",
        headers: {},
        config,
        request: {},
      };
    }
    const fallback = axios.defaults.adapter!;
    return fallback(config);
  };
}

// ===================================
// REAL MODE: attach access token
// ===================================
if (!MOCK_MODE) {
  api.interceptors.request.use((config) => {
    const auth = readAuth();
    const token = auth?.tokens?.accessToken;
    if (token) {
      config.headers = config.headers || {};
      if (typeof (config.headers as any).set === "function") {
        (config.headers as any).set("Authorization", `Bearer ${token}`);
      } else {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error?.config;
      const status = error?.response?.status;
      const auth = readAuth();
      const refreshToken = auth?.tokens?.refreshToken;
      const requestUrl = originalRequest?.url || "";

      if (
        status !== 401 ||
        !refreshToken ||
        originalRequest?._retry ||
        requestUrl === "/auth/login" ||
        requestUrl === "/auth/register" ||
        requestUrl === "/auth/refresh"
      ) {
        throw error;
      }

      originalRequest._retry = true;

      try {
        if (!refreshRequest) {
          refreshRequest = axios
            .post(`${env.API_BASE_URL}/auth/refresh`, { refreshToken })
            .then((res) => {
              const nextAuth = {
                user: res.data.user,
                tokens: res.data.tokens,
              };
              writeAuth(nextAuth);
              return nextAuth;
            })
            .finally(() => {
              refreshRequest = null;
            });
        }

        const nextAuth = await refreshRequest;
        originalRequest.headers = originalRequest.headers || {};
        if (typeof originalRequest.headers.set === "function") {
          originalRequest.headers.set(
            "Authorization",
            `Bearer ${nextAuth.tokens.accessToken}`
          );
        } else {
          originalRequest.headers.Authorization = `Bearer ${nextAuth.tokens.accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        clearAuth();
        throw refreshError;
      }
    }
  );
}
