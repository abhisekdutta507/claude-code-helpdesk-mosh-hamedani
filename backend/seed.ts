import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { UserRole } from "./generated/prisma/client";

const email = process.env.SEED_ADMIN_EMAIL ?? "";
const password = process.env.SEED_ADMIN_PASSWORD ?? "";

if (!email || !password) {
  console.error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env");
  process.exit(1);
}

// Separate auth instance without disableSignUp so the seed can always run
const seedAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
});

async function seed() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin user already exists, skipping.");
    await prisma.$disconnect();
    return;
  }

  const result = await seedAuth.api.signUpEmail({
    body: { name: "Admin", email, password },
  });

  await prisma.user.update({
    where: { email },
    data: { role: UserRole.ADMIN },
  });

  await prisma.$disconnect();
  console.log("Created admin user:", result.user.id);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
