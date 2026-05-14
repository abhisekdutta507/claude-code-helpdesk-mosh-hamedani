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

const extraAgents: { name: string; email: string; joinedAt: Date }[] = [
  { name: "Alice Johnson",  email: "alice.johnson@gmail.com",  joinedAt: new Date("2023-01-15") },
  { name: "Bob Martinez",   email: "bob.martinez@gmail.com",   joinedAt: new Date("2023-02-20") },
  { name: "Carol Williams", email: "carol.williams@gmail.com", joinedAt: new Date("2023-03-08") },
  { name: "David Chen",     email: "david.chen@gmail.com",     joinedAt: new Date("2023-04-12") },
  { name: "Eva Nguyen",     email: "eva.nguyen@gmail.com",     joinedAt: new Date("2023-05-03") },
  { name: "Frank Patel",    email: "frank.patel@gmail.com",    joinedAt: new Date("2023-06-17") },
  { name: "Grace Kim",      email: "grace.kim@gmail.com",      joinedAt: new Date("2023-07-22") },
  { name: "Henry Okafor",   email: "henry.okafor@gmail.com",   joinedAt: new Date("2023-08-09") },
  { name: "Isla Thompson",  email: "isla.thompson@gmail.com",  joinedAt: new Date("2023-09-14") },
  { name: "James Rivera",   email: "james.rivera@gmail.com",   joinedAt: new Date("2023-10-30") },
  { name: "Karen Lee",      email: "karen.lee@gmail.com",      joinedAt: new Date("2023-11-05") },
  { name: "Liam Brown",     email: "liam.brown@gmail.com",     joinedAt: new Date("2023-12-19") },
  { name: "Mia Gonzalez",   email: "mia.gonzalez@gmail.com",   joinedAt: new Date("2024-01-08") },
  { name: "Noah Davis",     email: "noah.davis@gmail.com",     joinedAt: new Date("2024-02-14") },
  { name: "Olivia White",   email: "olivia.white@gmail.com",   joinedAt: new Date("2024-03-21") },
  { name: "Paul Harris",    email: "paul.harris@gmail.com",    joinedAt: new Date("2024-04-07") },
  { name: "Quinn Adams",    email: "quinn.adams@gmail.com",    joinedAt: new Date("2024-05-16") },
  { name: "Rachel Scott",   email: "rachel.scott@gmail.com",   joinedAt: new Date("2024-06-25") },
  { name: "Samuel Turner",  email: "samuel.turner@gmail.com",  joinedAt: new Date("2024-07-11") },
  { name: "Tina Walker",    email: "tina.walker@gmail.com",    joinedAt: new Date("2024-08-30") },
];

async function seed() {
  await createUser(adminEmail, adminPassword, "Admin", UserRole.ADMIN);
  if (agent1Email && agent1Password) {
    await createUser(agent1Email, agent1Password, "Jordan Lee", UserRole.AGENT);
  }

  for (const agent of extraAgents) {
    await createUser(agent.email, "Agent@1234!", agent.name, UserRole.AGENT);
    await prisma.user.update({
      where: { email: agent.email },
      data: { createdAt: agent.joinedAt, updatedAt: agent.joinedAt },
    });
  }

  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
