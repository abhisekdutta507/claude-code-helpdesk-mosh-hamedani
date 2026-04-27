import { auth } from "./auth";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("Seeding admin user...");

  const result = await auth.api.signUpEmail({
    body: {
      name: "Abhisek Dutta",
      email: "abhisek.dutta.507@gmail.com",
      password: "Admin@1234!",
    },
  });

  await prisma.user.update({
    where: { email: "abhisek.dutta.507@gmail.com" },
    data: { role: "ADMIN" },
  });

  await prisma.$disconnect();
  console.log("Done. User:", result.user.id, "→ ADMIN");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
