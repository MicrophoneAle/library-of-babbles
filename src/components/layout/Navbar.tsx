"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/lobby", label: "Lobby" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/books", label: "Books" }
];

export default function Navbar() {
  const pathname = usePathname();
  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-brass/30 bg-walnut/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/lobby" className="font-semibold tracking-wide text-parchment">
          Library of Babbles
        </Link>
        <ul className="flex gap-4 text-sm text-parchment/90">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link className="hover:text-ember transition-colors" href={item.href}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
