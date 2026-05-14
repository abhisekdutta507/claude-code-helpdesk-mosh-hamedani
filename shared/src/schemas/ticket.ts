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
const statusValues = Object.values(TicketStatus) as [TicketStatus, ...TicketStatus[]];
const categoryValues = Object.values(TicketCategory) as [TicketCategory, ...TicketCategory[]];

export const TicketDateRange = {
  TODAY: "today",
  LAST_7_DAYS: "last7days",
  LAST_30_DAYS: "last30days",
  ALL_TIME: "allTime",
} as const;

export type TicketDateRange = (typeof TicketDateRange)[keyof typeof TicketDateRange];

const dateRangeValues = Object.values(TicketDateRange) as [TicketDateRange, ...TicketDateRange[]];

export const PAGE_SIZE = 10;

export const ticketQuerySchema = z.object({
  sortBy: z.enum(sortByValues).optional().default(TicketSortBy.CREATED_AT),
  sortDir: z.enum(sortDirValues).optional().default(TicketSortDir.DESC),
  status: z.enum(statusValues).optional(),
  category: z.enum(categoryValues).optional(),
  agentId: z.string().optional(),
  dateRange: z.enum(dateRangeValues).optional().default(TicketDateRange.ALL_TIME),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type TicketQueryParams = z.infer<typeof ticketQuerySchema>;

export const createReplySchema = z.object({
  body: z.string().min(1),
});

export type CreateReplyInput = z.infer<typeof createReplySchema>;
