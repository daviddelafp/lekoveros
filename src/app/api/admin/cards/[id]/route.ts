import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: { price?: number; active?: boolean } = {};
  if (body.price !== undefined) data.price = body.price;
  if (body.active !== undefined) data.active = body.active;

  const card = await prisma.card.update({
    where: { id },
    data,
  });

  return NextResponse.json(card);
}
