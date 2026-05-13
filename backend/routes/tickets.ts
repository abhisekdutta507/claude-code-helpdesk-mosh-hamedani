import type { Router } from "express";
import { prisma } from "../db";

export function registerTicketsRoutes(router: Router) {
  router.get("/tickets", async (_req, res) => {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fromEmail: true,
        subject: true,
        status: true,
        category: true,
        summary: true,
        createdAt: true,
        agent: {
          select: { id: true, name: true },
        },
      },
    });

    res.json(tickets);
  });
}
