import { timingSafeEqual } from "node:crypto";
import type { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../db";
import { inboundEmailSchema } from "@repo/shared/schemas/ticket";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fieldSize: 1 * 1024 * 1024 },
});

function requireWebhookSecret(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.INBOUND_PARSE_SECRET;
  if (!secret) {
    next();
    return;
  }
  const provided = (req.query["secret"] as string | undefined) ?? "";
  if (provided.length !== secret.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(secret))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

function parseEmail(header: string): string {
  const angleMatch = header.match(/<([^>]+)>/);
  if (angleMatch) return angleMatch[1]!.toLowerCase().trim();
  return header.toLowerCase().trim();
}

// Strip Re:/Fwd: prefixes so replies match the original ticket subject
function normalizeSubject(subject: string): string {
  return subject.replace(/^(re|fwd?):\s*/i, "").trim();
}


function extractBody(text: string | undefined, html: string | undefined): string {
  if (text && text.trim().length > 0) return text.trim();
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function registerInboundRoutes(router: Router): void {
  router.post(
    "/api/inbound/email",
    requireWebhookSecret,
    upload.none(),
    async (req: Request, res: Response) => {
      const fields = req.body as Record<string, string>;
      const fromEmail = parseEmail(fields["from"] ?? "");
      const toEmail = fields["to"] ? parseEmail(fields["to"]) : undefined;
      const subject = fields["subject"] ?? "";
      const html = fields["html"];
      const body = extractBody(fields["text"], html);

      const result = inboundEmailSchema.safeParse({ from: fromEmail, to: toEmail, subject, body });
      if (!result.success) {
        console.warn("Inbound email failed validation", z.flattenError(result.error).fieldErrors);
        // Return 200 so providers don't retry malformed/spam emails
        res.status(200).json({ ok: false, reason: "validation_failed" });
        return;
      }

      // Idempotency: deduplicate retries within a 5-minute window
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentDuplicate = await prisma.ticket.findFirst({
        where: {
          fromEmail: result.data.from,
          subject: result.data.subject,
          body: result.data.body,
          createdAt: { gte: fiveMinutesAgo },
        },
        select: { id: true },
      });
      if (recentDuplicate) {
        res.status(200).json({ ok: true, ticketId: recentDuplicate.id, duplicate: true });
        return;
      }

      // If this looks like a reply (Re:/Fwd: prefix or same base subject), attach to existing ticket
      const baseSubject = normalizeSubject(result.data.subject);
      const parentTicket = await prisma.ticket.findFirst({
        where: {
          fromEmail: result.data.from,
          subject: { equals: baseSubject, mode: "insensitive" },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (parentTicket) {
        await prisma.reply.create({
          data: {
            ticketId: parentTicket.id,
            fromEmail: result.data.from,
            body: result.data.body,
            bodyHtml: html ?? null,
          },
        });
        res.status(200).json({ ok: true, ticketId: parentTicket.id, reply: true });
        return;
      }

      const ticket = await prisma.ticket.create({
        data: {
          fromEmail: result.data.from,
          toEmail: result.data.to,
          subject: result.data.subject,
          body: result.data.body,
          bodyHtml: html ?? null,
        },
        select: { id: true },
      });

      res.status(200).json({ ok: true, ticketId: ticket.id });
    }
  );
}
