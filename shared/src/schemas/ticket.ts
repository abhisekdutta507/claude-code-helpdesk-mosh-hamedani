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

export const TicketSortBy = {
  SUBJECT: "subject",
  FROM_EMAIL: "fromEmail",
  STATUS: "status",
  CATEGORY: "category",
  CREATED_AT: "createdAt",
} as const;

export type TicketSortBy = (typeof TicketSortBy)[keyof typeof TicketSortBy];

export const TicketSortDir = {
  ASC: "asc",
  DESC: "desc",
} as const;

export type TicketSortDir = (typeof TicketSortDir)[keyof typeof TicketSortDir];

const sortByValues = Object.values(TicketSortBy) as [TicketSortBy, ...TicketSortBy[]];
const sortDirValues = Object.values(TicketSortDir) as [TicketSortDir, ...TicketSortDir[]];

export const ticketQuerySchema = z.object({
  sortBy: z.enum(sortByValues).optional().default(TicketSortBy.CREATED_AT),
  sortDir: z.enum(sortDirValues).optional().default(TicketSortDir.DESC),
});

export type TicketQueryParams = z.infer<typeof ticketQuerySchema>;
