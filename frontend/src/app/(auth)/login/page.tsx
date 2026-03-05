"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Erreur de connexion.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="login-header">
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="url(#grad)" />
              <path d="M12 14h16M12 20h12M12 26h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>DocPilot AI</h1>
          <p>Connectez-vous à votre espace</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5h2v4H7V5zm0 5h2v2H7v-2z" />
              </svg>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="btn-loading">
                <svg className="spinner" width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="32" strokeLinecap="round" />
                </svg>
                Connexion...
              </span>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        {/* Demo hint */}
        <div className="login-demo">
          <p>
            Compte démo : <code>admin@docpilot.dev</code> / <code>admin123456</code>
          </p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
          padding: 1rem;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(30, 27, 75, 0.5);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .login-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 0.25rem;
        }

        .login-header p {
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 0.875rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-group input {
          padding: 0.75rem 1rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 10px;
          color: #e2e8f0;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input::placeholder {
          color: #475569;
        }

        .form-group input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .login-btn {
          width: 100%;
          padding: 0.85rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          margin-top: 0.5rem;
        }

        .login-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-demo {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
          text-align: center;
        }

        .login-demo p {
          color: #64748b;
          font-size: 0.8rem;
        }

        .login-demo code {
          background: rgba(99, 102, 241, 0.1);
          color: #a5b4fc;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}
