import { z } from "zod";

export const UserRole = {
  ADMIN: "ADMIN",
  AGENT: "AGENT",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const createUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters long"),
  email: z.email("Invalid email address"),
  password: z.string().trim().min(8, "Password must be at least 8 characters long"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
