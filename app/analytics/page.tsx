"use client";

// ANALYTICS PAGE — Shows engagement stats for posted content
// In the future, this could show line charts (Recharts),
// heatmaps for best posting times, etc.

import { useState, useEffect } from "react";

interface AnalyticsData {
  summary: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalReach: number;
  };
  posts: any[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const res = await fetch("/api/analytics");
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading analytics...</div>;

  const summary = data?.summary || {
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalReach: 0,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Track your Instagram engagement</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📸</div>
          <div className="stat-label">Total Posts</div>
          <div className="stat-value">{summary.totalPosts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-label">Total Likes</div>
          <div className="stat-value">{summary.totalLikes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-label">Total Comments</div>
          <div className="stat-value">{summary.totalComments}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👀</div>
          <div className="stat-label">Total Reach</div>
          <div className="stat-value">{summary.totalReach}</div>
        </div>
      </div>

      {data?.posts && data.posts.length > 0 ? (
        <div className="settings-section">
          <h3>Recent Posts Performance</h3>
          {data.posts.slice(0, 10).map((post: any) => (
            <div
              key={post.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div>
                <span className={`card-source ${post.source}`}>
                  {post.source}
                </span>
                <span style={{ marginLeft: "8px", fontSize: "14px" }}>
                  {post.sourceTitle}
                </span>
              </div>
              <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--text-secondary)" }}>
                <span>❤️ {post.analytics?.[0]?.likes || 0}</span>
                <span>💬 {post.analytics?.[0]?.comments || 0}</span>
                <span>👀 {post.analytics?.[0]?.reach || 0}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No analytics yet</div>
          <p>Post content to Instagram to start seeing engagement data.</p>
        </div>
      )}
    </div>
  );
}
