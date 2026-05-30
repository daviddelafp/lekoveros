"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function BuyerNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  const links = [
    { href: "/catalogo", label: "Catálogo" },
    { href: "/mi-lista", label: "Mi Lista" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-16">
        <Link href="/catalogo" className="text-xl font-bold text-red-600">
          Lekoveros
        </Link>

        <div className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition ${
                pathname.startsWith(link.href)
                  ? "text-red-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-red-600 transition"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
