"use client";

// CALENDAR PAGE — Shows scheduled posts in a simple timeline view
// A full calendar (react-big-calendar) can be added later,
// but this gives a clean view of what's coming up

import { useState, useEffect } from "react";

interface Post {
  id: string;
  source: string;
  sourceTitle: string;
  caption: string | null;
  status: string;
  scheduledAt: string | null;
}

export default function CalendarPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduled();
  }, []);

  async function fetchScheduled() {
    try {
      const res = await fetch("/api/queue");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Only show posts with a scheduled date, sorted by time
        const scheduled = data
          .filter((p: Post) => p.scheduledAt && p.status === "approved")
          .sort(
            (a: Post, b: Post) =>
              new Date(a.scheduledAt!).getTime() -
              new Date(b.scheduledAt!).getTime()
          );
        setPosts(scheduled);
      }
    } catch (error) {
      console.error("Failed to fetch scheduled posts:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading calendar...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Schedule</h1>
        <p className="page-subtitle">Upcoming posts in your pipeline</p>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">No scheduled posts</div>
          <p>Approve posts from the Queue to see them here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {posts.map((post) => (
            <div key={post.id} className="settings-section" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  minWidth: "80px",
                  textAlign: "center",
                  padding: "8px",
                  background: "var(--bg-primary)",
                  borderRadius: "8px",
                }}
              >
                <div style={{ fontSize: "22px", fontWeight: 700 }}>
                  {new Date(post.scheduledAt!).getDate()}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  {new Date(post.scheduledAt!).toLocaleString("default", {
                    month: "short",
                  })}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {new Date(post.scheduledAt!).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <span className={`card-source ${post.source}`}>
                  {post.source}
                </span>
                <h3 className="card-title" style={{ marginTop: "4px" }}>
                  {post.sourceTitle}
                </h3>
                {post.caption && (
                  <p className="card-caption" style={{ marginBottom: 0 }}>
                    {post.caption}
                  </p>
                )}
              </div>

              <span className="badge badge-approved">Scheduled</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
