"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, PlusCircle, User, Bell, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/create", icon: PlusCircle, label: "New Timeline" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-logo">
        <span>TIMELINES</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">Menu</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive(item.href) ? "active" : ""}`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-item w-full text-left"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
