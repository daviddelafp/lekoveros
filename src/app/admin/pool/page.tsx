import { prisma } from "@/lib/prisma";
import PoolManager from "@/components/admin/PoolManager";

export default async function ComprasPendientesPage() {
  // Show all ACCEPTED OrderItems across orders that have confirmed payment
  const orderItems = await prisma.orderItem.findMany({
    where: {
      status: "ACCEPTED",
      order: { status: "PAYMENT_CONFIRMED" },
    },
    include: {
      card: true,
      order: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: [{ card: { name: "asc" } }, { createdAt: "asc" }],
  });

  const items = orderItems.map((oi) => ({
    id: oi.id,
    quantity: oi.quantity,
    orderId: oi.orderId,
    orderNumber: oi.order.orderNumber,
    userPrice: oi.userPrice,
    adminPrice: oi.adminPrice,
    card: oi.card,
    user: oi.order.user,
  }));

  const total = items.reduce(
    (s, i) =>
      s + Number(i.adminPrice ?? i.userPrice) * i.quantity,
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras pendientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cartas de pedidos con pago confirmado · Total: ¥{total.toFixed(2)}
          </p>
        </div>
      </div>
      <PoolManager items={items as never} />
    </div>
  );
}
