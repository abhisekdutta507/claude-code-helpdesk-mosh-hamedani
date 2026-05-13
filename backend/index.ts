import express, { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { requireAuth } from "./middleware/requireAuth";
import { authLimiter } from "./middleware/rateLimiter";
import { registerInboundRoutes } from "./routes/inbound";
import { registerUsersRoutes } from "./routes/users";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  })
);

// better-auth handles its own auth — must be registered before express.json()
app.all("/api/auth/*splat", authLimiter, toNodeHandler(auth));

app.use(express.json({ limit: "100kb" }));

// Public routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Public API routes — registered directly on app before requireAuth to bypass the auth guard
registerInboundRoutes(app);

// Protected routes — all routes mounted here require a valid session
const apiRouter = Router();
app.use("/api", requireAuth, apiRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

registerUsersRoutes(apiRouter);

export { apiRouter };
