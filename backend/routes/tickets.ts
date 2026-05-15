import type { Router } from "express";
import { z } from "zod";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { prisma } from "../db";
import type { Prisma } from "../generated/prisma/client";
import { ticketQuerySchema, TicketDateRange, PAGE_SIZE, TicketStatus, TicketCategory, createReplySchema } from "@repo/shared/schemas/ticket";

const ollama = createOpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });

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

  router.patch("/tickets/:id", async (req, res) => {
    const bodySchema = z.object({
      status: z.enum(Object.values(TicketStatus) as [TicketStatus, ...TicketStatus[]]).optional(),
      category: z.enum(Object.values(TicketCategory) as [TicketCategory, ...TicketCategory[]]).nullable().optional(),
    });
    const result = bodySchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid request body", details: z.flattenError(result.error).fieldErrors });
      return;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const updated = await prisma.ticket.update({
      where: { id: req.params.id },
      data: result.data,
      select: { id: true, status: true, category: true },
    });

    res.json(updated);
  });

  router.patch("/tickets/:id/agent", async (req, res) => {
    const bodySchema = z.object({
      agentId: z.string().nullable(),
    });
    const result = bodySchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid request body", details: z.flattenError(result.error).fieldErrors });
      return;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (result.data.agentId !== null) {
      const agent = await prisma.user.findUnique({ where: { id: result.data.agentId }, select: { id: true } });
      if (!agent) {
        res.status(400).json({ error: "Invalid request body", details: { agentId: ["Agent not found"] } });
        return;
      }
    }

    const updated = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { agentId: result.data.agentId },
      select: {
        id: true,
        agent: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  });

  router.get("/tickets/:id/replies", async (req, res) => {
    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const replies = await prisma.reply.findMany({
      where: { ticketId: req.params.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        body: true,
        bodyHtml: true,
        fromEmail: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
      },
    });

    res.set("Cache-Control", "no-cache").json(replies);
  });

  const polishReplySchema = z.object({ body: z.string().min(1) });

  router.post("/tickets/:id/polish-reply", async (req, res) => {
    const result = polishReplySchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid request body", details: z.flattenError(result.error).fieldErrors });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      select: {
        subject: true,
        body: true,
        replies: {
          orderBy: { createdAt: "asc" },
          select: {
            body: true,
            fromEmail: true,
            author: { select: { name: true } },
          },
        },
      },
    });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const conversation = ticket.replies
      .map((r) => {
        const sender = r.author ? r.author.name : (r.fromEmail ?? "Customer");
        return `${sender}:\n${r.body}`;
      })
      .join("\n\n---\n\n");

    const prompt = `Subject: ${ticket.subject}

Original message:
${ticket.body}${conversation ? `\n\n---\n\nConversation so far:\n\n${conversation}` : ""}

---

Draft reply to improve:
${result.data.body}`;

    const { text } = await generateText({
      model: ollama("llama3.2"),
      system: "You are a helpful customer support agent. You will be given a support ticket subject, the original message, the conversation so far, and a draft reply. Improve the draft reply: fix grammar, improve clarity and tone, and make sure it is relevant to the ticket context. Return only the improved reply text, no preamble or explanation.",
      prompt,
    });

    res.json({ polished: text });
  });

  router.post("/tickets/:id/replies", async (req, res) => {
    const result = createReplySchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid request body", details: z.flattenError(result.error).fieldErrors });
      return;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const reply = await prisma.reply.create({
      data: {
        ticketId: req.params.id,
        authorId: req.user!.id,
        body: result.data.body,
      },
      select: {
        id: true,
        body: true,
        bodyHtml: true,
        fromEmail: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(reply);
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
