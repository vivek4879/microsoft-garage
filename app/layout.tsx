import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Social Agent — AI Content Pipeline",
  description: "Discover, curate, and post viral content to Instagram",
};

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/queue", label: "Queue", icon: "📋" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          {/* Sidebar — always visible */}
          <aside className="sidebar">
            <div className="sidebar-header">
              <h1 className="sidebar-title">🤖 Social Agent</h1>
              <p className="sidebar-subtitle">AI Content Pipeline</p>
            </div>
            <nav className="sidebar-nav">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="nav-link">
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content — changes per page */}
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
