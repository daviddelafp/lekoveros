import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@lekoveros.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@lekoveros.com",
      password,
      role: "ADMIN",
      active: true,
    },
  });

  console.log("Admin creado:", admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
