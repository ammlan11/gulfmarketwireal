import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { createHash, timingSafeEqual } from "crypto";

import { env } from "../config/env";
import {
  clearLoginFailures,
  loginBlockedFor,
  recordLoginFailure,
} from "../middleware/security";

export function loginPage(req: Request, res: Response) {
  if (req.session?.adminEmail) return res.redirect("/admin/news");
  res.render("login", { title: "Admin Login", error: null });
}

// Compare two strings in constant time (hashing first makes the lengths equal).
function sameText(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/*
 * Checks the password against ADMIN_PASSWORD_HASH (a bcrypt hash) when set,
 * otherwise against ADMIN_PASSWORD. Prefer the hash on servers: then the
 * real password isn't written in any file. Make one with:
 *   npm run hash-password -- 'the-password'
 */
async function passwordMatches(password: string): Promise<boolean> {
  if (env.ADMIN_PASSWORD_HASH) {
    return bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
  }
  return sameText(password, env.ADMIN_PASSWORD ?? "");
}

export async function login(req: Request, res: Response) {
  const waitMinutes = loginBlockedFor(req);
  if (waitMinutes > 0) {
    return res.status(429).render("login", {
      title: "Admin Login",
      error: `Too many failed attempts. Try again in ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"}.`,
    });
  }

  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  // Email is not case-sensitive; the password must match exactly.
  // Always check the password, even for a wrong email, so both take the same time.
  const emailOk = sameText(email, env.ADMIN_EMAIL.toLowerCase());
  const passwordOk = await passwordMatches(password);

  if (!emailOk || !passwordOk) {
    recordLoginFailure(req);
    return res.status(401).render("login", { title: "Admin Login", error: "Invalid email or password." });
  }

  clearLoginFailures(req);
  req.session!.adminEmail = env.ADMIN_EMAIL;
  res.redirect("/admin/news");
}

export function logout(req: Request, res: Response) {
  req.session = null;
  res.redirect("/login");
}
