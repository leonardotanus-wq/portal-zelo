"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { loginAdmin } from "./actions";

const inputClass =
  "h-12 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base text-zelo-dark transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

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
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
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
