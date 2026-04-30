import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PageBackLink({ href = "/home" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-600 hover:text-zelo-dark"
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar
    </Link>
  );
}
