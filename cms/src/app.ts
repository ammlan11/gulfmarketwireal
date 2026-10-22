import path from "path";
import express from "express";
import helmet from "helmet";
import cookieSession from "cookie-session";
import expressLayouts from "express-ejs-layouts";

import { env } from "./config/env";
import apiRoutes from "./routes/api.routes";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middleware/error-handler";

export const app = express();

/* =========================================
   VIEW ENGINE
========================================= */

app.set("view engine", "ejs");

app.set("views", path.join(process.cwd(), "views"));

app.use(expressLayouts);

app.set("layout", "layout");

/* =========================================
   SECURITY
========================================= */

/*
 * Allow uploaded images to be displayed by
 * the separately hosted customer-facing app.
 *
 * Example:
 *
 * CMS:
 * http://localhost:4000
 *
 * Customer site:
 * http://localhost:3000
 */
app.use(
  helmet({
    contentSecurityPolicy: false,

    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

/* =========================================
   REQUEST BODY
========================================= */

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  }),
);

app.use(
  express.json({
    limit: "2mb",
  }),
);

/* =========================================
   STATIC FILES / UPLOADED IMAGES
========================================= */

/*
 * Files stored under:
 *
 * public/uploads/news/example.webp
 *
 * become available at:
 *
 * /uploads/news/example.webp
 */
app.use(express.static(path.join(process.cwd(), "public")));

/* =========================================
   ADMIN SESSION
========================================= */

app.use(
  cookieSession({
    name: "sumar_news_admin",

    secret: env.SESSION_SECRET,

    httpOnly: true,

    sameSite: "lax",

    secure: env.NODE_ENV === "production",

    maxAge: 8 * 60 * 60 * 1000,
  }),
);

/* =========================================
   TEMPLATE LOCALS
========================================= */

app.use((req, res, next) => {
  res.locals.adminEmail = req.session?.adminEmail;

  next();
});

/* =========================================
   BASIC ROUTES
========================================= */

app.get("/", (_req, res) => res.redirect("/admin/news"));

app.get("/health", (_req, res) =>
  res.json({
    ok: true,
  }),
);

/* =========================================
   APPLICATION ROUTES
========================================= */

app.use(authRoutes);

app.use("/admin", adminRoutes);

app.use("/api", apiRoutes);

/* =========================================
   ERROR HANDLER
========================================= */

app.use(errorHandler);
