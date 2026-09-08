"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Lock, Sparkles } from "lucide-react";

export default function CreateTimelinePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/timelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), visibility }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to create timeline");
        return;
      }

      router.push(`/timeline/${data.data.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container py-6 md:py-10 flex flex-col min-h-[calc(100dvh-72px)] md:min-h-[100dvh]">
      {/* Header */}
      <header className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="btn-icon" aria-label="Back">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">New Journey</h1>
          <p className="text-xs text-[var(--text-muted)]">Create an interactive timeline</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col max-w-lg">
        {error && (
          <div className="p-3 rounded-lg bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-[var(--accent-red)] text-sm text-center font-medium mb-6">
            {error}
          </div>
        )}

        <div className="space-y-5 flex-1">
          {/* Title */}
          <div>
            <label className="input-label" htmlFor="timeline-title">Title</label>
            <input
              id="timeline-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field text-lg"
              placeholder="e.g. My Hackathon Experience"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="input-label" htmlFor="timeline-desc">Description <span className="text-[var(--text-muted)] normal-case font-normal">(optional)</span></label>
            <textarea
              id="timeline-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="What is this journey about?"
              rows={3}
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="input-label mb-3">Who can view this?</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "PUBLIC", icon: Globe, title: "Public", desc: "Anyone with the link" },
                { value: "PRIVATE", icon: Lock, title: "Private", desc: "Only you can view" },
              ].map(({ value, icon: Icon, title: t, desc }) => (
                <label
                  key={value}
                  className={`glass-card p-4 cursor-pointer transition-all border-2 ${
                    visibility === value
                      ? "border-[var(--accent-cyan)]/50 bg-[var(--accent-cyan)]/5"
                      : "border-transparent hover:border-[var(--glass-border)]"
                  }`}
                >
                  <input type="radio" name="visibility" value={value} checked={visibility === value} onChange={() => setVisibility(value)} className="hidden" />
                  <Icon size={18} className={visibility === value ? "text-[var(--accent-cyan)]" : "text-[var(--text-muted)]"} />
                  <div className="font-semibold text-sm text-white mt-2">{t}</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{desc}</div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8 pt-6 border-t border-[var(--glass-border)]">
          <button
            type="submit"
            className="btn-primary w-full py-3.5 text-[15px]"
            disabled={isLoading || !title.trim()}
          >
            {isLoading ? (
              <span className="spinner" />
            ) : (
              <><Sparkles size={16} /> Start Building</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
