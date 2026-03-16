const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || "";

export { API_BASE_URL };

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
}

export async function getPaymentDestination() {
  const response = await fetch(`${API_BASE_URL}/settings/payment`);
  return parseResponse(response);
}

export async function getDashboardOverview() {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard/overview`, {
    headers: {
      "x-admin-key": ADMIN_API_KEY,
    },
  });
  return parseResponse(response);
}

export async function updatePaymentDestination(payload) {
  const response = await fetch(`${API_BASE_URL}/settings/payment`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function getPracticalRequests(status = "PENDING") {
  const response = await fetch(
    `${API_BASE_URL}/admin/requests/practical?status=${encodeURIComponent(status)}`,
    {
      headers: {
        "x-admin-key": ADMIN_API_KEY,
      },
    }
  );
  return parseResponse(response);
}

export async function updatePracticalRequestStatus(requestId, status) {
  const response = await fetch(`${API_BASE_URL}/admin/requests/practical/${requestId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_API_KEY,
    },
    body: JSON.stringify({ status }),
  });
  return parseResponse(response);
}

export async function getPracticalTasks() {
  const response = await fetch(`${API_BASE_URL}/admin/practical-tasks`, {
    headers: {
      "x-admin-key": ADMIN_API_KEY,
    },
  });
  return parseResponse(response);
}

export async function createPracticalTask(payload) {
  const response = await fetch(`${API_BASE_URL}/admin/practical-tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function reviewPracticalTask(taskId, payload) {
  const response = await fetch(`${API_BASE_URL}/admin/practical-tasks/${taskId}/review`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function reviewPracticalSubmission(taskId, payload) {
  const response = await fetch(`${API_BASE_URL}/admin/practical-tasks/${taskId}/submission`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function reviewMissedTaskExplanation(taskId, payload) {
  const response = await fetch(`${API_BASE_URL}/admin/practical-tasks/${taskId}/explanation`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function reopenFailedTask(taskId, payload) {
  const response = await fetch(`${API_BASE_URL}/admin/practical-tasks/${taskId}/reopen`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_API_KEY,
    },
    body: JSON.stringify(payload || {}),
  });
  return parseResponse(response);
}

export async function deleteFailedTask(taskId) {
  const response = await fetch(`${API_BASE_URL}/admin/practical-tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      "x-admin-key": ADMIN_API_KEY,
    },
  });
  return parseResponse(response);
}

export async function getUsers() {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    headers: {
      "x-admin-key": ADMIN_API_KEY,
    },
  });
  return parseResponse(response);
}

export async function getPayments(status = "") {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetch(`${API_BASE_URL}/admin/payments${query}`, {
    headers: {
      "x-admin-key": ADMIN_API_KEY,
    },
  });
  return parseResponse(response);
}

export async function updatePaymentStatus(paymentId, payload) {
  const response = await fetch(`${API_BASE_URL}/admin/payments/${paymentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function getCertificateRequests(status = "") {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetch(`${API_BASE_URL}/admin/certificate-requests${query}`, {
    headers: {
      "x-admin-key": ADMIN_API_KEY,
    },
  });
  return parseResponse(response);
}

export async function updateCertificateRequest(requestId, payload) {
  const response = await fetch(`${API_BASE_URL}/admin/certificate-requests/${requestId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function revokeCertificate(certificateId, payload = {}) {
  const response = await fetch(`${API_BASE_URL}/admin/certificates/${certificateId}/revoke`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function regenerateCertificate(certificateId) {
  const response = await fetch(`${API_BASE_URL}/admin/certificates/${certificateId}/regenerate`, {
    method: "POST",
    headers: {
      "x-admin-key": ADMIN_API_KEY,
    },
  });
  return parseResponse(response);
}

export async function getCertificateVerificationHistory(certificateId) {
  const response = await fetch(`${API_BASE_URL}/admin/certificates/${certificateId}/history`, {
    headers: {
      "x-admin-key": ADMIN_API_KEY,
    },
  });
  return parseResponse(response);
}
