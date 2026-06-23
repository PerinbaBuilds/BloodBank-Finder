"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  Ambulance,
  Boxes,
  Droplet,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/Button";

function NavLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive ? "bg-red-50 text-red-700" : "text-zinc-700 hover:bg-zinc-100"
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
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
        { href: "/dashboard/donor", label: "Dashboard", icon: LayoutDashboard },
        { href: "/requests", label: "Emergency Requests", icon: AlertCircle },
      ];
    }
    if (user.role === "HOSPITAL" || user.role === "BLOOD_BANK") {
      const links = [
        { href: "/dashboard/organization", label: "Dashboard", icon: LayoutDashboard },
        { href: "/requests", label: "Requests", icon: AlertCircle },
        { href: "/dashboard/organization/donors", label: "Find Donors", icon: Users },
        { href: "/dashboard/organization/ambulances", label: "Ambulances", icon: Ambulance },
      ];
      if (user.role === "BLOOD_BANK") {
        links.splice(2, 0, { href: "/dashboard/organization/inventory", label: "Inventory", icon: Boxes });
      }
      return links;
    }
    if (user.role === "ADMIN") {
      return [{ href: "/admin", label: "Admin", icon: ShieldCheck }];
    }
    return [];
  })();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 shadow-soft backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-soft">
            <Droplet className="h-4 w-4" fill="currentColor" strokeWidth={1.5} />
          </span>
          <span className="text-lg font-bold tracking-tight text-zinc-900">BloodBank Finder</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {roleLinks.map((link) => (
            <NavLink key={link.href} href={link.href} icon={link.icon}>
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
          className="rounded-md p-2 text-zinc-700 transition-colors hover:bg-zinc-100 md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-zinc-200 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {roleLinks.map((link) => (
              <NavLink key={link.href} href={link.href} icon={link.icon} onClick={() => setMenuOpen(false)}>
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
