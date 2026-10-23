import { NextFunction, Request, Response } from "express";
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  let status = 500;
  let message = "Something went wrong.";

  if (err?.code === "P2002") {
    status = 409;
    message = "An article with that URL already exists.";
  } else if (err?.code === "LIMIT_FILE_SIZE") {
    // Multer: upload too large
    status = 400;
    message = "That image is too large. The maximum is 8 MB.";
  } else if (err?.expose && err?.message) {
    // Errors we raised on purpose with a message safe to show (e.g. bad upload).
    status = err.status ?? 400;
    message = err.message;
  }

  if (req.path.startsWith("/api/")) return res.status(status).json({ error: message });
  return res.status(status).render("error", { title: "Error", message });
}
