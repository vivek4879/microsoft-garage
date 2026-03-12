"use client";

// SETTINGS PAGE — Configure all API keys, AI model, post frequency
// This is where users set up their integrations
// All settings are stored in the database, not environment variables,
// so they can be changed from the UI without redeploying

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    aiProvider: "openai",
    aiApiKey: "",
    postFrequency: 2,
    telegramChatId: "",
    igAccessToken: "",
    igPageId: "",
    tavilyApiKey: "",
    subreddits: '["funny","AskReddit","mildlyinteresting"]',
    bestPostTimes: "[9,12,18]",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data && !data.error) {
        setSettings({
          aiProvider: data.aiProvider || "openai",
          aiApiKey: data.aiApiKey || "",
          postFrequency: data.postFrequency || 2,
          telegramChatId: data.telegramChatId || "",
          igAccessToken: data.igAccessToken || "",
          igPageId: data.igPageId || "",
          tavilyApiKey: data.tavilyApiKey || "",
          subreddits: data.subreddits || '["funny","AskReddit","mildlyinteresting"]',
          bestPostTimes: data.bestPostTimes || "[9,12,18]",
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage("✅ Settings saved!");
      } else {
        setMessage("❌ Failed to save settings.");
      }
    } catch (error) {
      setMessage("❌ Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Loading settings...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your content pipeline</p>
      </div>

      {/* AI Model Section */}
      <div className="settings-section">
        <h3>🧠 AI Model</h3>
        <div className="form-group">
          <label className="form-label">Provider</label>
          <select
            className="form-select"
            value={settings.aiProvider}
            onChange={(e) =>
              setSettings({ ...settings, aiProvider: e.target.value })
            }
          >
            <option value="openai">OpenAI (GPT-4o Mini)</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="gemini">Google (Gemini 1.5 Flash)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">API Key</label>
          <input
            type="password"
            className="form-input"
            placeholder="Enter your API key..."
            value={settings.aiApiKey}
            onChange={(e) =>
              setSettings({ ...settings, aiApiKey: e.target.value })
            }
          />
        </div>
      </div>

      {/* Content Sources */}
      <div className="settings-section">
        <h3>📡 Content Sources</h3>
        <div className="form-group">
          <label className="form-label">Tavily API Key (for Twitter search)</label>
          <input
            type="password"
            className="form-input"
            placeholder="tvly-..."
            value={settings.tavilyApiKey}
            onChange={(e) =>
              setSettings({ ...settings, tavilyApiKey: e.target.value })
            }
          />
        </div>
        <div className="form-group">
          <label className="form-label">Subreddits (JSON array)</label>
          <input
            type="text"
            className="form-input"
            placeholder='["funny", "AskReddit"]'
            value={settings.subreddits}
            onChange={(e) =>
              setSettings({ ...settings, subreddits: e.target.value })
            }
          />
        </div>
      </div>

      {/* Instagram */}
      <div className="settings-section">
        <h3>📸 Instagram</h3>
        <div className="form-group">
          <label className="form-label">Access Token</label>
          <input
            type="password"
            className="form-input"
            placeholder="Instagram Graph API access token"
            value={settings.igAccessToken}
            onChange={(e) =>
              setSettings({ ...settings, igAccessToken: e.target.value })
            }
          />
        </div>
        <div className="form-group">
          <label className="form-label">Instagram User ID / Page ID</label>
          <input
            type="text"
            className="form-input"
            placeholder="Your IG business account ID"
            value={settings.igPageId}
            onChange={(e) =>
              setSettings({ ...settings, igPageId: e.target.value })
            }
          />
        </div>
      </div>

      {/* Telegram */}
      <div className="settings-section">
        <h3>📱 Telegram Notifications</h3>
        <div className="form-group">
          <label className="form-label">Bot Token / Chat ID</label>
          <input
            type="password"
            className="form-input"
            placeholder="Your Telegram bot token"
            value={settings.telegramChatId}
            onChange={(e) =>
              setSettings({ ...settings, telegramChatId: e.target.value })
            }
          />
        </div>
      </div>

      {/* Scheduling */}
      <div className="settings-section">
        <h3>⏰ Scheduling</h3>
        <div className="form-group">
          <label className="form-label">
            Posts per day: {settings.postFrequency}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={settings.postFrequency}
            onChange={(e) =>
              setSettings({
                ...settings,
                postFrequency: parseInt(e.target.value),
              })
            }
            style={{ width: "100%", accentColor: "var(--accent)" }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            Best posting times (hours, JSON array)
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="[9, 12, 18]"
            value={settings.bestPostTimes}
            onChange={(e) =>
              setSettings({ ...settings, bestPostTimes: e.target.value })
            }
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        className="btn btn-primary btn-lg"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "💾 Save Settings"}
      </button>
      {message && (
        <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>
          {message}
        </p>
      )}
    </div>
  );
}
