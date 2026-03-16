import { api } from "../../lib/apiClient";
import type { PaymentProof, PaymentMethod } from "../../types";

export async function uploadPaymentProof(input: {
  method: PaymentMethod;
  amount: number;
  referenceCode: string;
  file: File;
}) {
  const fd = new FormData();
  fd.append("method", input.method);
  fd.append("amount", String(input.amount));
  fd.append("referenceCode", input.referenceCode);
  fd.append("proof", input.file);

  const res = await api.post<{ payment: PaymentProof }>("/payments/proof", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.payment;
}

export async function getMyPaymentStatus() {
  const res = await api.get<{ payment: PaymentProof | null }>("/payments/status");
  return res.data.payment;
}