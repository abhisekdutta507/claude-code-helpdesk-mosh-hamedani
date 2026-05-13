import type { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import type { Prisma } from "../generated/prisma/client";
import { ticketQuerySchema } from "@repo/shared/schemas/ticket";

export function registerTicketsRoutes(router: Router) {
  router.get("/tickets", async (req, res) => {
    const result = ticketQuerySchema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ error: "Invalid query parameters", details: z.flattenError(result.error).fieldErrors });
      return;
    }

    const { sortBy, sortDir } = result.data;

    const tickets = await prisma.ticket.findMany({
      orderBy: { [sortBy]: sortDir } as Prisma.TicketOrderByWithRelationInput,
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

    res.set('Cache-Control', 'no-cache').json(tickets);
  });
}
