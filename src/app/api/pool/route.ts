import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Mover items confirmados al pool
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { wishlistItemIds } = await req.json();

  await prisma.wishlistItem.updateMany({
    where: {
      id: { in: wishlistItemIds },
      status: "PAYMENT_CONFIRMED",
    },
    data: { status: "IN_POOL" },
  });

  return NextResponse.json({ ok: true });
}

// Marcar cartas del pool como compradas
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { wishlistItemIds } = await req.json();

  await prisma.wishlistItem.updateMany({
    where: { id: { in: wishlistItemIds } },
    data: { status: "PURCHASED" },
  });

  return NextResponse.json({ ok: true });
}
