import type { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin";
import { prisma } from "../db";

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
}
