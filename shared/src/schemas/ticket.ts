import { z } from "zod";

export const TicketStatus = {
  OPEN: "OPEN",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketCategory = {
  GENERAL_QUESTION: "GENERAL_QUESTION",
  TECHNICAL_QUESTION: "TECHNICAL_QUESTION",
  REFUND_REQUEST: "REFUND_REQUEST",
} as const;

export type TicketCategory = (typeof TicketCategory)[keyof typeof TicketCategory];

export const inboundEmailSchema = z.object({
  from: z.email(),
  to: z.string().optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export type InboundEmailInput = z.infer<typeof inboundEmailSchema>;
