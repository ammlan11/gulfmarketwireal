import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, validateCsrfHeader, getClientIp } from "@/lib/rate-limit";

/*
 * POST /api/auth/forgot-password
 *
 * Password reset request handler.
 */
export async function POST(request: Request) {
  try {
    if (!validateCsrfHeader(request)) {
      return NextResponse.json(
        { success: false, message: "Cross-site request blocked." },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`forgot-password:${ip}`, 3, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: "Too many password reset requests. Please try again in 1 minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email address is required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // For privacy, return success message even if email is not found
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, password reset instructions have been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to process password reset request." },
      { status: 500 }
    );
  }
}
