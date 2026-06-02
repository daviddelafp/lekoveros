"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
  walletBalance: { toNumber?: () => number } | number;
  createdAt: Date;
}

function toNum(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "object" && typeof v.toNumber === "function") return v.toNumber();
  return Number(v);
}

export default function UserManager({ users }: { users: User[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "BUYER" });

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
    } else {
      setForm({ name: "", email: "", password: "", role: "BUYER" });
      setShowForm(false);
      router.refresh();
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition"
        >
          {showForm ? "Cancelar" : "+ Nuevo comprador"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createUser} className="bg-white rounded-xl border p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Crear nuevo comprador</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Nombre", key: "name" as const, type: "text" },
              { label: "Email", key: "email" as const, type: "email" },
              { label: "Contraseña temporal", key: "password" as const, type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  required
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rol</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="BUYER">Comprador</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
          >
            {loading ? "Creando…" : "Crear comprador"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-800">Nombre</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-800">Email</th>
              <th className="text-right px-5 py-3.5 font-semibold text-gray-800">Saldo</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-800">Estado</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-800">Alta</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-4 font-semibold text-gray-900">{user.name}</td>
                <td className="px-5 py-4 text-gray-700">{user.email}</td>
                <td className="px-5 py-4 text-right font-semibold text-gray-900">
                  ¥{toNum(user.walletBalance).toFixed(2)}
                </td>
                <td className="px-5 py-4 text-center">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                    user.active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {user.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString("es-ES", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => toggleActive(user.id, user.active)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                      user.active
                        ? "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {user.active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-500 font-medium">
                  No hay compradores aún
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
