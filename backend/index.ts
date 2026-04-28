import express, { Router } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { requireAuth } from "./middleware/requireAuth";
import { authLimiter } from "./middleware/rateLimiter";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  })
);

// better-auth handles its own auth — must be registered before express.json()
app.all("/api/auth/*splat", authLimiter, toNodeHandler(auth));

app.use(express.json());

// Public routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Protected routes — all routes mounted here require a valid session
const apiRouter = Router();
app.use("/api", requireAuth, apiRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { apiRouter };
