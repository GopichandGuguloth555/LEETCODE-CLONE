import { currentUser } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import Navbar from "@/modules/home/components/navbar";

export default async function RootGroupLayout({ children }) {
  const user = await currentUser();

  let userRole = null;
  if (user) {
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true },
    });
    userRole = dbUser?.role ?? null;
  }

  return (
    <>
      <Navbar userRole={userRole} />
      {children}
    </>
  );
}
