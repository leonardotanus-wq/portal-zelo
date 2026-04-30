"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FolderArchive,
  Video,
  LogOut,
} from "lucide-react";
import { logout } from "@/app/(auth)/actions";

const links = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/revendas", label: "Revendas", Icon: Building2 },
  { href: "/admin/materiais", label: "Materiais", Icon: FolderArchive },
  { href: "/admin/videos", label: "Vídeos", Icon: Video },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Zelo" className="h-9 w-auto" />
        <p className="mt-3 truncate text-xs text-zinc-500">{email}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ href, label, Icon, exact }) => {
          const ativo = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                ativo
                  ? "bg-zelo-yellow text-zelo-dark"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
