import { NextResponse } from "next/server";
import { guardMutation } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

import { deleteOtherSessions, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
) {
  try {
    const blocked = guardMutation(request, "password", 5);
    if (blocked) return blocked;

    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const currentPassword = String(
      body.currentPassword ?? "",
    );

    const newPassword = String(
      body.newPassword ?? "",
    );

    const confirmPassword = String(
      body.confirmPassword ?? "",
    );

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "All password fields are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be at least 8 characters.",
        },
        {
          status: 400,
        },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New passwords do not match.",
        },
        {
          status: 400,
        },
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be different from your current password.",
        },
        {
          status: 400,
        },
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: currentUser.id,
        },

        select: {
          id: true,
          passwordHash: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        {
          status: 404,
        },
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        user.passwordHash,
      );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current password is incorrect.",
        },
        {
          status: 400,
        },
      );
    }

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12,
      );

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },

      data: {
        passwordHash,
      },
    });

    // Sign the account out on every other device, so anyone using a
    // stolen session loses access the moment the password changes.
    await deleteOtherSessions(currentUser.id);

    return NextResponse.json({
      success: true,
      message:
        "Password changed. You have been signed out on your other devices.",
    });
  } catch (error) {
    console.error(
      "Unable to change password:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to change password.",
      },
      {
        status: 500,
      },
    );
  }
}