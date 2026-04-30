export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zelo-dark text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-white.svg"
            alt="Zelo Equipamentos"
            className="h-8 w-auto"
          />
          <span className="text-sm text-zinc-300">
            © 2025 Zelo Equipamentos
          </span>
        </div>
        <div className="text-sm text-zinc-400">
          Smart Gates · Em breve mais conteúdo
        </div>
      </div>
    </footer>
  );
}
