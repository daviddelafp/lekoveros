import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

const STATUS_CONFIG = {
  PENDING: { label: "En revisión", color: "bg-yellow-100 text-yellow-800", desc: "El admin está revisando tu pedido" },
  ACCEPTED: { label: "Aceptado", color: "bg-blue-100 text-blue-700", desc: "Pedido aceptado — realiza el pago" },
  PARTIALLY_ACCEPTED: { label: "Parcialmente aceptado", color: "bg-indigo-100 text-indigo-700", desc: "Algunas cartas aceptadas — realiza el pago del total aceptado" },
  REJECTED: { label: "Rechazado", color: "bg-red-100 text-red-700", desc: "Pedido rechazado" },
  PAYMENT_CONFIRMED: { label: "Pago confirmado", color: "bg-purple-100 text-purple-700", desc: "Pago recibido — el admin está buscando tus cartas" },
  COMPLETED: { label: "Completado", color: "bg-green-100 text-green-700", desc: "Todas las cartas enviadas" },
};

export default async function MisPedidosPage() {
  const session = await auth();

  const [orders, user] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session!.user.id },
      include: {
        items: {
          include: {
            card: { select: { name: true, imageUrl: true, setName: true } },
            photos: { orderBy: { uploadedAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { walletBalance: true },
    }),
  ]);

  const walletBalance = Number(user?.walletBalance ?? 0);

  // Compute committed (accepted, not yet purchased)
  const committed = orders.reduce((sum, order) => {
    if (!["ACCEPTED", "PARTIALLY_ACCEPTED", "PAYMENT_CONFIRMED"].includes(order.status)) return sum;
    return sum + order.items
      .filter((i) => i.status === "ACCEPTED")
      .reduce((s, i) => s + Number(i.adminPrice ?? i.userPrice) * i.quantity, 0);
  }, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis pedidos</h1>
        <Link href="/mi-lista" className="text-sm text-red-600 hover:text-red-700 font-medium">
          ← Volver al carrito
        </Link>
      </div>

      {/* Wallet summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Saldo en cartera</p>
          <p className="text-3xl font-bold text-gray-900">¥{walletBalance.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Saldo disponible tras pedidos completados</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Reservado</p>
          <p className="text-3xl font-bold text-purple-700">¥{committed.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Comprometido en pedidos activos</p>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">Aún no tienes pedidos.</p>
          <Link href="/catalogo" className="text-red-600 font-medium hover:underline">
            Ir al catálogo →
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-700", desc: "" };
          const acceptedItems = order.items.filter((i) => i.status === "ACCEPTED" || i.status === "PURCHASED");
          const acceptedTotal = acceptedItems.reduce(
            (s, i) => s + Number(i.adminPrice ?? i.userPrice) * i.quantity, 0
          );
          const purchasedTotal = order.items
            .filter((i) => i.status === "PURCHASED")
            .reduce((s, i) => s + Number(i.finalPrice ?? i.adminPrice ?? i.userPrice) * i.quantity, 0);

          return (
            <details key={order.id} className="bg-white rounded-xl border shadow-sm group">
              <summary className="flex items-center gap-4 p-5 cursor-pointer list-none select-none hover:bg-gray-50 rounded-xl transition">
                {/* Order number */}
                <div className="flex-shrink-0 w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">#{order.orderNumber}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-500">{cfg.desc}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {order.items.length} carta{order.items.length !== 1 ? "s" : ""}
                    {" · "}
                    {new Date(order.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-gray-900">¥{acceptedTotal.toFixed(2)}</p>
                  {order.paidAmount && (
                    <p className="text-xs text-gray-500">Pagado: ¥{Number(order.paidAmount).toFixed(2)}</p>
                  )}
                </div>

                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>

              <div className="border-t px-5 pb-5 pt-4">
                {/* Payment instructions for accepted orders */}
                {(order.status === "ACCEPTED" || order.status === "PARTIALLY_ACCEPTED") && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-800 mb-1">Realiza el pago</p>
                    <p className="text-sm text-blue-700">
                      Total a pagar: <strong>¥{acceptedTotal.toFixed(2)}</strong>
                      {" — "}
                      Una vez realizado, el admin confirmará el pago y empezará la búsqueda de tus cartas.
                    </p>
                  </div>
                )}

                {/* Progress for payment confirmed */}
                {order.status === "PAYMENT_CONFIRMED" && acceptedTotal > 0 && (
                  <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-purple-800">Progreso de compra</span>
                      <span className="text-purple-700">
                        ¥{purchasedTotal.toFixed(2)} / ¥{acceptedTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (purchasedTotal / acceptedTotal) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-3">
                  {order.items.map((item) => {
                    const effectivePrice = Number(item.adminPrice ?? item.userPrice);
                    const itemStatus = {
                      PENDING: { label: "En revisión", color: "text-yellow-700 bg-yellow-50" },
                      ACCEPTED: { label: "Aceptada", color: "text-blue-700 bg-blue-50" },
                      REJECTED: { label: "Rechazada", color: "text-red-700 bg-red-50" },
                      PURCHASED: { label: "Enviada ✓", color: "text-green-700 bg-green-50" },
                    }[item.status] ?? { label: item.status, color: "text-gray-700 bg-gray-50" };

                    return (
                      <div key={item.id} className={`flex gap-3 items-center rounded-lg p-3 ${item.status === "REJECTED" ? "opacity-50" : ""}`}>
                        {item.card.imageUrl ? (
                          <div className="relative w-10 h-14 flex-shrink-0">
                            <Image src={item.card.imageUrl} alt={item.card.name} fill className="object-contain rounded" sizes="40px" />
                          </div>
                        ) : (
                          <div className="w-10 h-14 flex-shrink-0 bg-gray-100 rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.card.name}</p>
                          <p className="text-xs text-gray-500">{item.card.setName}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-gray-900">¥{effectivePrice.toFixed(2)}</p>
                          {item.adminPrice && Number(item.adminPrice) !== Number(item.userPrice) && (
                            <p className="text-xs text-gray-400 line-through">¥{Number(item.userPrice).toFixed(2)}</p>
                          )}
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${itemStatus.color}`}>
                          {itemStatus.label}
                        </span>

                        {/* Purchase photo */}
                        {item.photos[0] && (
                          <div className="relative w-10 h-14 flex-shrink-0">
                            <Image src={item.photos[0].imageUrl} alt="Foto de compra" fill className="object-contain rounded" sizes="40px" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
