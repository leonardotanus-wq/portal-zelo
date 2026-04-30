import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginAdminForm } from "./login-admin-form";

export const metadata = { title: "Admin — Zelo Portal" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();
    if (admin) redirect("/admin");
  }

  const params = await searchParams;
  const erroInicial =
    params.erro === "sem-permissao"
      ? "Esta conta não tem permissão de administrador."
      : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zelo-dark px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-white.svg"
            alt="Zelo"
            className="mx-auto h-10 w-auto"
          />
        </div>
        <LoginAdminForm erroInicial={erroInicial} />
      </div>
    </div>
  );
}
