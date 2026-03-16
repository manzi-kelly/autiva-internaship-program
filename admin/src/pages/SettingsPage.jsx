import { useEffect, useState } from "react";
import {
  FiUser,
  FiLock,
  FiCreditCard,
  FiSave,
  FiShield,
  FiCheckCircle,
} from "react-icons/fi";
import { getPaymentDestination, updatePaymentDestination } from "../lib/api";

export default function SettingsPage() {
  const [adminName, setAdminName] = useState("Autiva Admin");

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [paymentDestination, setPaymentDestination] = useState({
    receiverName: "",
    receiverNumber: "",
    provider: "BANK",
    note: "Users can pay using any payment method, but all payments must be sent to this number or account.",
  });

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

  useEffect(() => {
    async function loadPaymentDestination() {
      try {
        const res = await getPaymentDestination();
        setPaymentDestination((prev) => ({
          ...prev,
          receiverName: res.destination?.accountName || "",
          receiverNumber: res.destination?.accountNumber || "",
          provider: res.destination?.provider || "BANK",
        }));
      } catch (error) {
        setPaymentMessage(error.message || "Failed to load payment destination.");
      }
    }

    loadPaymentDestination();
  }, []);

  function handlePasswordChange(e) {
    setPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setPasswordMessage("");
  }

  function handlePaymentDestinationChange(e) {
    setPaymentDestination((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setPaymentMessage("");
  }

  function handleSaveProfile(e) {
    e.preventDefault();

    if (!adminName.trim()) {
      setProfileMessage("Admin name is required.");
      return;
    }

    setProfileMessage("Admin profile updated successfully.");
  }

  function handleUpdatePassword(e) {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      setPasswordMessage("Please enter your current password.");
      return;
    }

    if (!passwordData.newPassword) {
      setPasswordMessage("Please enter a new password.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage("New password and confirm password do not match.");
      return;
    }

    setPasswordMessage("Password updated successfully.");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }

  async function handleSavePaymentDestination(e) {
    e.preventDefault();

    if (!paymentDestination.receiverName.trim()) {
      setPaymentMessage("Receiver name is required.");
      return;
    }

    if (!paymentDestination.receiverNumber.trim()) {
      setPaymentMessage("Payment receiving number is required.");
      return;
    }

    try {
      await updatePaymentDestination({
        accountName: paymentDestination.receiverName,
        accountNumber: paymentDestination.receiverNumber,
        provider: paymentDestination.provider,
      });
      setPaymentMessage("Payment receiving number updated successfully.");
    } catch (error) {
      setPaymentMessage(error.message || "Failed to update payment destination.");
    }
  }

  return (
    <div className="min-h-full bg-slate-100">
      <div className="space-y-6 p-6 lg:p-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-700 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-200">
                Admin Settings
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Manage system preferences
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">
                Update your profile, secure your admin account, and manage the
                payment destination used by trainees.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:w-fit">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs text-slate-200">Profile</p>
                <p className="mt-1 font-semibold">Active</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs text-slate-200">Security</p>
                <p className="mt-1 font-semibold">Protected</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <FiUser className="text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Admin Profile
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the display name shown in the admin panel.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Admin Name
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => {
                  setAdminName(e.target.value);
                  setProfileMessage("");
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                placeholder="Enter admin name"
              />
            </div>

            {profileMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <FiCheckCircle />
                <span>{profileMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <FiSave />
              Save Profile
            </button>
          </form>

          <form
            onSubmit={handleUpdatePassword}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <FiLock className="text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Change Password
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Make sure your admin account stays secure.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {passwordMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <FiShield />
                <span>{passwordMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <FiSave />
              Update Password
            </button>
          </form>
        </div>

        <form
          onSubmit={handleSavePaymentDestination}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <FiCreditCard className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Payment Destination
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Set the account, phone number, or wallet where all user payments
                should be sent.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Receiver Name
              </label>
              <input
                type="text"
                name="receiverName"
                value={paymentDestination.receiverName}
                onChange={handlePaymentDestinationChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                placeholder="Enter receiver name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Receiving Number / Account
              </label>
              <input
                type="text"
                name="receiverNumber"
                value={paymentDestination.receiverNumber}
                onChange={handlePaymentDestinationChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                placeholder="Enter payment receiving number"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Provider
              </label>
              <select
                name="provider"
                value={paymentDestination.provider}
                onChange={handlePaymentDestinationChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              >
                <option value="BANK">Bank</option>
                <option value="MTN">MTN</option>
                <option value="AIRTEL">Airtel</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Admin Note
              </label>
              <textarea
                name="note"
                value={paymentDestination.note}
                onChange={handlePaymentDestinationChange}
                rows="4"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                placeholder="Write a short payment note"
              />
            </div>
          </div>

          {paymentMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <FiCheckCircle />
              <span>{paymentMessage}</span>
            </div>
          )}

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Current Payment Destination
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  This is what trainees will use as the destination for payment.
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Active
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Receiver Name
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {paymentDestination.receiverName}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Receiving Number
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {paymentDestination.receiverNumber}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Provider
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {paymentDestination.provider}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm md:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Note
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {paymentDestination.note}
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <FiSave />
            Save Payment Destination
          </button>
        </form>
      </div>
    </div>
  );
}
