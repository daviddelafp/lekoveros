import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BuyerNav from "@/components/BuyerNav";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { walletBalance: true },
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <BuyerNav
        userName={session.user?.name ?? ""}
        walletBalance={Number(user?.walletBalance ?? 0)}
      />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>
    </div>
  );
}
