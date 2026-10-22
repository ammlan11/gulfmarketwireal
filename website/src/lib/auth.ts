import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "sunflower_session";
const SESSION_DAYS = 30;

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: {
      token,
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

  const session = await prisma.session.findUnique({
    where: {
      token,
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
        token,
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
        token,
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}