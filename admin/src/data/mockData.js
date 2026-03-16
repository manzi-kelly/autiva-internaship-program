export const sessionTrend = [
  { session: "Session 1", interns: 28 },
  { session: "Session 2", interns: 42 },
  { session: "Session 3", interns: 37 },
  { session: "Session 4", interns: 56 },
  { session: "Session 5", interns: 68 },
];

export const users = [
  {
    id: 1,
    fullName: "Manzi Kelly",
    email: "manzi@example.com",
    phone: "+250788111111",
    level: "L3",
    registrationDate: "2026-03-01",
    status: "Active",
  },
  {
    id: 2,
    fullName: "Aline Uwase",
    email: "aline@example.com",
    phone: "+250788222222",
    level: "L4",
    registrationDate: "2026-03-02",
    status: "Pending",
  },
  {
    id: 3,
    fullName: "Jean Claude",
    email: "jean@example.com",
    phone: "+250788333333",
    level: "L5",
    registrationDate: "2026-03-03",
    status: "Active",
  },
  {
    id: 4,
    fullName: "Divine Iradukunda",
    email: "divine@example.com",
    phone: "+250788444444",
    level: "L4",
    registrationDate: "2026-03-04",
    status: "Pending",
  },
];

export const payments = [
  {
    id: 1,
    userName: "Manzi Kelly",
    amount: 25000,
    method: "MTN MoMo",
    date: "2026-03-01",
    status: "Confirmed",
  },
  {
    id: 2,
    userName: "Aline Uwase",
    amount: 25000,
    method: "Airtel Money",
    date: "2026-03-02",
    status: "Pending",
  },
  {
    id: 3,
    userName: "Jean Claude",
    amount: 30000,
    method: "Bank",
    date: "2026-03-03",
    status: "Confirmed",
  },
  {
    id: 4,
    userName: "Divine Iradukunda",
    amount: 25000,
    method: "MTN MoMo",
    date: "2026-03-04",
    status: "Confirmed",
  },
];

export const practicalRequests = [
  {
    id: 1,
    userName: "Aline Uwase",
    requestDate: "2026-03-05",
    status: "Waiting",
    notes: "Ready to begin practical work.",
  },
  {
    id: 2,
    userName: "Jean Claude",
    requestDate: "2026-03-06",
    status: "Approved",
    notes: "Has completed required lessons.",
  },
  {
    id: 3,
    userName: "Divine Iradukunda",
    requestDate: "2026-03-07",
    status: "Waiting",
    notes: "Submitted request and waiting for review.",
  },
];

export const totalUsers = users.length;

export const totalMoney = payments.reduce((sum, item) => {
  if (item.status === "Confirmed") return sum + item.amount;
  return sum;
}, 0);

export const confirmedPayments = payments.filter(
  (item) => item.status === "Confirmed"
).length;