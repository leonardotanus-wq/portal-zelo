"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginRevenda } from "@/app/(public)/actions";

export function LoginRevendaForm() {
  const [state, formAction, pending] = useActionState(loginRevenda, {});

  return (
    <form
      id="login"
      action={formAction}
      className="flex w-full flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-zinc-200 sm:p-8"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-zelo-dark">Acesso da Revenda</h2>
        <p className="text-sm text-zinc-500">
          Entre com seu usuário para acessar o portal.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="usuario" className="text-sm font-semibold text-zelo-dark">
          Sua empresa
        </Label>
        <Input
          id="usuario"
          name="usuario"
          required
          autoComplete="username"
          placeholder="Ex: jkportoes"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha" className="text-sm font-semibold text-zelo-dark">
          Senha
        </Label>
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
        className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-zelo-yellow text-base font-bold text-zelo-dark shadow-sm transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Entrando…
          </>
        ) : (
          "Entrar no Portal"
        )}
      </button>

      <p className="text-center text-xs text-zinc-500">
        Esqueceu sua senha? Fale com seu vendedor.
      </p>
    </form>
  );
}
