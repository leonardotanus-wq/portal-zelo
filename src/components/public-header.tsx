import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Zelo Portal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Zelo Equipamentos" className="h-9 w-auto" />
        </Link>
        <a
          href="#login"
          className="inline-flex h-11 items-center justify-center rounded-md bg-zelo-yellow px-5 text-sm font-bold text-zelo-dark shadow-sm transition hover:brightness-95"
        >
          Entrar
        </a>
      </div>
    </header>
  );
}
