"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Lock, Unlock, Globe, Copy, Play, X, Trash2,
  GripVertical, FileText, Image, Video, Link2, Type, ChevronRight, Share2, Check
} from "lucide-react";
import type { NodeWithBlocks } from "@/types";

interface TimelineData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  visibility: string;
  status: string;
  nodes: NodeWithBlocks[];
  _count?: { nodes: number };
}

export default function TimelineEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [nodes, setNodes] = useState<NodeWithBlocks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      const res = await fetch(`/api/timelines/${id}`);
      const data = await res.json();
      if (data.success) {
        setTimeline(data.data);
        setNodes(data.data.nodes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNode = async () => {
    try {
      const res = await fetch(`/api/timelines/${id}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Chapter ${nodes.length + 1}` }),
      });
      const data = await res.json();
      if (data.success) {
        setNodes([...nodes, data.data]);
        setEditingNodeId(data.data.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    try {
      await fetch(`/api/nodes/${nodeId}`, { method: "DELETE" });
      setNodes(nodes.filter((n) => n.id !== nodeId));
      if (editingNodeId === nodeId) setEditingNodeId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublish = async () => {
    if (!timeline) return;
    const isPublished = timeline.status === "PUBLISHED";
    try {
      const res = await fetch(`/api/timelines/${id}/publish`, {
        method: isPublished ? "DELETE" : "POST",
      });
      if (res.ok) fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    if (!timeline) return;
    navigator.clipboard.writeText(`${window.location.origin}/t/${timeline.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateNode = async (nodeId: string, data: Record<string, unknown>) => {
    try {
      await fetch(`/api/nodes/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBlock = async (nodeId: string, type: string) => {
    const defaultContent: Record<string, string> = {
      TEXT: JSON.stringify({ text: "Your content here...", format: "plain" }),
      IMAGE: JSON.stringify({ url: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=800", caption: "" }),
      VIDEO: JSON.stringify({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }),
      LINK: JSON.stringify({ url: "https://example.com", title: "Example Link" }),
    };
    try {
      await fetch(`/api/nodes/${nodeId}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content: defaultContent[type] || "{}" }),
      });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await fetch(`/api/blocks/${blockId}`, { method: "DELETE" });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetLock = async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const prevNode = nodes.find((n) => n.position === node.position - 1);
    if (!prevNode) {
      alert("Cannot lock the first chapter.");
      return;
    }
    try {
      await fetch(`/api/nodes/${nodeId}/unlock-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PREVIOUS_COMPLETED",
          config: JSON.stringify({ sourceNodeId: prevNode.id }),
        }),
      });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveLock = async (nodeId: string) => {
    try {
      await fetch(`/api/nodes/${nodeId}/unlock-rules`, { method: "DELETE" });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[100dvh]">
        <div className="spinner" />
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[100dvh] gap-4">
        <p className="text-[var(--text-muted)]">Timeline not found</p>
        <Link href="/dashboard" className="btn-secondary">Go to Dashboard</Link>
      </div>
    );
  }

  const editingNode = editingNodeId ? nodes.find((n) => n.id === editingNodeId) : null;

  return (
    <div className="min-h-[100dvh] pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--glass-border)] bg-[var(--bg-obsidian)]/85 backdrop-blur-lg">
        <div className="page-container flex items-center justify-between py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="btn-icon" aria-label="Back to dashboard">
              <ArrowLeft size={20} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate">{timeline.title}</h1>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span className={timeline.status === "PUBLISHED" ? "text-[var(--accent-green)]" : "text-[var(--accent-amber)]"}>
                  {timeline.status === "PUBLISHED" ? "Published" : "Draft"}
                </span>
                <span>·</span>
                <span>{nodes.length} {nodes.length === 1 ? "chapter" : "chapters"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {timeline.status === "PUBLISHED" && (
              <>
                <button onClick={handleCopyLink} className="btn-icon" aria-label="Copy link" title="Copy link">
                  {copied ? <Check size={18} className="text-[var(--accent-green)]" /> : <Copy size={18} />}
                </button>
                <Link href={`/t/${timeline.slug}`} target="_blank" className="btn-secondary px-3 py-1.5 min-h-0 text-sm">
                  <Play size={14} /> <span className="hidden sm:inline">Preview</span>
                </Link>
              </>
            )}
            <button onClick={handlePublish} className="btn-primary px-3 py-1.5 min-h-0 text-sm">
              {timeline.status === "PUBLISHED" ? "Unpublish" : "Publish"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="page-container pt-8 flex gap-8">

        {/* Timeline Column */}
        <div className="flex-1 relative">
          {/* Thread */}
          {nodes.length > 0 && (
            <div className="absolute left-5 md:left-6 top-2 bottom-2 timeline-thread z-0" />
          )}

          <div className="space-y-4 relative z-10">
            {nodes.map((node, index) => (
              <div key={node.id} className="relative flex items-start gap-3 md:gap-4 group">
                {/* Dot */}
                <div className={`mt-5 node-dot ${editingNodeId === node.id ? "active" : node.isLocked ? "locked" : ""}`} />

                {/* Card */}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => setEditingNodeId(editingNodeId === node.id ? null : node.id)}
                    className={`w-full text-left glass-card p-4 transition-all ${
                      editingNodeId === node.id
                        ? "ring-1 ring-[var(--accent-cyan)]/60 shadow-[0_0_20px_rgba(0,212,255,0.08)]"
                        : "hover:border-[rgba(255,255,255,0.12)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-widest uppercase">
                            Ch. {index + 1}
                          </span>
                          {node.isLocked && <Lock size={12} className="text-[var(--accent-amber)]" />}
                        </div>
                        <h3 className="font-semibold text-white mt-1 truncate">{node.title}</h3>
                        {node.description && (
                          <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">{node.description}</p>
                        )}
                      </div>
                      <ChevronRight
                        size={16}
                        className={`text-[var(--text-muted)] flex-shrink-0 transition-transform ${
                          editingNodeId === node.id ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                    <div className="flex gap-1.5 mt-3">
                      {node.blocks?.map((block) => (
                        <span key={block.id} className="badge badge-muted text-[9px]">{block.type}</span>
                      ))}
                      {(!node.blocks || node.blocks.length === 0) && (
                        <span className="text-[11px] text-[var(--text-muted)] italic">No content yet</span>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            ))}

            {/* Add Node */}
            <div className="flex items-center gap-3 md:gap-4 pl-1">
              <button
                onClick={handleAddNode}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-dashed border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/40 transition-all z-10"
                aria-label="Add new chapter"
              >
                <Plus size={20} />
              </button>
              <span className="text-sm text-[var(--text-muted)]">Add chapter</span>
            </div>
          </div>
        </div>

        {/* Inline Editor Panel — desktop only */}
        {editingNode && (
          <div className="hidden lg:block w-[380px] flex-shrink-0 sticky top-20 self-start">
            <NodeEditorPanel
              node={editingNode}
              nodes={nodes}
              onClose={() => { setEditingNodeId(null); }}
              onUpdate={(data) => handleUpdateNode(editingNode.id, data)}
              onAddBlock={(type) => handleAddBlock(editingNode.id, type)}
              onDeleteBlock={handleDeleteBlock}
              onSetLock={() => handleSetLock(editingNode.id)}
              onRemoveLock={() => handleRemoveLock(editingNode.id)}
              onDelete={() => handleDeleteNode(editingNode.id)}
            />
          </div>
        )}
      </div>

      {/* Mobile Editor Modal */}
      {editingNode && (
        <div className="lg:hidden modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setEditingNodeId(null); } }}>
          <div className="modal-content p-0">
            <NodeEditorPanel
              node={editingNode}
              nodes={nodes}
              onClose={() => { setEditingNodeId(null); }}
              onUpdate={(data) => handleUpdateNode(editingNode.id, data)}
              onAddBlock={(type) => handleAddBlock(editingNode.id, type)}
              onDeleteBlock={handleDeleteBlock}
              onSetLock={() => handleSetLock(editingNode.id)}
              onRemoveLock={() => handleRemoveLock(editingNode.id)}
              onDelete={() => handleDeleteNode(editingNode.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Node Editor Panel Component ────────────────────────────────────────── */

function NodeEditorPanel({
  node,
  nodes,
  onClose,
  onUpdate,
  onAddBlock,
  onDeleteBlock,
  onSetLock,
  onRemoveLock,
  onDelete,
}: {
  node: NodeWithBlocks;
  nodes: NodeWithBlocks[];
  onClose: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  onAddBlock: (type: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onSetLock: () => void;
  onRemoveLock: () => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(node.title);
  const [description, setDescription] = useState(node.description || "");

  useEffect(() => {
    setTitle(node.title);
    setDescription(node.description || "");
  }, [node.id, node.title, node.description]);

  const blockTypes = [
    { type: "TEXT", icon: Type, label: "Text" },
    { type: "IMAGE", icon: Image, label: "Image" },
    { type: "VIDEO", icon: Video, label: "Video" },
    { type: "LINK", icon: Link2, label: "Link" },
  ];

  return (
    <div className="glass-card-elevated p-5 max-h-[80dvh] lg:max-h-[calc(100dvh-120px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold">Edit Chapter</h2>
        <button onClick={onClose} className="btn-icon w-8 h-8" aria-label="Close editor">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="input-label">Title</label>
          <input
            type="text"
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { if (title !== node.title) onUpdate({ title }); }}
          />
        </div>

        {/* Description */}
        <div>
          <label className="input-label">Description</label>
          <textarea
            className="input-field min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => { if (description !== (node.description || "")) onUpdate({ description: description || null }); }}
            placeholder="Optional chapter description..."
          />
        </div>

        {/* Content Blocks */}
        <div>
          <label className="input-label mb-2">Content Blocks</label>

          {/* Existing blocks */}
          <div className="space-y-2 mb-3">
            {node.blocks?.map((block) => {
              let preview = "";
              try {
                const c = JSON.parse(block.content);
                if (block.type === "TEXT") preview = c.text?.substring(0, 60) || "";
                else if (block.type === "IMAGE") preview = c.caption || "Image";
                else if (block.type === "VIDEO") preview = c.url?.substring(0, 40) || "Video";
                else if (block.type === "LINK") preview = c.title || c.url || "Link";
              } catch { preview = ""; }

              return (
                <div key={block.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--glass-border)]">
                  <GripVertical size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--text-muted)]">{block.type}</span>
                    {preview && <p className="text-xs text-[var(--text-secondary)] truncate">{preview}</p>}
                  </div>
                  <button onClick={() => onDeleteBlock(block.id)} className="btn-icon w-7 h-7 text-[var(--accent-red)]/60 hover:text-[var(--accent-red)]">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add block buttons */}
          <div className="flex flex-wrap gap-2">
            {blockTypes.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => onAddBlock(type)}
                className="btn-secondary py-2 px-3 text-xs min-h-0"
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Lock Settings */}
        <div className="pt-4 border-t border-[var(--glass-border)]">
          <label className="input-label mb-2">Lock Settings</label>
          {!node.isLocked ? (
            <button onClick={onSetLock} className="btn-secondary w-full">
              <Lock size={14} /> Lock this chapter
            </button>
          ) : (
            <div className="p-3 rounded-lg bg-[var(--accent-amber)]/5 border border-[var(--accent-amber)]/15">
              <div className="flex items-center gap-2 text-[var(--accent-amber)] font-semibold text-sm mb-1">
                <Lock size={14} /> Chapter is Locked
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                Viewers must complete the previous chapter to unlock this one.
              </p>
              <button onClick={onRemoveLock} className="btn-ghost text-xs text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 w-full">
                <Unlock size={12} /> Remove Lock
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-[var(--glass-border)]">
          <button onClick={onDelete} className="btn-danger w-full text-sm">
            <Trash2 size={14} /> Delete Chapter
          </button>
        </div>
      </div>
    </div>
  );
}
