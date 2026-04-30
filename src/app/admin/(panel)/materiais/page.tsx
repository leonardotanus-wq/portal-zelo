import { createClient } from "@/lib/supabase/server";
import type { Material } from "@/lib/types";
import { MateriaisClient } from "./materiais-client";

export const metadata = { title: "Materiais — Admin Zelo" };

export default async function AdminMateriaisPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materiais")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <MateriaisClient materiais={(data ?? []) as Material[]} />
    </div>
  );
}
