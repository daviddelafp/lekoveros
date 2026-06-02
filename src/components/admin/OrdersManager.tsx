"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  PENDING: { label: "En revisión", dot: "bg-yellow-400" },
  ACCEPTED: { label: "Aceptado — pdte. pago", dot: "bg-blue-400" },
  PARTIALLY_ACCEPTED: { label: "Parcial — pdte. pago", dot: "bg-indigo-400" },
  REJECTED: { label: "Rechazado", dot: "bg-red-400" },
  PAYMENT_CONFIRMED: { label: "Pago confirmado", dot: "bg-purple-400" },
  COMPLETED: { label: "Completado", dot: "bg-green-400" },
};

interface Order {
  id: string;
  orderNumber: number;
  status: string;
  createdAt: string | Date;
  paidAmount: { toNumber?(): number } | number | null;
  user: { id: string; name: string; email: string };
  items: {
    id: string;
    quantity: number;
    status: string;
    userPrice: { toNumber?(): number } | number;
    adminPrice: { toNumber?(): number } | number | null;
  }[];
}

function toNum(v: { toNumber?: () => number } | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "object" && typeof v.toNumber === "function") return v.toNumber();
  return Number(v);
}

export default function OrdersManager({ orders, filter }: { orders: Order[]; filter: string }) {
  const router = useRouter();

  const filtered = filter === "all"
    ? orders
    : filter === "active"
    ? orders.filter((o) => !["REJECTED", "COMPLETED"].includes(o.status))
    : orders.filter((o) => ["REJECTED", "COMPLETED"].includes(o.status));

  function changeFilter(f: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("filter", f);
    router.push(url.pathname + url.search);
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {[
          { key: "active", label: "Activos" },
          { key: "history", label: "Historial" },
          { key: "all", label: "Todos" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => changeFilter(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              filter === tab.key
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-12">Sin pedidos en esta vista.</p>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Pedido</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Cliente</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Cartas</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((order) => {
                const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, dot: "bg-gray-400" };
                const total = order.items.reduce(
                  (s, i) => s + toNum(i.adminPrice ?? i.userPrice) * i.quantity,
                  0
                );
                const pendingCount = order.items.filter((i) => i.status === "PENDING").length;

                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4">
                      <span className="font-bold text-red-600 text-base">#{order.orderNumber}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{order.user.name}</p>
                      <p className="text-xs text-gray-500">{order.user.email}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-medium text-gray-900">{order.items.length}</span>
                      {pendingCount > 0 && (
                        <span className="text-xs text-yellow-600 block">{pendingCount} sin revisar</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900">
                      ¥{total.toFixed(2)}
                      {order.paidAmount && (
                        <p className="text-xs text-green-600 font-normal">
                          Pagado: ¥{toNum(order.paidAmount).toFixed(2)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        <span className="text-gray-700">{cfg.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/solicitudes/${order.id}`}
                        className="text-red-600 hover:text-red-700 font-medium text-xs"
                      >
                        Ver detalles →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
