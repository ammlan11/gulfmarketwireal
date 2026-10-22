import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { TraderStatus } from "@prisma/client";

import {
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import {
  checkRateLimit,
  validateCsrfHeader,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // ============================
    // CSRF PROTECTION
    // ============================

    if (!validateCsrfHeader(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "Cross-site request blocked.",
        },
        { status: 403 },
      );
    }

    // ============================
    // RATE LIMITING
    // ============================

    const ip =
      request.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim() || "127.0.0.1";

    const rateCheck = checkRateLimit(
      `register:${ip}`,
      5,
      60 * 1000,
    );

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many registration attempts. Please try again in 1 minute.",
        },
        { status: 429 },
      );
    }

    // ============================
    // READ REQUEST BODY
    // ============================

    const body = await request.json();

    const name = String(
      body.name ?? "",
    ).trim();

    const country = String(
      body.country ?? "",
    )
      .trim()
      .toUpperCase();

    const phone = String(
      body.phone ?? "",
    ).trim();

    const email = String(
      body.email ?? "",
    )
      .trim()
      .toLowerCase();

    const password = String(
      body.password ?? "",
    );

    // ============================
    // REQUIRED FIELD VALIDATION
    // ============================

    if (
      !name ||
      !country ||
      !phone ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, country, phone number, email and password are required.",
        },
        { status: 400 },
      );
    }

    // ============================
    // NAME VALIDATION
    // ============================

    if (
      name.length < 2 ||
      name.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Full name must be between 2 and 100 characters.",
        },
        { status: 400 },
      );
    }

    if (
      !/^[\p{L}\p{M} .'’-]+$/u.test(
        name,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid full name.",
        },
        { status: 400 },
      );
    }

    // ============================
    // COUNTRY VALIDATION
    // ============================

    if (!/^[A-Z]{2}$/.test(country)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid country.",
        },
        { status: 400 },
      );
    }

    const countryCode =
      country as CountryCode;

    // ============================
    // PHONE VALIDATION
    // ============================

    let validPhone = false;

    try {
      validPhone = isValidPhoneNumber(
        phone,
        countryCode,
      );
    } catch {
      validPhone = false;
    }

    if (!validPhone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid phone number for the selected country.",
        },
        { status: 400 },
      );
    }

    const parsedPhone =
      parsePhoneNumberFromString(
        phone,
        countryCode,
      );

    if (!parsedPhone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to process the phone number.",
        },
        { status: 400 },
      );
    }

    // Store in standard international E.164 format
    const normalizedPhone =
      parsedPhone.number;

    // ============================
    // EMAIL VALIDATION
    // ============================

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid email address.",
        },
        { status: 400 },
      );
    }

    // ============================
    // PASSWORD VALIDATION
    // ============================

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be at least 8 characters.",
        },
        { status: 400 },
      );
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain a lowercase letter.",
        },
        { status: 400 },
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain an uppercase letter.",
        },
        { status: 400 },
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain a number.",
        },
        { status: 400 },
      );
    }

    // ============================
    // TRADER VALIDATION
    // ============================

    if (
      body.isTrader !== true &&
      body.isTrader !== false
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select whether you are a trader.",
        },
        { status: 400 },
      );
    }

    const isTrader: TraderStatus =
      body.isTrader
        ? TraderStatus.YES
        : TraderStatus.NO;

    // ============================
    // CHECK EXISTING USER
    // ============================

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account already exists with this email.",
        },
        { status: 409 },
      );
    }

    // ============================
    // HASH PASSWORD
    // ============================

    const passwordHash =
      await bcrypt.hash(
        password,
        12,
      );

    // ============================
    // CREATE USER
    // ============================

    const user =
      await prisma.user.create({
        data: {
          name,
          country,
          phone: normalizedPhone,
          email,
          passwordHash,
          isTrader,
        },
      });

    // ============================
    // CREATE LOGIN SESSION
    // ============================

    await createSession(user.id);

    // ============================
    // RESPONSE
    // ============================

    return NextResponse.json({
      success: true,

      user: {
        id: user.id,
        name: user.name,
        country: user.country,
        phone: user.phone,
        email: user.email,
        isTrader: user.isTrader,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Register error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create account.",
      },
      { status: 500 },
    );
  }
}