"use client";

import { signIn } from "next-auth/react";
import { Suspense } from "react";

function LoginContent() {
  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Social Pipeline</h1>
        <p className="login-subtitle">
          Your AI-powered social media automation dashboard.
        </p>
        
        <button 
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="btn btn-primary login-btn"
        >
          <span className="btn-icon">📦</span>
          Login with GitHub
        </button>
        
        <p className="login-footer">
          Each account manages its own separate API keys and content.
        </p>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--bg-dark);
        }
        .login-card {
          background: var(--bg-card);
          padding: 40px;
          border-radius: 16px;
          border: 1px solid var(--border);
          text-align: center;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .login-title {
          font-size: 2rem;
          margin-bottom: 8px;
          background: linear-gradient(to right, #60a5fa, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .login-subtitle {
          color: var(--text-muted);
          margin-bottom: 32px;
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .login-footer {
          margin-top: 24px;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
