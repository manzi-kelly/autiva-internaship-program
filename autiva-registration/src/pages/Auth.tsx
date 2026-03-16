import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { api } from "../lib/apiClient";
import { useAuth } from "../store/auth";
import type { AuthTokens, Level, User } from "../types";

// ────────────────────────────────────────────────
// Schemas & Helpers
const RW_PHONE = /^(\+?250|0)?7\d{8}$/;

const loginSchema = z.object({
  phone: z.string().regex(RW_PHONE, "Use Rwanda format: 078xxxxxxx or +25078xxxxxxx"),
  password: z.string().min(6, "Minimum 6 characters"),
});

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    phone: z.string().regex(RW_PHONE, "Use Rwanda format: 078xxxxxxx or +25078xxxxxxx"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    level: z.enum(["L3", "L4", "L5"]),
    password: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string().min(8, "Minimum 8 characters"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function strengthLabel(score: number) {
  if (score <= 1) return { label: "Weak", color: "bg-rose-500" };
  if (score === 2) return { label: "Fair", color: "bg-amber-500" };
  if (score === 3) return { label: "Good", color: "bg-emerald-500" };
  return { label: "Strong", color: "bg-emerald-600" };
}

function phoneExistsInMockDB(phone: string) {
  try {
    const raw = localStorage.getItem("autiva_mock_db_v1");
    if (!raw) return false;
    const db = JSON.parse(raw);
    return (db?.users || []).some((u: any) => u.phone === phone);
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────────
// Password field with eye toggle
type PasswordFieldProps = {
  label: string;
  placeholder?: string;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, placeholder, error, hint, ...inputProps }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>

        <div className="relative">
          <input
            ref={ref}
            type={show ? "text" : "password"}
            placeholder={placeholder}
            {...inputProps}
            className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm outline-none transition
              ${
                error
                  ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  : "border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              }`}
          />

          <button
            type="button"
            onClick={() => setShow((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-500 hover:text-emerald-600 transition"
          >
            {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>

        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    );
  }
);
PasswordField.displayName = "PasswordField";

// ────────────────────────────────────────────────
export default function Auth() {
  const navigate = useNavigate();
  const { setAuth, user, tokens } = useAuth();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [serverError, setServerError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user && tokens?.accessToken) {
      if (user.status === "ACTIVE") {
        navigate("/dashboard", { replace: true });
      }
      else navigate("/payment", { replace: true });
    }
  }, [user, tokens, navigate]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
    mode: "onTouched",
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      level: "L3",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const pw = registerForm.watch("password");
  const pwStrength = useMemo(() => passwordStrength(pw || ""), [pw]);
  const { label: strengthLabelText, color: strengthColor } = strengthLabel(pwStrength);

  async function handleLogin(values: LoginForm) {
    setServerError(null);
    setInfoMsg(null);

    try {
      const res = await api.post<{ user: User; tokens: AuthTokens }>("/auth/login", values);
      setAuth({ user: res.data.user, tokens: res.data.tokens });
      navigate(res.data.user.status === "ACTIVE" ? "/dashboard" : "/payment");
    } catch (e: any) {
      setServerError(e?.response?.data?.message || "Login failed");
    }
  }

  async function handleRegister(values: RegisterForm) {
    setServerError(null);
    setInfoMsg(null);

    if (phoneExistsInMockDB(values.phone)) {
      setTab("login");
      setInfoMsg("Phone number already registered. Please login.");
      return;
    }

    try {
      const payload = {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || null,
        level: values.level as Level,
        password: values.password,
      };

      const res = await api.post<{ user: User; tokens: AuthTokens }>("/auth/register", payload);
      setAuth({ user: res.data.user, tokens: res.data.tokens });
      navigate("/payment");
    } catch (e: any) {
      setServerError(e?.response?.data?.message || "Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-2xl font-bold shadow-lg">
            A
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Autiva Tech
          </h1>
          <p className="mt-2 text-gray-600">
            Empowering Rwanda&apos;s future through technology
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden">
          {/* Tabs */}
          <div className="relative border-b border-gray-200">
            <div className="flex">
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setServerError(null);
                  setInfoMsg(null);
                }}
                className={`relative flex-1 py-4 text-sm font-semibold transition-colors ${
                  tab === "login" ? "text-emerald-700" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Sign In
                {tab === "login" && (
                  <span className="absolute inset-x-6 bottom-0 h-0.5 bg-emerald-600 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setServerError(null);
                  setInfoMsg(null);
                }}
                className={`relative flex-1 py-4 text-sm font-semibold transition-colors ${
                  tab === "register"
                    ? "text-emerald-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Create Account
                {tab === "register" && (
                  <span className="absolute inset-x-6 bottom-0 h-0.5 bg-emerald-600 rounded-full" />
                )}
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {infoMsg && (
              <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
                {infoMsg}
              </div>
            )}

            {serverError && (
              <div className="mb-6 rounded-lg bg-rose-50 border border-rose-100 p-4 text-sm text-rose-800">
                {serverError}
              </div>
            )}

            {/* LOGIN */}
            {tab === "login" && (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                <Input
                  label="Phone Number"
                  placeholder="078xxxxxxx or +25078xxxxxxx"
                  {...loginForm.register("phone")}
                  error={loginForm.formState.errors.phone?.message}
                />

                <PasswordField
                  label="Password"
                  placeholder="••••••••"
                  error={loginForm.formState.errors.password?.message}
                  {...loginForm.register("password")}
                />

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl shadow-md transition"
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
                </Button>

                <p className="text-center text-xs text-gray-500 mt-4">
                  Already registered but not activated? Sign in to complete payment.
                </p>
              </form>
            )}

            {/* REGISTER */}
            {tab === "register" && (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-5">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  {...registerForm.register("fullName")}
                  error={registerForm.formState.errors.fullName?.message}
                />

                <Input
                  label="Phone Number"
                  placeholder="078xxxxxxx"
                  hint="Rwanda mobile format"
                  {...registerForm.register("phone")}
                  error={registerForm.formState.errors.phone?.message}
                />

                <Input
                  label="Email (optional)"
                  type="email"
                  placeholder="you@example.com"
                  {...registerForm.register("email")}
                  error={registerForm.formState.errors.email?.message}
                />

                <Select
                  label="Education Level"
                  {...registerForm.register("level")}
                  error={registerForm.formState.errors.level?.message}
                >
                  <option value="L3">Level 3</option>
                  <option value="L4">Level 4</option>
                  <option value="L5">Level 5</option>
                </Select>

                <div className="space-y-2">
                  <PasswordField
                    label="Password"
                    placeholder="Minimum 8 characters"
                    error={registerForm.formState.errors.password?.message}
                    {...registerForm.register("password")}
                  />

                  {pw && (
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strengthColor}`}
                          style={{ width: `${(pwStrength / 4) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        Strength: <span className="font-medium">{strengthLabelText}</span>
                      </p>
                    </div>
                  )}
                </div>

                <PasswordField
                  label="Confirm Password"
                  placeholder="Repeat password"
                  error={registerForm.formState.errors.confirmPassword?.message}
                  {...registerForm.register("confirmPassword")}
                />

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl shadow-md transition"
                  disabled={registerForm.formState.isSubmitting}
                >
                  {registerForm.formState.isSubmitting ? "Creating..." : "Create Account"}
                </Button>

                <p className="text-center text-xs text-gray-500">
                  After signup you&apos;ll be redirected to complete payment.
                </p>
              </form>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          By continuing, you agree to the Autiva Tech policies.
        </p>
      </div>
    </div>
  );
}
