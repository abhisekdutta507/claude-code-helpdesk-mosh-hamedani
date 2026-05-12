import type { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin";
import { prisma } from "../db";
import { hashPassword, generateRandomString } from "better-auth/crypto";
import { z } from "zod";
import { createUserSchema, UserRole } from "@repo/shared/schemas/user";

export function registerUsersRoutes(router: Router) {
  router.get("/users", requireAdmin, async (_req, res) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(users);
  });

  router.post("/users", requireAdmin, async (req, res) => {
    const result = createUserSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid input", details: z.flattenError(result.error).fieldErrors });
      return;
    }
    const { name, email, password } = result.data;

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      res.status(409).json({ error: "A user with that email already exists." });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const userId = generateRandomString(32, "a-z", "A-Z", "0-9");
    const accountId = generateRandomString(32, "a-z", "A-Z", "0-9");
    const now = new Date();

    const user = await prisma.user.create({
      data: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        emailVerified: false,
        role: UserRole.AGENT,
        createdAt: now,
        updatedAt: now,
        accounts: {
          create: {
            id: accountId,
            accountId: userId,
            providerId: "credential",
            password: hashedPassword,
            createdAt: now,
            updatedAt: now,
          },
        },
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json(user);
  });
}
