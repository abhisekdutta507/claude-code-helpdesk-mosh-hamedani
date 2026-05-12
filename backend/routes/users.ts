import type { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin";
import { prisma } from "../db";
import { hashPassword, generateRandomString } from "better-auth/crypto";
import { z } from "zod";
import { createUserSchema, updateUserSchema, UserRole } from "@repo/shared/schemas/user";

export function registerUsersRoutes(router: Router) {
  router.get("/users", requireAdmin, async (_req, res) => {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
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

  router.delete("/users/:id", requireAdmin, async (req, res) => {
    const { id } = req.params as { id: string };

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (existing.role === UserRole.ADMIN) {
      res.status(403).json({ error: "Admin users cannot be deleted." });
      return;
    }

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.account.deleteMany({ where: { userId: id } }),
      prisma.user.update({ where: { id }, data: { deletedAt: new Date() } }),
    ]);

    res.status(204).send();
  });

  router.put("/users/:id", requireAdmin, async (req, res) => {
    const result = updateUserSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid input", details: z.flattenError(result.error).fieldErrors });
      return;
    }
    const { name, password } = result.data;
    const { id } = req.params as { id: string };

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const now = new Date();

    await prisma.user.update({
      where: { id: id },
      data: { name: name.trim(), updatedAt: now },
    });

    if (password) {
      const hashedPassword = await hashPassword(password);
      await prisma.account.updateMany({
        where: { userId: id, providerId: "credential" },
        data: { password: hashedPassword, updatedAt: now },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.json(user);
  });
}
