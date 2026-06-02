"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/catalogo", label: "Catálogo" },
  { href: "/admin/solicitudes", label: "Pedidos" },
  { href: "/admin/pool", label: "Compras pendientes" },
];

export default function AdminNav({ adminName }: { adminName?: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-gray-950 text-white flex flex-col min-h-screen flex-shrink-0">
      <div className="p-6 border-b border-gray-800">
        <p className="text-xl font-bold text-red-400">Lekoveros</p>
        <p className="text-xs text-gray-400 mt-1">Panel de administración</p>
        {adminName && (
          <p className="text-xs text-gray-500 mt-1 truncate">{adminName}</p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? "bg-red-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-sm font-medium bg-gray-800 hover:bg-red-600 text-gray-200 hover:text-white px-3 py-2.5 rounded-lg transition text-left"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
