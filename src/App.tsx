import React, { useState, useEffect } from "react";
import { AuthUser } from "./types";
import AuthOverlay from "./components/AuthOverlay";
import WorkoutAnalytics from "./components/WorkoutAnalytics";
import NotebookHub from "./components/NotebookHub";
import ContainerPods from "./components/ContainerPods";
import CloudInfrastructure from "./components/CloudInfrastructure";
import GitWorkflow from "./components/GitWorkflow";
import TelemetryDashboard from "./components/TelemetryDashboard";

import { Dumbbell, Code, Cpu, Cloud, Github, Radio, Shield, LogOut, Terminal, Layers, BadgeAlert } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");
  const [currentTab, setCurrentTab] = useState<"workout" | "notebook" | "container" | "cloud" | "git" | "telemetry">("workout");
  const [utcTime, setUtcTime] = useState("");

  // Periodically synchronizing clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Restore session
  useEffect(() => {
    const cachedUser = localStorage.getItem("swan_user");
    const cachedToken = localStorage.getItem("swan_token");
    if (cachedUser && cachedToken) {
      try {
        setUser(JSON.parse(cachedUser));
        setToken(cachedToken);
      } catch (err) {
        localStorage.removeItem("swan_user");
        localStorage.removeItem("swan_token");
      }
    }
  }, []);

  const handleLoginSuccess = (incomingUser: AuthUser, incomingToken: string) => {
    setUser(incomingUser);
    setToken(incomingToken);
    localStorage.setItem("swan_user", JSON.stringify(incomingUser));
    localStorage.setItem("swan_token", incomingToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("swan_user");
    localStorage.removeItem("swan_token");
  };

  // Nav items based on role clearances
  const hasClearance = (requiredRole: "Admin" | "Researcher" | "User") => {
    if (!user) return false;
    if (user.role === "Admin") return true;
    if (user.role === "Researcher") {
      return requiredRole === "Researcher" || requiredRole === "User";
    }
    return requiredRole === "User";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans select-none antialiased">
        <AuthOverlay onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased">
      {/* Upper Status strip / Header bar - styled with Sleek theme */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0 shadow-lg">
        {/* Branding logos */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg shadow-inner">
            <Layers className="w-5 h-5 animate-spin-slow" />
          </div>
          <div className="text-left font-sans">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight">LiftOps SWAN</h1>
              <span className="px-1.5 py-0.2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-[9px] font-bold rounded">
                v2.6.4-LHC
              </span>
            </div>
            <p className="text-4xs font-mono text-slate-500 tracking-wider uppercase mt-0.5">
              Service for Web-based Analysis & Collaborative Fitness Science
            </p>
          </div>
        </div>

        {/* Sync telemetry, system clocks & profile coordinates with Sleek Theme highlights */}
        <div className="flex flex-wrap items-center gap-4 text-left font-mono text-4xs">
          {/* Platform health status from Mockup */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-4xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            CLUSTER STABLE
          </div>

          {/* UTC Clock */}
          <div className="hidden lg:block bg-slate-950 border border-slate-850 px-3 py-1.5 rounded">
            <span className="text-slate-500 block font-bold">SYSTEM TIME (UTC)</span>
            <span className="text-slate-300 font-bold">{utcTime || "Fri, 29 May 2026 01:21:37 GMT"}</span>
          </div>

          {/* User security authorization */}
          <div className="bg-slate-950 border border-slate-850 px-3 py-1.5 rounded flex items-center gap-2">
            <div className="shrink-0 text-indigo-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-500 block font-bold">ACTIVE ROLE</span>
              <span className="text-indigo-300 font-semibold uppercase">{user.username} ({user.role})</span>
            </div>
          </div>

          {/* Logout option */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-850 border border-slate-755 hover:bg-slate-800 text-slate-300 hover:text-indigo-400 rounded transition duration-150 cursor-pointer text-4xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            LOGOUT
          </button>
        </div>
      </header>

      {/* Main split work console */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left-sidebar navigations with flex layout for profile sticky bottom */}
        <aside className="bg-slate-900 border-r border-slate-800 w-full md:w-60 shrink-0 md:h-full flex flex-col justify-between overflow-y-auto">
          <div className="p-4 space-y-4">
            <span className="text-5xs font-mono text-slate-500 uppercase tracking-widest pl-1 block text-left font-bold">
              Scientific Compute Tabs
            </span>

            <nav className="space-y-1">
              <button
                onClick={() => setCurrentTab("workout")}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-mono font-semibold text-left flex items-center gap-2.5 transition duration-150 hover:cursor-pointer ${
                  currentTab === "workout"
                    ? "bg-indigo-650 text-slate-100 font-bold border-l-2 border-indigo-400 shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-855"
                }`}
              >
                <Dumbbell className="w-4 h-4 text-indigo-400" />
                Biomechanical Logs
              </button>

              <button
                onClick={() => setCurrentTab("notebook")}
                disabled={!hasClearance("User")}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-mono font-semibold text-left flex items-center gap-2.5 transition duration-150 hover:cursor-pointer ${
                  currentTab === "notebook"
                    ? "bg-indigo-650 text-slate-100 font-bold border-l-2 border-indigo-400 shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-855"
                }`}
              >
                <Code className="w-4 h-4 text-indigo-400" />
                Jupyter Notebooks
              </button>

              <button
                onClick={() => setCurrentTab("container")}
                disabled={!hasClearance("Researcher")}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-mono font-semibold text-left flex items-center gap-2.5 transition duration-150 hover:cursor-pointer ${
                  !hasClearance("Researcher") ? "opacity-30 cursor-not-allowed" : ""
                } ${
                  currentTab === "container"
                    ? "bg-indigo-650 text-slate-100 font-bold border-l-2 border-indigo-400 shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-855"
                }`}
              >
                <Cpu className="w-4 h-4 text-indigo-400" />
                Isolated LXC Pods
              </button>

              <button
                onClick={() => setCurrentTab("cloud")}
                disabled={!hasClearance("Admin")}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-mono font-semibold text-left flex items-center gap-2.5 transition duration-150 hover:cursor-pointer ${
                  !hasClearance("Admin") ? "opacity-30 cursor-not-allowed" : ""
                } ${
                  currentTab === "cloud"
                    ? "bg-indigo-650 text-slate-100 font-bold border-l-2 border-indigo-400 shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-855"
                }`}
              >
                <Cloud className="w-4 h-4 text-indigo-400" />
                K8s & OpenStack Cloud
              </button>

              <button
                onClick={() => setCurrentTab("git")}
                disabled={!hasClearance("User")}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-mono font-semibold text-left flex items-center gap-2.5 transition duration-150 hover:cursor-pointer ${
                  currentTab === "git"
                    ? "bg-indigo-650 text-slate-100 font-bold border-l-2 border-indigo-400 shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-855"
                }`}
              >
                <Github className="w-4 h-4 text-indigo-400" />
                Git Repository & Pipelines
              </button>

              <button
                onClick={() => setCurrentTab("telemetry")}
                disabled={!hasClearance("User")}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-mono font-semibold text-left flex items-center gap-2.5 transition duration-150 hover:cursor-pointer ${
                  currentTab === "telemetry"
                    ? "bg-indigo-650 text-slate-100 font-bold border-l-2 border-indigo-400 shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-855"
                }`}
              >
                <Radio className="w-4 h-4 text-indigo-400" />
                Node Prometheus Telemetry
              </button>
            </nav>

            {/* Core system message */}
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-1 mt-2 text-left">
              <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" /> SYSTEM SECURE
              </span>
              <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                Swan core sandbox coordinates authorized under cryptographic signature clearance.
              </p>
            </div>
          </div>

          {/* User profile section matching design mockup */}
          <div className="p-4 border-t border-slate-850 bg-slate-900 shrink-0">
            <div className="flex items-center gap-3 p-2 rounded bg-slate-850 border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-505/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden text-left">
                <div className="text-xs font-medium text-slate-200 truncate">{user.username}</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">{user.role} (CERN-CH)</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Pane container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-950 min-h-0">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentTab === "workout" && <WorkoutAnalytics userId={user.id} />}
            {currentTab === "notebook" && <NotebookHub userId={user.id} username={user.username} />}
            {currentTab === "container" && <ContainerPods userId={user.id} username={user.username} />}
            {currentTab === "cloud" && <CloudInfrastructure />}
            {currentTab === "git" && <GitWorkflow />}
            {currentTab === "telemetry" && <TelemetryDashboard />}
          </div>
        </main>
      </div>

      {/* Styled system footer exactly matching Sleek design mock */}
      <footer className="h-8 bg-slate-900 border-t border-slate-800 px-6 flex items-center justify-between text-[11px] text-slate-500 font-mono shrink-0 select-none">
        <div className="flex gap-4 md:gap-6">
          <span>v2.6.4-stable</span>
          <span className="text-emerald-500/70">● Kubernetes: 1.28.2</span>
          <span>● OpenStack Victoria</span>
        </div>
        <div className="hidden sm:flex gap-4 md:gap-6">
          <span>LATENCY: 12ms</span>
          <span>GITHUB: CONNECTED</span>
          <span>© 2026 LIFTOPS CERN PROJECT</span>
        </div>
      </footer>
    </div>
  );
}
