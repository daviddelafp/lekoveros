import { prisma } from "@/lib/prisma";
import AdminCatalog from "@/components/admin/AdminCatalog";

export default async function AdminCatalogoPage() {
  const cards = await prisma.card.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      setName: true,
      rarity: true,
      price: true,
      active: true,
      imageUrl: true,
      externalId: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Catálogo de Cartas</h1>
      <AdminCatalog cards={cards} />
    </div>
  );
}
