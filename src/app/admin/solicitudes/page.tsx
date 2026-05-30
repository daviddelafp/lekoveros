import { prisma } from "@/lib/prisma";
import RequestsManager from "@/components/admin/RequestsManager";

export default async function SolicitudesPage() {
  const requests = await prisma.wishlistItem.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      card: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Solicitudes de Compra</h1>
      <RequestsManager requests={requests} />
    </div>
  );
}
