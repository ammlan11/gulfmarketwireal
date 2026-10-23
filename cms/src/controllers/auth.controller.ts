import { Request, Response } from "express";
import { env } from "../config/env";

export function loginPage(req: Request, res: Response) {
  if (req.session?.adminEmail) return res.redirect("/admin/news");
  res.render("login", { title: "Admin Login", error: null });
}

export async function login(req: Request, res: Response) {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  // Email is not case-sensitive; the password must match exactly.
  if (email !== env.ADMIN_EMAIL.toLowerCase() || password !== env.ADMIN_PASSWORD) {
    return res.status(401).render("login", { title: "Admin Login", error: "Invalid email or password." });
  }
  req.session!.adminEmail = env.ADMIN_EMAIL;
  res.redirect("/admin/news");
}

export function logout(req: Request, res: Response) {
  req.session = null;
  res.redirect("/login");
}
