import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // The session must belong to the CURRENT admin email, so changing
  // ADMIN_EMAIL (or the session secret) logs out every old session.
  if (!req.session?.adminEmail || req.session.adminEmail !== env.ADMIN_EMAIL) {
    req.session = null;
    return res.redirect("/login");
  }
  next();
}
