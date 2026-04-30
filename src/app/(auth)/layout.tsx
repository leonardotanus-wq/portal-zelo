import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AuthHeader } from "@/components/auth-header";
import { getRevendaLogada } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const revenda = await getRevendaLogada();
  if (!revenda) redirect("/");

  return (
    <>
      <AuthHeader nomeEmpresa={revenda.nome_empresa} />
      <main className="flex-1 bg-zinc-50">{children}</main>
    </>
  );
}
