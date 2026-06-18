"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/Button";

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive ? "bg-red-50 text-red-700" : "text-zinc-700 hover:bg-zinc-100"
      }`}
    >
      {children}
    </Link>
  );
}

export function Navbar() {
  const { user, organization, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const roleLinks = (() => {
    if (!user) return [];
    if (user.role === "DONOR") {
      return [
        { href: "/dashboard/donor", label: "Dashboard" },
        { href: "/requests", label: "Emergency Requests" },
      ];
    }
    if (user.role === "HOSPITAL" || user.role === "BLOOD_BANK") {
      const links = [
        { href: "/dashboard/organization", label: "Dashboard" },
        { href: "/requests", label: "Requests" },
        { href: "/dashboard/organization/donors", label: "Find Donors" },
      ];
      if (user.role === "BLOOD_BANK") {
        links.splice(2, 0, { href: "/dashboard/organization/inventory", label: "Inventory" });
      }
      return links;
    }
    if (user.role === "ADMIN") {
      return [{ href: "/admin", label: "Admin" }];
    }
    return [];
  })();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-red-600">
          BloodBank Finder
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {roleLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <NotificationBell />
              <span className="text-sm text-zinc-600">{organization?.name ?? user.email}</span>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                Login
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-md p-2 text-zinc-700 md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-zinc-200 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {roleLinks.map((link) => (
              <NavLink key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink href="/notifications" onClick={() => setMenuOpen(false)}>
                  Notifications
                </NavLink>
                <button
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink href="/login" onClick={() => setMenuOpen(false)}>
                  Login
                </NavLink>
                <NavLink href="/register" onClick={() => setMenuOpen(false)}>
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
