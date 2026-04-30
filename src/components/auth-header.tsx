import Link from "next/link";
import { LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";

export function AuthHeader({ nomeEmpresa }: { nomeEmpresa: string }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/home" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Zelo" className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-zelo-dark sm:inline">
            Olá, <span className="font-bold capitalize">{nomeEmpresa}</span>
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zelo-dark transition hover:bg-zinc-50"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
