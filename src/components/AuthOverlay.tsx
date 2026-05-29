import React, { useState } from "react";
import { AuthUser } from "../types";
import { Lock, Mail, User, Shield, CheckCircle } from "lucide-react";

interface AuthOverlayProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
}

export default function AuthOverlay({ onLoginSuccess }: AuthOverlayProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("jitenmoni8@gmail.com");
  const [username, setUsername] = useState("swanjiten");
  const [password, setPassword] = useState("password");
  const [role, setRole] = useState<"Admin" | "Researcher" | "User">("User");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister 
      ? { email, username, password, role }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication procedure failed.");
      }

      if (isRegister) {
        setMessage("Account registered successfully! Please log in.");
        setIsRegister(false);
      } else {
        onLoginSuccess(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.message || "Network credentials authentication failure.");
    } finally {
      setLoading(false);
    }
  };

  const loadPresetUser = (presetEmail: string, presetRole: "Admin" | "Researcher" | "User", presetUser: string) => {
    setEmail(presetEmail);
    setUsername(presetUser);
    setPassword("password");
    setRole(presetRole);
    setIsRegister(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-950 p-6 border-b border-slate-800 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-full border border-indigo-500/30 text-indigo-400 mb-3">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight font-sans">
            LiftOps SWAN
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Service for Web-based Analysis & Fitness Science
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded font-mono">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded font-mono flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {message}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-slate-350 text-xs font-mono mb-1">UNIX User Alias</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-250 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="swanjiten"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-350 text-xs font-mono mb-1">Email Coordinates</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-250 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="alice@cern.ch"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-350 text-xs font-mono mb-1">Credentials token</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-250 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="••••••••"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-slate-350 text-xs font-mono mb-1">System Security Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-250 text-sm focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="User">User (Standard Researcher Access)</option>
                <option value="Researcher">Researcher (High Performance Analytics)</option>
                <option value="Admin">Admin (Cloud Infrastructure DevOps)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-slate-50 font-semibold rounded text-sm transition-colors duration-150 shadow-lg font-mono"
          >
            {loading ? "Authenticating node..." : isRegister ? "Register Credentials" : "Initialize SWAN Terminal"}
          </button>

          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-xs text-indigo-400 hover:underline font-mono"
            >
              {isRegister ? "Already registered? Connect session" : "Request new cluster access credentials"}
            </button>
          </div>
        </form>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800/80">
          <p className="text-2xs text-slate-500 font-mono text-center uppercase tracking-wider mb-2">
            Democratized Sandbox Environments (Quick Presets)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => loadPresetUser("jitenmoni8@gmail.com", "User", "swanjiten")}
              className="px-2 py-1 text-4xs bg-slate-900 border border-slate-800 hover:border-slate-700 rounded text-slate-300 font-mono text-center truncate"
            >
              👤 Jiten (User)
            </button>
            <button
              onClick={() => loadPresetUser("research@liftops.io", "Researcher", "swanresearch")}
              className="px-2 py-1 text-4xs bg-slate-900 border border-indigo-905 hover:bg-slate-800 rounded text-indigo-300 font-mono text-center truncate"
            >
              🔬 CERN (Research)
            </button>
            <button
              onClick={() => loadPresetUser("admin@liftops.io", "Admin", "swanadmin")}
              className="px-2 py-1 text-4xs bg-emerald-950/40 border border-emerald-900 hover:bg-slate-800 rounded text-emerald-300 font-mono text-center truncate"
            >
              ⚙️ Cloud Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
