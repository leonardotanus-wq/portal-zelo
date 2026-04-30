import { createClient } from "@/lib/supabase/server";
import type { Revenda } from "@/lib/types";
import { RevendasClient } from "./revendas-client";

export const metadata = { title: "Revendas — Admin Zelo" };

export default async function AdminRevendasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("revendas")
    .select("*")
    .order("created_at", { ascending: false });

  const revendas = (data ?? []) as Revenda[];

  return (
    <div className="p-8">
      <RevendasClient revendas={revendas} />
    </div>
  );
}
