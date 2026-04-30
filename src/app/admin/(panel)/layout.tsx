import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAdminLogado } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await getAdminLogado();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <AdminSidebar email={admin.user.email ?? ""} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
