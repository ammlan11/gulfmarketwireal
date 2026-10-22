import { redirect } from "next/navigation";

import Header from "@/components/layout/Header/Header";
import AccountPage from "@/components/account/AccountPage/AccountPage";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountRoute() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: currentUser.id,
    },

    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,

      region: true,
      industry: true,
      jobTitle: true,
      seniority: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <Header />

      <AccountPage user={user} />
    </>
  );
}