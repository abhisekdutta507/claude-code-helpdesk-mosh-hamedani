import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "AGENT",
        input: false,
      },
    },
  },
  trustedOrigins: [process.env.CORS_ORIGIN ?? "http://localhost:5173"],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email" && ctx.body?.email) {
        return {
          context: {
            ...ctx,
            body: { ...ctx.body, email: ctx.body.email.toLowerCase() },
          },
        };
      }
    }),
  },
});
