import { useEffect, useState } from "react";
import {
  getCertificateRequests,
  getCertificateVerificationHistory,
  regenerateCertificate,
  revokeCertificate,
  updateCertificateRequest,
} from "../lib/api";
import { getAdminSocket } from "../lib/socket";
import CertificatePreview from "../components/CertificatePreview";

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export default function CertificateRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function loadRequests() {
      try {
        setError("");
        const res = await getCertificateRequests();
        const nextRequests = res.requests || [];
        setRequests(nextRequests);
        setSelectedRequestId((current) => current || nextRequests[0]?.id || "");
      } catch (err) {
        setError(err.message || "Failed to load certificate requests");
      }
    }

    loadRequests();
    const socket = getAdminSocket();
    socket.on("activity:new", loadRequests);
    return () => socket.off("activity:new", loadRequests);
  }, []);

  async function handleDecision(requestId, status) {
    try {
      const adminNote = (notes[requestId] || "").trim();
      await updateCertificateRequest(requestId, { status, adminNote });
      setRequests((prev) =>
        prev.map((item) =>
          item.id === requestId
            ? {
                ...item,
                status,
                adminNote,
                reviewedAt: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (err) {
      setError(err.message || "Failed to update certificate request");
    }
  }

  const selectedRequest =
    requests.find((item) => item.id === selectedRequestId) || requests[0] || null;

  useEffect(() => {
    async function loadHistory() {
      if (!selectedRequest?.certificate?.certificateId) {
        setHistory([]);
        return;
      }

      try {
        const res = await getCertificateVerificationHistory(selectedRequest.certificate.certificateId);
        setHistory(res.history || []);
      } catch {
        setHistory([]);
      }
    }

    loadHistory();
  }, [selectedRequest?.certificate?.certificateId]);

  async function handleRevoke(certificateId) {
    try {
      const adminNote = (notes[selectedRequestId] || "").trim();
      await revokeCertificate(certificateId, { adminNote });
      setRequests((prev) =>
        prev.map((item) =>
          item.certificate?.certificateId === certificateId
            ? {
                ...item,
                status: "APPROVED",
                certificate: {
                  ...item.certificate,
                  status: "REVOKED",
                },
              }
            : item
        )
      );
    } catch (err) {
      setError(err.message || "Failed to revoke certificate");
    }
  }

  async function handleRegenerate(certificateId) {
    try {
      await regenerateCertificate(certificateId);
      setRequests((prev) =>
        prev.map((item) =>
          item.certificate?.certificateId === certificateId
            ? {
                ...item,
                certificate: {
                  ...item.certificate,
                  status: "VALID",
                },
              }
            : item
        )
      );
    } catch (err) {
      setError(err.message || "Failed to regenerate certificate");
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {selectedRequest ? (
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">Certificate Preview</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review the certificate image before accepting the request.
            </p>
          </div>

          <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.4fr)_320px]">
            <CertificatePreview
              fullName={selectedRequest.fullName}
              level={selectedRequest.level}
              issueDate={selectedRequest.reviewedAt || selectedRequest.requestedAt}
            />

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Student
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedRequest.fullName}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Level
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedRequest.level}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Final score
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedRequest.finalScore}%
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Progress
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedRequest.progressPercent}%
                </div>
              </div>
              {selectedRequest.certificate ? (
                <>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Certificate Status
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedRequest.certificate.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Verification Count
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedRequest.certificate.verificationCount}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
          {selectedRequest.certificate ? (
            <div className="border-t border-slate-100 px-6 pb-6">
              <div className="flex flex-wrap gap-3 pt-6">
                <a
                  href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}${selectedRequest.certificate.viewUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  View Certificate
                </a>
                <a
                  href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}${selectedRequest.certificate.verifyUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Open Verification
                </a>
                <button
                  onClick={() => handleRegenerate(selectedRequest.certificate.certificateId)}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Regenerate
                </button>
                <button
                  onClick={() => handleRevoke(selectedRequest.certificate.certificateId)}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Revoke
                </button>
              </div>

              <div className="mt-6">
                <div className="text-sm font-semibold text-slate-900">Verification History</div>
                <div className="mt-3 space-y-2">
                  {history.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      No verification history yet.
                    </div>
                  ) : (
                    history.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      >
                        <div className="font-semibold text-slate-900">{item.status}</div>
                        <div className="mt-1 text-slate-500">
                          {item.verifiedAt ? new Date(item.verifiedAt).toISOString().slice(0, 19).replace("T", " ") : "-"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Certificate Requests</h2>
          <p className="mt-1 text-sm text-slate-500">
            Approve certificates only after the student completes all required tasks for the level.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Requested</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Admin Note</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-slate-500">
                    No certificate requests available.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="border-t border-slate-100 align-top">
                    <td className="px-6 py-4 font-semibold text-slate-900">{request.fullName}</td>
                    <td className="px-6 py-4">{request.level}</td>
                    <td className="px-6 py-4">{request.finalScore}%</td>
                    <td className="px-6 py-4">{request.progressPercent}%</td>
                    <td className="px-6 py-4">
                      {request.requestedAt ? new Date(request.requestedAt).toISOString().slice(0, 10) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[request.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <textarea
                        rows="3"
                        value={notes[request.id] ?? request.adminNote ?? ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [request.id]: e.target.value }))
                        }
                        placeholder="Add admin note or rejection reason..."
                        className="w-64 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {request.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedRequestId(request.id)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => handleDecision(request.id, "APPROVED")}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                          >
                            Accept Certificate
                          </button>
                          <button
                            onClick={() => handleDecision(request.id, "REJECTED")}
                            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 text-xs text-slate-500">
                          <button
                            onClick={() => setSelectedRequestId(request.id)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700"
                          >
                            Preview
                          </button>
                          <div>
                          Reviewed {request.reviewedAt ? new Date(request.reviewedAt).toISOString().slice(0, 10) : ""}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
