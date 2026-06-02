import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { name, email, password, role } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const assignedRole = role === "ADMIN" ? "ADMIN" : "BUYER";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "El email ya existe" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: assignedRole },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id, active } = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data: { active },
    select: { id: true, name: true, email: true, active: true },
  });

  return NextResponse.json(user);
}
