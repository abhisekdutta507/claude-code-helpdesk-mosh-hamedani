import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { UserRole } from "@repo/shared/schemas/user";

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "";
const agent1Email = process.env.SEED_AGENT1_EMAIL ?? "";
const agent1Password = process.env.SEED_AGENT1_PASSWORD ?? "";

if (!adminEmail || !adminPassword) {
  console.error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env");
  process.exit(1);
}

// Separate auth instance without disableSignUp so the seed can always run
const seedAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
});

async function createUser(email: string, password: string, name: string, role: UserRole) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists, skipping.`);
    return;
  }
  const result = await seedAuth.api.signUpEmail({ body: { name, email, password } });
  await prisma.user.update({ where: { email }, data: { role } });
  console.log(`Created ${role} user:`, result.user.id);
}

async function seed() {
  await createUser(adminEmail, adminPassword, "Admin", UserRole.ADMIN);
  if (agent1Email && agent1Password) {
    await createUser(agent1Email, agent1Password, "Agent 1", UserRole.AGENT);
  }
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
