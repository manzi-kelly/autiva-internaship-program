import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "../store/auth";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { api } from "../lib/apiClient";

type PaymentMethod = "MTN" | "AIRTEL" | "CARD";
type Gender = "male" | "female" | "other";

const RW_PHONE = /^(\+250|250)?7\d{8}$/;

const schema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    phone: z.string().regex(RW_PHONE, "Use Rwanda format: 078xxxxxxx or +25078xxxxxxx"),
    gender: z.enum(["male", "female", "other"]),
    method: z.enum(["MTN", "AIRTEL", "CARD"]),

    momoNumber: z.string().optional(),
    airtelNumber: z.string().optional(),

    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvv: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.method === "MTN") {
      if (!val.momoNumber || !RW_PHONE.test(val.momoNumber)) {
        ctx.addIssue({ code: "custom", path: ["momoNumber"], message: "Enter a valid MTN number" });
      }
    }
    if (val.method === "AIRTEL") {
      if (!val.airtelNumber || !RW_PHONE.test(val.airtelNumber)) {
        ctx.addIssue({ code: "custom", path: ["airtelNumber"], message: "Enter a valid Airtel number" });
      }
    }
    if (val.method === "CARD") {
      const digits = (val.cardNumber || "").replace(/\s/g, "");
      if (!digits || digits.length < 12) {
        ctx.addIssue({ code: "custom", path: ["cardNumber"], message: "Enter a valid card number" });
      }
      if (!val.cardExpiry || val.cardExpiry.length < 4) {
        ctx.addIssue({ code: "custom", path: ["cardExpiry"], message: "Use MM/YY" });
      }
      if (!val.cardCvv || val.cardCvv.length < 3) {
        ctx.addIssue({ code: "custom", path: ["cardCvv"], message: "CVV is required" });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

function amountByLevel(level?: string) {
  if (level === "L3") return 180000;
  if (level === "L4") return 220000;
  if (level === "L5") return 280000;
  return 180000;
}

function MethodCard({
  active,
  title,
  subtitle,
  badge,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  badge: { text: string; className: string };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left rounded-2xl border p-4 transition",
        active ? "border-blue-500 ring-2 ring-blue-100 bg-white" : "border-slate-200 bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${badge.className}`}>
          {badge.text}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="h-4 w-4 rounded-full border border-slate-300 grid place-items-center">
              {active ? <div className="h-2 w-2 rounded-full bg-blue-600" /> : null}
            </div>
          </div>
          <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

export default function Payment() {
  const navigate = useNavigate();
  const { user, tokens, setAuth, clearAuth } = useAuth();
  const [serverMessage, setServerMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [destination, setDestination] = useState<{
    accountNumber: string;
    accountName: string;
    provider: string;
  } | null>(null);

  const amount = useMemo(() => amountByLevel(user?.level), [user?.level]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      gender: "male",
      method: "MTN",
      momoNumber: user?.phone || "",
      airtelNumber: "",
      cardNumber: "",
      cardExpiry: "",
      cardCvv: "",
    },
  });

  const method = form.watch("method");

  useEffect(() => {
    async function loadPaymentDestination() {
      try {
        const res = await api.get<{
          destination: { accountNumber: string; accountName: string; provider: string };
        }>("/settings/payment");
        setDestination(res.data.destination);
      } catch (error: any) {
        setServerError(error?.response?.data?.message || "Failed to load payment destination");
      }
    }

    loadPaymentDestination();
  }, []);

  useEffect(() => {
    if (!user || !tokens) return undefined;

    let cancelled = false;

    async function checkPaymentStatus() {
      try {
        const res = await api.get<{
          payment: { status?: string } | null;
        }>("/payments/status", {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (cancelled) return;

        if (res.data.payment?.status === "APPROVED" || res.data.payment?.status === "CONFIRMED") {
          setAuth({
            user: { ...user, status: "ACTIVE" },
            tokens,
          });
          navigate("/dashboard", { replace: true });
        }
      } catch {
        // Ignore polling errors; the next interval will retry.
      }
    }

    checkPaymentStatus();
    const interval = window.setInterval(checkPaymentStatus, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user, tokens, setAuth, navigate]);

  async function onSubmit(values: FormValues) {
    setServerError("");
    setServerMessage("");

    if (!user || !tokens) return;

    try {
      const res = await api.post<{ message?: string }>(
        "/payments/proof",
        {
          payerName: values.fullName,
          payerPhone:
            values.method === "MTN"
              ? values.momoNumber || values.phone
              : values.method === "AIRTEL"
                ? values.airtelNumber || values.phone
                : values.phone,
          method: values.method,
          amount,
          referenceCode: `AUTIVA-${Date.now()}`,
        },
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      setAuth({
        user: { ...user, status: "PENDING_PAYMENT" },
        tokens,
      });

      setServerMessage(res.data?.message || "Payment submitted successfully. Please wait for admin approval.");
    } catch (error: any) {
      setServerError(error?.response?.data?.message || "Payment submission failed");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              clearAuth();
              navigate("/", { replace: true });
            }}
          >
            Logout
          </Button>
        </div>
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-slate-900">Complete Payment</h1>
              <p className="text-sm text-slate-600">Enter your details to complete the transaction</p>
            </div>
          </CardHeader>

          <CardBody>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              {destination ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-sm font-semibold text-emerald-900">Pay to this account</div>
                  <div className="mt-1 text-sm text-emerald-800">
                    {destination.accountName || "Autiva Tech"} ({destination.provider})
                  </div>
                  <div className="text-sm font-bold text-emerald-900">{destination.accountNumber}</div>
                </div>
              ) : null}

              {serverError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {serverError}
                </div>
              ) : null}

              {serverMessage ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {serverMessage}
                </div>
              ) : null}

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">Personal Information</h2>

                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  {...form.register("fullName")}
                  error={form.formState.errors.fullName?.message}
                />

                <Input
                  label="Phone Number"
                  placeholder="078 XXX XXXX or +25078 XXX XXXX"
                  {...form.register("phone")}
                  error={form.formState.errors.phone?.message}
                />

                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-800">Gender</div>
                  <div className="flex items-center gap-5 text-sm text-slate-700">
                    {(["male", "female", "other"] as Gender[]).map((g) => (
                      <label key={g} className="flex items-center gap-2">
                        <input type="radio" value={g} {...form.register("gender")} className="h-4 w-4" />
                        <span className="capitalize">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">Payment Method</h2>

                <div className="space-y-3">
                  <MethodCard
                    active={method === "MTN"}
                    title="MTN Mobile Money"
                    subtitle="Pay with your MTN account"
                    badge={{ text: "M", className: "bg-yellow-300 text-slate-900" }}
                    onClick={() => form.setValue("method", "MTN")}
                  />

                  <MethodCard
                    active={method === "AIRTEL"}
                    title="Airtel Money"
                    subtitle="Pay with your Airtel account"
                    badge={{ text: "A", className: "bg-red-500 text-white" }}
                    onClick={() => form.setValue("method", "AIRTEL")}
                  />

                  <MethodCard
                    active={method === "CARD"}
                    title="Credit/Debit Card"
                    subtitle="Pay with Visa or Mastercard"
                    badge={{ text: "$", className: "bg-blue-600 text-white" }}
                    onClick={() => form.setValue("method", "CARD")}
                  />
                </div>

                {(method === "MTN" || method === "AIRTEL") && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 space-y-3">
                    <div className="text-sm font-semibold text-slate-900">
                      {method === "MTN" ? "MTN Mobile Money Payment" : "Airtel Money Payment"}
                    </div>

                    {method === "MTN" ? (
                      <Input
                        label="MTN Payment Number"
                        placeholder="078 XXX XXXX"
                        {...form.register("momoNumber")}
                        error={form.formState.errors.momoNumber?.message}
                      />
                    ) : (
                      <Input
                        label="Airtel Payment Number"
                        placeholder="078 XXX XXXX"
                        {...form.register("airtelNumber")}
                        error={form.formState.errors.airtelNumber?.message}
                      />
                    )}
                  </div>
                )}

                {method === "CARD" && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 space-y-3">
                    <div className="text-sm font-semibold text-slate-900">Card Payment</div>

                    <Input
                      label="Card Number"
                      placeholder="1234 5678 9012 3456"
                      {...form.register("cardNumber")}
                      error={form.formState.errors.cardNumber?.message}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Expiry (MM/YY)"
                        placeholder="MM/YY"
                        {...form.register("cardExpiry")}
                        error={form.formState.errors.cardExpiry?.message}
                      />
                      <Input
                        label="CVV"
                        placeholder="123"
                        {...form.register("cardCvv")}
                        error={form.formState.errors.cardCvv?.message}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" className="w-1/3" onClick={() => navigate("/auth")}>
                  Back
                </Button>

                <Button type="submit" className="w-2/3 bg-blue-600 hover:bg-blue-700" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Processing..." : `Pay ${amount.toLocaleString()} RWF`}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
