"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Plus, Globe, Lock, FileText, MoreHorizontal, Trash2, ExternalLink, Copy, Eye } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface TimelineCard {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  visibility: string;
  status: string;
  updatedAt: string;
  publishedAt: string | null;
  _count?: { nodes: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const [timelines, setTimelines] = useState<TimelineCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchTimelines();
  }, [filter]);

  const fetchTimelines = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/timelines?filter=${filter}`);
      const data = await res.json();
      if (data.success) {
        setTimelines(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch timelines:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this timeline? This cannot be undone.")) return;
    try {
      await fetch(`/api/timelines/${id}`, { method: "DELETE" });
      setTimelines((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
    setMenuOpen(null);
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/t/${slug}`;
    navigator.clipboard.writeText(url);
    setMenuOpen(null);
  };

  const filters: { key: typeof filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Drafts" },
  ];

  return (
    <div className="page-container py-6 md:py-10">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Timelines</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Manage your interactive journeys</p>
        </div>
        <Link href="/create" className="btn-primary">
          <Plus size={18} />
          <span className="hidden sm:inline">New Timeline</span>
          <span className="sm:hidden">New</span>
        </Link>
      </header>

      {/* Filters */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--glass-border)] mb-8 w-fit">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.key
                ? "bg-[var(--bg-elevated)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-44 rounded-xl" />
          ))}
        </div>
      ) : timelines.length === 0 ? (
        <div className="empty-state glass-card mt-6">
          <div className="empty-state-icon">
            <Plus size={28} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {filter === "all" ? "No timelines yet" : `No ${filter} timelines`}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
              Create your first interactive journey and share it with the world.
            </p>
          </div>
          <Link href="/create" className="btn-primary mt-2">
            <Plus size={16} /> Create Timeline
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timelines.map((timeline, i) => (
            <div
              key={timeline.id}
              className="glass-card group relative overflow-hidden transition-transform hover:-translate-y-0.5 animate-fadeIn"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Cover image strip */}
              {timeline.coverUrl ? (
                <div className="h-28 w-full overflow-hidden">
                  <img
                    src={timeline.coverUrl}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-transparent to-[var(--bg-obsidian)]/80" />
                </div>
              ) : (
                <div className="h-20 w-full bg-gradient-to-br from-[var(--accent-cyan)]/8 to-[var(--accent-electric)]/8" />
              )}

              <div className="p-4 pt-3">
                {/* Title + menu */}
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/timeline/${timeline.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[15px] text-white truncate group-hover:text-[var(--accent-cyan)] transition-colors">
                      {timeline.title}
                    </h3>
                    {timeline.description && (
                      <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
                        {timeline.description}
                      </p>
                    )}
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === timeline.id ? null : timeline.id)}
                      className="btn-icon w-8 h-8"
                      aria-label="Timeline options"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {menuOpen === timeline.id && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-0 top-full mt-1 z-40 w-44 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-xl animate-scaleIn">
                          <Link href={`/timeline/${timeline.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]" onClick={() => setMenuOpen(null)}>
                            <FileText size={14} /> Edit
                          </Link>
                          {timeline.status === "PUBLISHED" && (
                            <Link href={`/t/${timeline.slug}`} target="_blank" className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]" onClick={() => setMenuOpen(null)}>
                              <Eye size={14} /> View Public
                            </Link>
                          )}
                          <button onClick={() => handleCopyLink(timeline.slug)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]">
                            <Copy size={14} /> Copy Link
                          </button>
                          <div className="border-t border-[var(--glass-border)] my-1" />
                          <button onClick={() => handleDelete(timeline.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10">
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--glass-border)]">
                  <div className="flex gap-1.5">
                    {timeline.status === "PUBLISHED" ? (
                      <span className="badge badge-green"><Globe size={10} /> Live</span>
                    ) : (
                      <span className="badge badge-amber"><FileText size={10} /> Draft</span>
                    )}
                    {timeline.visibility === "PRIVATE" && (
                      <span className="badge badge-muted"><Lock size={10} /></span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <span>{timeline._count?.nodes || 0} nodes</span>
                    <span>·</span>
                    <span>{formatRelativeTime(timeline.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
