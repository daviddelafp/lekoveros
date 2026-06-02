import { prisma } from "@/lib/prisma";
import OrdersManager from "@/components/admin/OrdersManager";

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "active" } = await searchParams;

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        select: {
          id: true,
          quantity: true,
          status: true,
          userPrice: true,
          adminPrice: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-sm text-gray-500">{orders.length} pedido{orders.length !== 1 ? "s" : ""} en total</p>
      </div>
      <OrdersManager orders={orders as never} filter={filter} />
    </div>
  );
}
