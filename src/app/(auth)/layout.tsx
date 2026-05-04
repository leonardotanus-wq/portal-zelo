import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthHeader } from "@/components/auth-header";
import { getRevendaLogada } from "@/lib/auth";
import { trackEvento } from "@/lib/tracking";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const revenda = await getRevendaLogada();
  if (!revenda) redirect("/");

  const headersList = await headers();
  const pathname =
    headersList.get("x-pathname") ?? headersList.get("referer") ?? undefined;
  await trackEvento(revenda, "page_view", pathname ?? undefined);

  return (
    <>
      <AuthHeader nomeEmpresa={revenda.nome_empresa} />
      <main className="flex-1 bg-zinc-50">{children}</main>
    </>
  );
}
