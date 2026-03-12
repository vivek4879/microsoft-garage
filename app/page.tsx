"use client";

// HOME PAGE — Dashboard overview with stats and quick actions
// "use client" tells Next.js this component runs in the browser
// (not server) because we need useState, useEffect, onClick handlers

import { useState, useEffect } from "react";

export default function HomePage() {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    posted: 0,
    rejected: 0,
  });
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch stats on page load
  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/queue");
      const posts = await res.json();
      if (Array.isArray(posts)) {
        setStats({
          pending: posts.filter((p: any) => p.status === "pending").length,
          approved: posts.filter((p: any) => p.status === "approved").length,
          posted: 0,
          rejected: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }

  async function handleDiscover() {
    setIsDiscovering(true);
    setMessage("");
    try {
      const res = await fetch("/api/discover", { method: "POST" });
      const data = await res.json();
      setMessage(
        `🎉 Found ${data.discovered} new posts, ${data.curated} curated!`
      );
      fetchStats(); // refresh stats
    } catch (error) {
      setMessage("❌ Discovery failed. Check your settings.");
    } finally {
      setIsDiscovering(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Your AI-powered social media content pipeline
        </p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-label">Pending Review</div>
          <div className="stat-value">{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Approved</div>
          <div className="stat-value">{stats.approved}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📸</div>
          <div className="stat-label">Posted</div>
          <div className="stat-value">{stats.posted}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{stats.rejected}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="settings-section">
        <h3>Quick Actions</h3>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleDiscover}
          disabled={isDiscovering}
        >
          {isDiscovering ? "🔍 Discovering..." : "🚀 Trigger Discovery"}
        </button>
        {message && (
          <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
