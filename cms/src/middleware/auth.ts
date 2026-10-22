import { NextFunction, Request, Response } from "express";
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.adminEmail) return res.redirect("/login");
  next();
}
