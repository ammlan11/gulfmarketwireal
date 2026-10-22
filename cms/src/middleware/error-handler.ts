import { NextFunction, Request, Response } from "express";
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const status = err?.code === "P2002" ? 409 : 500;
  const message = err?.code === "P2002" ? "An article with that URL already exists." : "Something went wrong.";
  if (req.path.startsWith("/api/")) return res.status(status).json({ error: message });
  return res.status(status).render("error", { title: "Error", message });
}
