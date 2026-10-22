import { Request, Response } from "express";
import { env } from "../config/env";

export function loginPage(req: Request, res: Response) {
  if (req.session?.adminEmail) return res.redirect("/admin/news");
  res.render("login", { title: "Admin Login", error: null });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
    return res.status(401).render("login", { title: "Admin Login", error: "Invalid email or password." });
  }
  req.session!.adminEmail = env.ADMIN_EMAIL;
  res.redirect("/admin/news");
}

export function logout(req: Request, res: Response) {
  req.session = null;
  res.redirect("/login");
}
