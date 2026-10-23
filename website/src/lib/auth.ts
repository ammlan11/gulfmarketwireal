import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "gmw_session";
const SESSION_DAYS = 30;

/*
 * The browser keeps the raw session token in its cookie; the database only
 * stores its SHA-256 hash. A leaked database backup therefore can't be used
 * to log in as anyone.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: {
      token: hashToken(token),
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  // Periodic lazy cleanup of expired sessions (5% chance per auth check)
  if (Math.random() < 0.05) {
    prisma.session
      .deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      })
      .catch(() => {});
  }

  const tokenHash = hashToken(token);

  const session = await prisma.session.findUnique({
    where: {
      token: tokenHash,
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({
      where: {
        token: tokenHash,
      },
    });

    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    phone: session.user.phone,
    email: session.user.email,
    role: session.user.role,
    region: session.user.region,
    industry: session.user.industry,
    jobTitle: session.user.jobTitle,
    seniority: session.user.seniority,
  };
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: {
        token: hashToken(token),
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

/*
 * Log a user out everywhere except the browser making this request.
 * Called after a password change so a stolen session stops working.
 */
export async function deleteOtherSessions(userId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  await prisma.session.deleteMany({
    where: {
      userId,
      ...(token ? { NOT: { token: hashToken(token) } } : {}),
    },
  });
}