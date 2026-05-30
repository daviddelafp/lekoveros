"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/catalogo", label: "Catálogo" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/pool", label: "Pool de Compra" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-700">
        <p className="text-xl font-bold text-red-400">Lekoveros</p>
        <p className="text-xs text-gray-400 mt-1">Panel Admin</p>
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
              className={`block px-3 py-2 rounded-lg text-sm transition ${
                active
                  ? "bg-red-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
