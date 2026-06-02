import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import OrderDetail from "@/components/admin/OrderDetail";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, walletBalance: true } },
      items: {
        include: {
          card: true,
          photos: { orderBy: { uploadedAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/solicitudes"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Volver a pedidos
        </Link>
      </div>
      <OrderDetail order={order as never} />
    </div>
  );
}
