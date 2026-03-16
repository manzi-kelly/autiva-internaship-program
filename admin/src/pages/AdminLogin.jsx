import { useState } from "react";
import { FiLock, FiMail } from "react-icons/fi";
import { loginAdmin } from "../utils/auth";

export default function AdminLogin({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();

    const result = loginAdmin(formData.email, formData.password);

    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50 to-slate-200 px-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-lg lg:grid-cols-2">
        <div className="hidden bg-slate-950 p-10 text-white lg:block">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-2xl font-bold">
                A
              </div>
              <h1 className="text-4xl font-bold leading-tight">
                Autiva Tech Internship Admin Panel
              </h1>
              <p className="mt-4 max-w-md text-slate-300">
                Secure admin access for payments, registered users, internship
                sessions, and practical requests.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              <p className="font-semibold text-white">Mock Login</p>
              <p className="mt-2">Email: admin@autiva.com</p>
              <p>Password: admin123</p>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-12">
          <div className="mx-auto max-w-md">
            <h2 className="text-3xl font-bold text-slate-900">Admin Login</h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to access the Autiva Tech internship dashboard.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <FiMail className="text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@autiva.com"
                    className="w-full border-none bg-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <FiLock className="text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="w-full border-none bg-transparent outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
              >
                Login to Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}