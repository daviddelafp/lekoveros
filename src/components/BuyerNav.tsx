"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function BuyerNav({
  userName,
  walletBalance,
}: {
  userName: string;
  walletBalance?: number;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/catalogo", label: "Catálogo" },
    { href: "/mi-lista", label: "Carrito" },
    { href: "/mis-pedidos", label: "Mis pedidos" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-16">
        <Link href="/catalogo" className="text-xl font-bold text-red-600 flex-shrink-0">
          Lekoveros
        </Link>

        <div className="flex items-center gap-1 mx-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname.startsWith(link.href)
                  ? "bg-red-50 text-red-600"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {walletBalance !== undefined && (
            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
              ¥{walletBalance.toFixed(2)}
            </span>
          )}
          <span className="text-sm text-gray-600 hidden sm:block">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm bg-gray-100 hover:bg-red-600 hover:text-white text-gray-700 px-3 py-1.5 rounded-lg font-medium transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
