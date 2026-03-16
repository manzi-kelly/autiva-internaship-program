import { useEffect, useState } from "react";
import UsersTable from "../components/UsersTable.jsx";
import { getUsers } from "../lib/api";
import { getAdminSocket } from "../lib/socket";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await getUsers();
        setUsers(
          (res.users || []).map((user) => ({
            ...user,
            email: user.email || "-",
            registrationDate: user.registrationDate
              ? new Date(user.registrationDate).toISOString().slice(0, 10)
              : "-",
            status: user.status === "ACTIVE" ? "Active" : user.status,
          }))
        );
      } catch (err) {
        setError(err.message || "Failed to load users");
      }
    }

    loadUsers();
    const socket = getAdminSocket();
    socket.on("activity:new", loadUsers);
    return () => socket.off("activity:new", loadUsers);
  }, []);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <UsersTable data={users} />
    </div>
  );
}
