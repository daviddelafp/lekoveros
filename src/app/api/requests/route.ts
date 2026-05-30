import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Admin: confirmar pago → IN_POOL | rechazar → PENDING de nuevo
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id, action } = await req.json();

  if (!["confirm", "reject"].includes(action)) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const item = await prisma.wishlistItem.update({
    where: { id },
    data: {
      status: action === "confirm" ? "PAYMENT_CONFIRMED" : "PENDING",
    },
    include: { card: true, user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(item);
}
