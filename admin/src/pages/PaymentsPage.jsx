import { useEffect, useState } from "react";
import PaymentsTable from "../components/PaymentsTable.jsx";
import { getPayments, updatePaymentStatus } from "../lib/api";
import { getAdminSocket } from "../lib/socket";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [reviewNotes, setReviewNotes] = useState({});

  useEffect(() => {
    async function loadPayments() {
      try {
        const res = await getPayments();
        setPayments(res.payments || []);
      } catch (err) {
        setError(err.message || "Failed to load payments.");
      }
    }

    loadPayments();
    const socket = getAdminSocket();
    socket.on("activity:new", loadPayments);
    return () => socket.off("activity:new", loadPayments);
  }, []);

  async function handleReviewPayment(paymentId, status) {
    try {
      await updatePaymentStatus(paymentId, {
        status,
        adminNote: reviewNotes[paymentId] || "",
      });
      const res = await getPayments();
      setPayments(res.payments || []);
    } catch (err) {
      setError(err.message || "Failed to update payment.");
    }
  }

  const tableRows = payments.map((item) => ({
    id: item.id,
    userName: item.user?.fullName || item.payerName || "-",
    userPhone: item.user?.phone || item.payerPhone || "-",
    amount: Number(item.amount || 0),
    method: item.method,
    receivedAccount: item.destinationAccountNumber || "-",
    receivedName: item.destinationAccountName || "-",
    receivedProvider: item.destinationProvider || "-",
    date: item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : "-",
    status: item.status,
    adminNote: item.adminNote || "",
  }));

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <PaymentsTable
        data={tableRows}
        reviewNotes={reviewNotes}
        onReviewNoteChange={(id, value) => setReviewNotes((prev) => ({ ...prev, [id]: value }))}
        onReviewPayment={handleReviewPayment}
      />
    </div>
  );
}
