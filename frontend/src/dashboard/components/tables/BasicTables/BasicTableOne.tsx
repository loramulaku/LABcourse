import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import { apiFetch, getAccessToken, login } from "../../../../api";

import { useOutletContext } from "react-router-dom";

// Lloji i User
interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "doctor" | "admin";
  created_at: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  gender?: string;
  dob?: string;
  profile_image: string;
}

// Outlet context për searchQuery
interface ContextType {
  searchQuery: string;
}

export default function BasicTableUsers() {
  const { searchQuery } = useOutletContext<ContextType>();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await apiFetch("http://localhost:5000/api/users");
        setUsers(data);
      } catch (err) {
        console.error("Gabim duke marrë users:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  // 🔎 Filtrimi (i lidhur me search global)
  const filteredUsers = users.filter((user) =>
    [user.name, user.email, user.role, user.phone, user.gender]
      .filter(Boolean)
      .some((field) =>
        String(field).toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (loading) return <p className="p-4">Duke u ngarkuar...</p>;

  return (
    <div className="min-h-screen w-full">
      {/* Vetëm tabela, pa AppHeader */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] m-4">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start">Foto</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">Name</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">Email</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">Role</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">Phone</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">Address</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">Gender</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">DOB</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">Created At</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-4 py-3">
                    <img
                      src={`http://localhost:5000/${user.profile_image}`}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3">{user.name}</TableCell>
                  <TableCell className="px-4 py-3">{user.email}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      size="sm"
                      color={
                        user.role === "admin"
                          ? "success"
                          : user.role === "doctor"
                          ? "warning"
                          : "error"
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">{user.phone || "-"}</TableCell>
                  <TableCell className="px-4 py-3">
                    {user.address_line1 || ""} {user.address_line2 || ""}
                  </TableCell>
                  <TableCell className="px-4 py-3">{user.gender || "-"}</TableCell>
                  <TableCell className="px-4 py-3">
                    {user.dob ? new Date(user.dob).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}