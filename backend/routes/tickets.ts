import type { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import type { Prisma } from "../generated/prisma/client";
import { ticketQuerySchema, TicketDateRange } from "@repo/shared/schemas/ticket";

function dateRangeToFilter(dateRange: TicketDateRange): Prisma.TicketWhereInput {
  const now = new Date();
  if (dateRange === TicketDateRange.TODAY) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { createdAt: { gte: start } };
  }
  if (dateRange === TicketDateRange.LAST_7_DAYS) {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { createdAt: { gte: start } };
  }
  if (dateRange === TicketDateRange.LAST_30_DAYS) {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { createdAt: { gte: start } };
  }
  return {};
}

export function registerTicketsRoutes(router: Router) {
  router.get("/tickets", async (req, res) => {
    const result = ticketQuerySchema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ error: "Invalid query parameters", details: z.flattenError(result.error).fieldErrors });
      return;
    }

    const { sortBy, sortDir, status, category, agentId, dateRange, search } = result.data;

    const where: Prisma.TicketWhereInput = {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(agentId === "unassigned" ? { agentId: null } : agentId ? { agentId } : {}),
      ...dateRangeToFilter(dateRange),
      ...(search
        ? {
            OR: [
              { subject: { contains: search, mode: "insensitive" } },
              { fromEmail: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const tickets = await prisma.ticket.findMany({
      where,
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

    res.set("Cache-Control", "no-cache").json(tickets);
  });
}
