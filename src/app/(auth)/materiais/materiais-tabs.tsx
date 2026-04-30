"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIAS_MATERIAL, type CategoriaMaterial } from "@/lib/types";

export function MateriaisTabs({ atual }: { atual: CategoriaMaterial }) {
  const router = useRouter();
  const params = useSearchParams();

  function trocar(value: string) {
    const novosParams = new URLSearchParams(params.toString());
    novosParams.set("cat", value);
    router.push(`/materiais?${novosParams.toString()}`);
  }

  return (
    <Tabs value={atual} onValueChange={trocar} className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-zinc-100">
        {CATEGORIAS_MATERIAL.map((c) => (
          <TabsTrigger
            key={c.value}
            value={c.value}
            className="text-sm font-semibold"
          >
            {c.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
