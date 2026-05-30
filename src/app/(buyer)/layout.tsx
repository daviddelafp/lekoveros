import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BuyerNav from "@/components/BuyerNav";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <BuyerNav userName={session.user?.name ?? ""} />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>
    </div>
  );
}
