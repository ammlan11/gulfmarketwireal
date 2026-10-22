import { NextResponse } from "next/server";
import {
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";

import { prisma } from "@/lib/prisma";
import { checkRateLimit, validateCsrfHeader } from "@/lib/rate-limit";
import { LEAD_MAGNET } from "@/lib/lead-magnet";

/*
 * POST /api/leads
 *
 * Saves a visitor's details in exchange for the
 * free PDF, then returns the download link.
 */
export async function POST(request: Request) {
  try {
    if (!validateCsrfHeader(request)) {
      return NextResponse.json(
        { success: false, message: "Cross-site request blocked." },
        { status: 403 },
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    const rateCheck = checkRateLimit(`leads:${ip}`, 5, 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many attempts. Please try again in a minute.",
        },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => ({}));

    // Honeypot: real visitors never see or fill this field.
    if (String(body.company ?? "").trim()) {
      return NextResponse.json({
        success: true,
        downloadUrl: LEAD_MAGNET.pdfPath,
      });
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const pagePath = String(body.pagePath ?? "").slice(0, 255) || null;

    const isTrader =
      body.isTrader === true || body.isTrader === false
        ? body.isTrader
        : null;

    // ============================
    // VALIDATION
    // ============================

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { success: false, message: "Please enter your name." },
        { status: 400 },
      );
    }

    if (
      email.length > 191 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    let normalizedPhone: string | null = null;

    if (phone) {
      let validPhone = false;

      try {
        validPhone = isValidPhoneNumber(phone);
      } catch {
        validPhone = false;
      }

      if (!validPhone) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please enter your phone number with the country code, e.g. +971 50 123 4567.",
          },
          { status: 400 },
        );
      }

      normalizedPhone = parsePhoneNumberFromString(phone)?.number ?? null;
    }

    // ============================
    // SAVE LEAD
    // ============================

    /*
     * The same person requesting the same report again
     * updates their record instead of creating a duplicate.
     */
    await prisma.lead.upsert({
      where: {
        email_magnet: {
          email,
          magnet: LEAD_MAGNET.id,
        },
      },

      update: {
        name,
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
        ...(isTrader !== null ? { isTrader } : {}),
        pagePath,
      },

      create: {
        name,
        email,
        phone: normalizedPhone,
        isTrader,
        magnet: LEAD_MAGNET.id,
        pagePath,
      },
    });

    return NextResponse.json({
      success: true,
      downloadUrl: LEAD_MAGNET.pdfPath,
    });
  } catch (error) {
    console.error("Lead capture error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}
