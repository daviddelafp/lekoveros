import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WishlistView from "@/components/WishlistView";

export default async function MiListaPage() {
  const session = await auth();

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session!.user.id },
    include: {
      card: true,
      photos: { orderBy: { uploadedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mi Lista de Cartas</h1>
      <WishlistView items={items} />
    </div>
  );
}
