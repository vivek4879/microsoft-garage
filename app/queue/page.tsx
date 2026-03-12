"use client";

// QUEUE PAGE — Shows all discovered content awaiting review
// Each post is a card with screenshot, source badge, AI score,
// caption, and Approve/Reject buttons

import { useState, useEffect } from "react";

interface Post {
  id: string;
  source: string;
  sourceUrl: string;
  sourceTitle: string;
  screenshotUrl: string | null;
  caption: string | null;
  aiScore: number | null;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
}

export default function QueuePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  async function fetchQueue() {
    try {
      const res = await fetch("/api/queue");
      const data = await res.json();
      if (Array.isArray(data)) {
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch queue:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await fetch(`/api/posts/${id}/approve`, { method: "POST" });
      // Update local state — change status without refetching
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p))
      );
    } catch (error) {
      console.error("Approve failed:", error);
    }
  }

  async function handleReject(id: string) {
    try {
      await fetch(`/api/posts/${id}/reject`, { method: "POST" });
      // Remove from the list
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Reject failed:", error);
    }
  }

  if (loading) {
    return <div className="loading">Loading queue...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Content Queue</h1>
        <p className="page-subtitle">
          Review and approve content for Instagram
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">No content in queue</div>
          <p>Trigger a discovery from the Home page to find content.</p>
        </div>
      ) : (
        <div className="queue-grid">
          {posts.map((post) => (
            <div key={post.id} className="content-card">
              {/* Screenshot preview */}
              {post.screenshotUrl ? (
                <img
                  src={post.screenshotUrl}
                  alt={post.sourceTitle}
                  className="card-image"
                />
              ) : (
                <div
                  className="card-image"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                  }}
                >
                  📷
                </div>
              )}

              <div className="card-body">
                {/* Source badge */}
                <span className={`card-source ${post.source}`}>
                  {post.source}
                </span>

                {/* Status badge */}
                <span
                  className={`badge badge-${post.status}`}
                  style={{ marginLeft: "8px" }}
                >
                  {post.status}
                </span>

                {/* Title */}
                <h3 className="card-title">{post.sourceTitle}</h3>

                {/* AI Score */}
                {post.aiScore !== null && (
                  <div className="card-score">
                    ⭐ AI Score: {post.aiScore}/10
                  </div>
                )}

                {/* Caption preview */}
                {post.caption && (
                  <p className="card-caption">{post.caption}</p>
                )}

                {/* Actions */}
                {post.status === "pending" && (
                  <div className="card-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(post.id)}
                    >
                      ✅ Approve
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(post.id)}
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}

                {post.status === "approved" && post.scheduledAt && (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    📅 Scheduled:{" "}
                    {new Date(post.scheduledAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
