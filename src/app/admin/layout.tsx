import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") redirect("/login");

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminNav adminName={session.user?.name ?? undefined} />
      <main className="flex-1 p-8 overflow-auto min-w-0">{children}</main>
    </div>
  );
}
