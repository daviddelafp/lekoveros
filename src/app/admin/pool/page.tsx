import { prisma } from "@/lib/prisma";
import PoolManager from "@/components/admin/PoolManager";

export default async function PoolPage() {
  const poolItems = await prisma.wishlistItem.findMany({
    where: { status: "IN_POOL" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      card: true,
    },
    orderBy: [{ cardId: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pool de Compra</h1>
      <PoolManager items={poolItems} />
    </div>
  );
}
