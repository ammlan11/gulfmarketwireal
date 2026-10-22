import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();

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

    const region = String(
      body.region ?? "",
    ).trim();

    const industry = String(
      body.industry ?? "",
    ).trim();

    const jobTitle = String(
      body.jobTitle ?? "",
    ).trim();

    const seniority = String(
      body.seniority ?? "",
    ).trim();

    if (region.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Region is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (industry.length > 150) {
      return NextResponse.json(
        {
          success: false,
          message: "Industry is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (jobTitle.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Job title is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (seniority.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Seniority is too long.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await prisma.user.update({
      where: {
        id: currentUser.id,
      },

      data: {
        region: region || null,
        industry: industry || null,
        jobTitle: jobTitle || null,
        seniority: seniority || null,
      },

      select: {
        region: true,
        industry: true,
        jobTitle: true,
        seniority: true,
      },
    });

    return NextResponse.json({
      success: true,
      profile: user,
    });
  } catch (error) {
    console.error(
      "Unable to update profile preferences:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update profile preferences.",
      },
      {
        status: 500,
      },
    );
  }
}