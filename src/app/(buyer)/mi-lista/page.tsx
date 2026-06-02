import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WishlistView from "@/components/WishlistView";
import Link from "next/link";

export default async function MiListaPage() {
  const session = await auth();

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session!.user.id },
    include: { card: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi carrito</h1>
        <Link
          href="/mis-pedidos"
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Ver mis pedidos →
        </Link>
      </div>
      <WishlistView items={items} />
    </div>
  );
}
