import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
) {
  try {
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

    const name = String(
      body.name ?? "",
    ).trim();

    // const phone = String(
    //   body.phone ?? "",
    // ).trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name must be 100 characters or fewer.",
        },
        {
          status: 400,
        },
      );
    }

    // if (phone.length > 30) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message:
    //         "Phone number is too long.",
    //     },
    //     {
    //       status: 400,
    //     },
    //   );
    // }

    const user = await prisma.user.update({
      where: {
        id: currentUser.id,
      },

      data: {
        name,
        // phone: phone || null,
      },

      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "Unable to update account profile:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update account profile.",
      },
      {
        status: 500,
      },
    );
  }
}