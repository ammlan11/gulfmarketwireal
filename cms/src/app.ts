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
 * nginx sits in front of the CMS. Trust exactly one proxy hop, so req.ip is
 * the visitor's real IP (used by the login lockout) and can't be faked with
 * a made-up X-Forwarded-For header.
 */
app.set("trust proxy", 1);

// Don't advertise "Express" in every response.
app.disable("x-powered-by");

/*
 * Security headers. The Content-Security-Policy only lets pages load
 * scripts, styles and images from the CMS itself, so injected markup can't
 * pull in outside code.
 *
 * crossOriginResourcePolicy "cross-origin" lets the public website (another
 * domain) display the uploaded article photos.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: env.NODE_ENV === "production" ? [] : null,
      },
    },

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
app.use(
  express.static(path.join(process.cwd(), "public"), {
    // Never list folders or serve hidden files like .env
    dotfiles: "deny",
    index: false,
  }),
);

/* =========================================
   ADMIN SESSION
========================================= */

app.use(
  cookieSession({
    name: "gmw_cms_session",

    secret: env.SESSION_SECRET,

    httpOnly: true,

    // "lax": the browser won't send the CMS login with form posts that
    // start on another site. requireSameOrigin (middleware/security.ts)
    // checks every post as a second layer of CSRF protection.
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
