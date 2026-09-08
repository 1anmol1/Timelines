"use client";

import { useSession, signOut } from "next-auth/react";
import { User, LogOut, Mail, Calendar } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();

  return (
    <div className="page-container py-6 md:py-10">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Your account details</p>
      </header>

      <div className="glass-card-elevated p-6 md:p-8 max-w-lg">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--glass-border)]">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent-cyan)]/20 to-[var(--accent-electric)]/20 flex items-center justify-center border border-[var(--glass-border)]">
            <User size={28} className="text-[var(--accent-cyan)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{session?.user?.name || "User"}</h2>
            <p className="text-sm text-[var(--text-muted)]">{session?.user?.email || ""}</p>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-secondary)]">{session?.user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar size={16} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-secondary)]">Member since recently</span>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-danger w-full"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
