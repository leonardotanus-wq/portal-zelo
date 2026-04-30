"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAdmin } from "./actions";

export function LoginAdminForm({ erroInicial }: { erroInicial?: string }) {
  const [state, formAction, pending] = useActionState(loginAdmin, {
    erro: erroInicial,
  });

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-zinc-200 sm:p-8"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zelo-dark">
          Admin Zelo
        </h1>
        <p className="text-sm text-zinc-500">
          Acesso restrito à equipe Zelo Equipamentos.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          required
          autoComplete="current-password"
          className="h-12 text-base"
        />
      </div>

      {state.erro && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          {state.erro}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-zelo-dark text-base font-bold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-5 w-5 animate-spin" />}
        Entrar
      </button>
    </form>
  );
}
