import type { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import type { Prisma } from "../generated/prisma/client";
import { ticketQuerySchema, TicketDateRange, PAGE_SIZE } from "@repo/shared/schemas/ticket";

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
  router.get("/tickets/:id", async (req, res) => {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        fromEmail: true,
        toEmail: true,
        subject: true,
        body: true,
        bodyHtml: true,
        status: true,
        category: true,
        summary: true,
        createdAt: true,
        updatedAt: true,
        agent: {
          select: { id: true, name: true },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    res.set("Cache-Control", "no-cache").json(ticket);
  });

  router.get("/tickets", async (req, res) => {
    const result = ticketQuerySchema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ error: "Invalid query parameters", details: z.flattenError(result.error).fieldErrors });
      return;
    }

    const { sortBy, sortDir, status, category, agentId, dateRange, search, page } = result.data;

    const where: Prisma.TicketWhereInput = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (agentId === "unassigned") where.agentId = null;
    else if (agentId) where.agentId = agentId;
    Object.assign(where, dateRangeToFilter(dateRange));
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { fromEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tickets, total] = await prisma.$transaction([
      prisma.ticket.findMany({
        where,
        orderBy: { [sortBy]: sortDir } as Prisma.TicketOrderByWithRelationInput,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
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
      }),
      prisma.ticket.count({ where }),
    ]);

    res.set("Cache-Control", "no-cache").json({ tickets, total, page, pageSize: PAGE_SIZE });
  });
}
