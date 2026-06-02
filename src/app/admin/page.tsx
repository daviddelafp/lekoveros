import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const [buyers, pendingOrders, paymentConfirmedOrders, pendingPurchases] = await Promise.all([
    prisma.user.count({ where: { role: "BUYER", active: true } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: { in: ["ACCEPTED", "PARTIALLY_ACCEPTED"] } } }),
    prisma.orderItem.count({
      where: { status: "ACCEPTED", order: { status: "PAYMENT_CONFIRMED" } },
    }),
  ]);

  const stats = [
    { label: "Compradores activos", value: buyers, href: "/admin/usuarios", color: "text-gray-900" },
    { label: "Pedidos en revisión", value: pendingOrders, href: "/admin/solicitudes", color: "text-yellow-600" },
    { label: "Pendientes de pago", value: paymentConfirmedOrders, href: "/admin/solicitudes?filter=active", color: "text-blue-600" },
    { label: "Cartas para comprar", value: pendingPurchases, href: "/admin/pool", color: "text-red-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="bg-white rounded-xl p-6 shadow-sm border hover:border-red-300 hover:shadow-md transition"
          >
            <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-gray-600 mt-2 text-sm">{stat.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
