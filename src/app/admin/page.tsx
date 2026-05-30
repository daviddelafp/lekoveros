import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const [users, pendingRequests, poolItems] = await Promise.all([
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.wishlistItem.count({ where: { status: "PENDING" } }),
    prisma.wishlistItem.count({ where: { status: "IN_POOL" } }),
  ]);

  const stats = [
    { label: "Compradores", value: users, href: "/admin/usuarios" },
    { label: "Solicitudes pendientes", value: pendingRequests, href: "/admin/solicitudes" },
    { label: "Cartas en pool", value: poolItems, href: "/admin/pool" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="bg-white rounded-xl p-6 shadow-sm border hover:border-red-300 transition"
          >
            <p className="text-3xl font-bold text-red-600">{stat.value}</p>
            <p className="text-gray-500 mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
