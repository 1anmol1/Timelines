"use client";

import { useState, useEffect, useRef, use } from "react";
import { Lock, CheckCircle2, Play, ChevronDown, Globe, Share2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TimelineNode {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isLocked: boolean;
  blocks: { id: string; type: string; position: number; content: string }[];
}

interface ViewerNodeState {
  nodeId: string;
  isCompleted: boolean;
  isUnlocked: boolean;
  unlockMessage?: string;
}

interface ViewerState {
  currentNodeId: string | null;
  completedNodeIds: string[];
  completionPercentage: number;
  nodeStates: ViewerNodeState[];
}

interface TimelineData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  visibility: string;
  owner: { name: string };
  nodes: TimelineNode[];
  viewerState: ViewerState | null;
}

export default function PublicViewerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [viewerState, setViewerState] = useState<ViewerState | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sid = localStorage.getItem("timelines_viewer_session");
    if (!sid) {
      sid = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("timelines_viewer_session", sid);
    }
    setSessionId(sid);
    fetchTimeline(sid);
  }, [slug]);

  useEffect(() => {
    if (activeRef.current && !isLoading) {
      setTimeout(() => {
        activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    }
  }, [isLoading, viewerState?.currentNodeId]);

  const fetchTimeline = async (sid: string) => {
    try {
      const res = await fetch(`/api/public/timelines/${slug}?sessionId=${sid}`);
      const data = await res.json();
      if (data.success) {
        setTimeline(data.data);
        setViewerState(data.data.viewerState);
        // Auto-expand the current active node
        if (data.data.viewerState?.currentNodeId) {
          setExpandedNodeId(data.data.viewerState.currentNodeId);
        } else if (data.data.nodes?.length > 0) {
          setExpandedNodeId(data.data.nodes[0].id);
        }
      } else {
        setError(data.error || "Timeline not found");
      }
    } catch {
      setError("Failed to load timeline");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteNode = async (nodeId: string) => {
    try {
      const res = await fetch(`/api/public/timelines/${slug}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", nodeId, sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        setViewerState(data.data);
        // Expand next node
        const currentNode = timeline?.nodes.find((n) => n.id === nodeId);
        if (currentNode) {
          const nextNode = timeline?.nodes.find((n) => n.position === currentNode.position + 1);
          if (nextNode) setExpandedNodeId(nextNode.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: timeline?.title, text: timeline?.description || "", url });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--bg-obsidian)]">
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--bg-obsidian)] px-6">
        <div className="glass-card-elevated p-8 text-center max-w-sm w-full">
          <Lock className="mx-auto mb-4 text-[var(--text-muted)]" size={40} />
          <h2 className="text-xl font-bold mb-2">Unavailable</h2>
          <p className="text-sm text-[var(--text-secondary)]">{error || "This timeline doesn't exist or is private."}</p>
          <Link href="/" className="btn-secondary mt-6 inline-flex">Go Home</Link>
        </div>
      </div>
    );
  }

  const completionPct = viewerState?.completionPercentage ?? 0;
  const completedCount = viewerState?.completedNodeIds?.length ?? 0;
  const totalNodes = timeline.nodes.length;

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-obsidian)] relative overflow-x-hidden selection:bg-[var(--accent-cyan)]/25">
      {/* Ambient background glows */}
      <div className="fixed top-[-15%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--accent-blue)]/6 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--accent-cyan)]/6 blur-[120px] pointer-events-none" />

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[var(--bg-obsidian)]/80 backdrop-blur-lg border-b border-[var(--glass-border)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="btn-icon" aria-label="Home"><ArrowLeft size={20} /></Link>
          <div className="text-center min-w-0 px-4">
            <h1 className="text-sm font-semibold truncate">{timeline.title}</h1>
            <p className="text-[10px] text-[var(--text-muted)]">by {timeline.owner.name}</p>
          </div>
          <button onClick={handleShare} className="btn-icon" aria-label="Share">
            <Share2 size={18} />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 relative z-10">
        {/* Hero */}
        <section className="pt-10 pb-12 text-center animate-slideUp">
          {timeline.coverUrl && (
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-2xl overflow-hidden mb-6 ring-1 ring-white/10 shadow-xl">
              <img src={timeline.coverUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-3">
            {timeline.title}
          </h1>
          {timeline.description && (
            <p className="text-sm md:text-base text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
              {timeline.description}
            </p>
          )}

          {/* Progress indicator */}
          <div className="inline-flex items-center gap-3 mt-8 px-4 py-2.5 rounded-full glass-card">
            <div className="w-20 h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-electric)] rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[var(--text-secondary)] tabular-nums">
              {completedCount} of {totalNodes} · {completionPct}%
            </span>
          </div>
        </section>

        {/* Timeline */}
        <div className="relative pb-32">
          {/* Thread */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 timeline-thread z-0" />

          <div className="space-y-3 relative z-10">
            {timeline.nodes.map((node, index) => {
              const state = viewerState?.nodeStates.find((s) => s.nodeId === node.id);
              const isCompleted = state?.isCompleted || false;
              const isUnlocked = state?.isUnlocked ?? !node.isLocked;
              const isLocked = !isUnlocked;
              const isExpanded = expandedNodeId === node.id;
              const isActive = viewerState?.currentNodeId === node.id || (index === 0 && !viewerState?.currentNodeId);

              return (
                <div key={node.id} ref={isActive ? activeRef : null} className="relative flex items-start gap-4 md:gap-5 pl-2 md:pl-4 animate-fadeIn" style={{ animationDelay: `${index * 80}ms` }}>
                  {/* Status dot */}
                  <div className={`mt-5 flex-shrink-0 z-20 w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center transition-all duration-500
                    ${isCompleted ? "bg-[var(--accent-green)] shadow-[0_0_12px_rgba(16,185,129,0.3)]" :
                      isActive && !isLocked ? "bg-[var(--accent-neon)] shadow-[0_0_16px_rgba(0,240,255,0.5)] ring-2 ring-[var(--bg-obsidian)]" :
                      isLocked ? "bg-[var(--bg-elevated)] border border-white/10" :
                      "bg-[var(--accent-cyan)]/60"}
                  `}>
                    {isCompleted && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                    {isLocked && <Lock size={10} className="text-[var(--text-muted)]" />}
                    {isActive && !isLocked && !isCompleted && <div className="w-2.5 h-2.5 bg-[var(--bg-obsidian)] rounded-full" />}
                  </div>

                  {/* Content card */}
                  <div className="flex-1 min-w-0">
                    {isLocked ? (
                      /* ── Locked Card ── */
                      <div className="glass-card p-5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/60" />
                        <div className="relative z-10 text-center py-4">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                            <Lock size={16} className="text-white/40" />
                          </div>
                          <h3 className="font-semibold text-white/60 text-sm">Chapter Locked</h3>
                          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[200px] mx-auto">
                            {state?.unlockMessage || "Complete previous chapters to unlock"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* ── Unlocked Card ── */
                      <div
                        className={`glass-card overflow-hidden transition-all duration-300 cursor-pointer ${
                          isExpanded ? "ring-1 ring-white/8" : ""
                        }`}
                        onClick={() => setExpandedNodeId(isExpanded ? null : node.id)}
                      >
                        {/* Header (always visible) */}
                        <div className="p-4 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)]">
                              Chapter {index + 1}
                            </span>
                            <h3 className={`font-bold mt-0.5 ${isExpanded ? "text-lg text-white" : "text-[15px] text-[var(--text-primary)]"}`}>
                              {node.title}
                            </h3>
                            {!isExpanded && node.description && (
                              <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">{node.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                            {isCompleted && (
                              <span className="badge badge-green text-[9px]">Done</span>
                            )}
                            <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </div>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="px-4 pb-5 space-y-4 animate-fadeIn">
                            {node.description && (
                              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{node.description}</p>
                            )}

                            {/* Render blocks */}
                            {node.blocks.map((block) => {
                              let content: Record<string, string | number> = {};
                              try { content = JSON.parse(block.content); } catch { /* empty */ }

                              return (
                                <div key={block.id}>
                                  {block.type === "TEXT" && content.text && (
                                    <div className="text-sm text-[var(--text-primary)] leading-relaxed">
                                      <p>{String(content.text)}</p>
                                    </div>
                                  )}

                                  {block.type === "IMAGE" && content.url && (
                                    <div className="rounded-xl overflow-hidden border border-white/5">
                                      <img src={String(content.url)} alt={String(content.caption || "")} className="w-full h-auto" loading="lazy" />
                                      {content.caption && (
                                        <div className="p-2 text-xs text-center text-[var(--text-muted)] bg-black/30">
                                          {String(content.caption)}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {block.type === "VIDEO" && content.url && (
                                    <div className="rounded-xl overflow-hidden bg-black aspect-video relative border border-white/5">
                                      {(String(content.url).includes("youtube.com") || String(content.url).includes("youtu.be")) ? (
                                        <iframe
                                          className="absolute inset-0 w-full h-full"
                                          src={`https://www.youtube.com/embed/${
                                            String(content.url).includes("v=")
                                              ? String(content.url).split("v=")[1]?.split("&")[0]
                                              : String(content.url).split("youtu.be/")[1]
                                          }`}
                                          title="Video"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                        />
                                      ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center">
                                            <Play size={24} className="text-white ml-1" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {block.type === "LINK" && content.url && (
                                    <a
                                      href={String(content.url)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--glass-border)] hover:bg-[var(--bg-hover)] transition-colors"
                                    >
                                      <div className="w-9 h-9 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0">
                                        <Globe size={16} className="text-[var(--text-muted)]" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-sm font-medium text-white truncate">{String(content.title || content.url)}</div>
                                        <div className="text-[11px] text-[var(--text-muted)] truncate">{String(content.url)}</div>
                                      </div>
                                    </a>
                                  )}
                                </div>
                              );
                            })}

                            {/* Complete button */}
                            {isActive && !isCompleted && (
                              <div className="pt-4">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCompleteNode(node.id); }}
                                  className="btn-primary w-full py-3"
                                >
                                  Continue Journey <ChevronDown size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion state */}
          {completionPct === 100 && (
            <div className="text-center mt-16 animate-slideUp">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--accent-cyan)] to-[var(--accent-electric)] flex items-center justify-center mx-auto mb-4 shadow-[var(--glow-strong)]">
                <CheckCircle2 size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Journey Complete</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                You&apos;ve reached the end of {timeline.title}
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={handleShare} className="btn-secondary"><Share2 size={14} /> Share</button>
                <Link href="/" className="btn-ghost">Create yours</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
