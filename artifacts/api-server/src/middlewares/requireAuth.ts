import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

export const requireAuth: RequestHandler = (req, res, next) => {
  const auth = getAuth(req) as unknown as {
    userId?: string | null;
    sessionClaims?: { userId?: string };
  };
  const userId = auth.userId ?? auth.sessionClaims?.userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in is required for this action." });
    return;
  }
  res.locals.userId = userId;
  next();
};