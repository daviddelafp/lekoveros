import { prisma } from "@/lib/prisma";
import UserManager from "@/components/admin/UserManager";

export default async function UsuariosPage() {
  const users = await prisma.user.findMany({
    where: { role: "BUYER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      walletBalance: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Compradores</h1>
      <UserManager users={users as never} />
    </div>
  );
}
