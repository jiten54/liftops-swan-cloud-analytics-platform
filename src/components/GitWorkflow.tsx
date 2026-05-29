import React, { useState, useEffect } from "react";
import { GitRepo } from "../types";
import { Github, GitBranch, GitCommit, Play, RefreshCw, CheckCircle2, ShieldAlert, Cpu } from "lucide-react";

export default function GitWorkflow() {
  const [repos, setRepos] = useState<GitRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitRepo | null>(null);
  
  // New commit builder state
  const [commitMessage, setCommitMessage] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);

  // Dynamic CI/CD runner states
  const [cicd, setCicd] = useState({ running: false, progress: 0, activeStep: "idle", logs: [] as string[], status: "success" });
  const [logPollingActive, setLogPollingActive] = useState(false);

  const fetchGitReposAndCicd = async () => {
    try {
      const resRepos = await fetch("/api/git/repos");
      const dataRepos = await resRepos.json();
      setRepos(dataRepos);
      if (dataRepos.length > 0 && !selectedRepo) {
        setSelectedRepo(dataRepos.find((r: any) => r.connected) || dataRepos[0]);
      }

      const resCicd = await fetch("/api/cicd");
      const dataCicd = await resCicd.json();
      setCicd(dataCicd);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGitReposAndCicd();
  }, []);

  const handleConnectRepo = async (id: string) => {
    try {
      const res = await fetch("/api/git/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId: id })
      });
      const data = await res.json();
      setRepos(data.repos);
      const match = data.repos.find((r: any) => r.id === id);
      if (match) setSelectedRepo(match);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo || !commitMessage) return;
    setIsCommitting(true);

    try {
      const res = await fetch(`/api/git/${selectedRepo.id}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: commitMessage,
          author: "swanjiten"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedRepo(data);
        setCommitMessage("");
        fetchGitReposAndCicd();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleTriggerCicd = async () => {
    try {
      const res = await fetch("/api/cicd/trigger", { method: "POST" });
      if (res.ok) {
        setLogPollingActive(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Poll CI/CD state if it is running
  useEffect(() => {
    let timer: any;
    if (logPollingActive || cicd.running) {
      timer = setInterval(async () => {
        try {
          const res = await fetch("/api/cicd");
          const data = await res.json();
          setCicd(data);
          if (!data.running) {
            setLogPollingActive(false);
            clearInterval(timer);
          }
        } catch (err) {
          console.error(err);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [logPollingActive, cicd.running]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-100 flex items-center gap-2">
            <Github className="w-5 h-5 text-indigo-400" />
            SWAN Git versioning & CI/CD Runner Console
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Synchronize dataset repositories with GitHub, push commits, and view real-time Docker container compilation and deployment logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Repository browser */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-4xs font-bold text-slate-500 uppercase tracking-widest font-mono">
              Repository Registry
            </h4>
            <div className="space-y-2">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => repo.connected && setSelectedRepo(repo)}
                  className={`p-3.5 rounded border text-left transition ${
                    selectedRepo?.id === repo.id
                      ? "bg-slate-850 hover:bg-slate-800 border-indigo-500/70"
                      : "bg-slate-950 hover:bg-slate-850 border-slate-850"
                  } ${!repo.connected ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{repo.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{repo.url}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">
                      {repo.provider}
                    </span>
                  </div>

                  {!repo.connected ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectRepo(repo.id);
                      }}
                      className="mt-3 w-full py-1 text-4xs bg-indigo-900 hover:bg-indigo-805 text-indigo-300 font-mono uppercase font-bold tracking-wider rounded border border-indigo-800/40"
                    >
                      Connect credentials
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 mt-3 text-4xs font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      CONNECTED OAUTH SECURE
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* New Commit form */}
          {selectedRepo && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1">
                <GitCommit className="w-4 h-4 text-indigo-400" />
                STAGE NEW SCIENTIFIC COMMIT
              </h4>
              <form onSubmit={handleCommit} className="space-y-3">
                <div>
                  <label className="block text-4xs text-slate-500 font-mono mb-1">CURRENT BRANCH</label>
                  <div className="text-xs font-mono font-semibold text-slate-350 bg-slate-950 p-2 rounded border border-slate-850 flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-indigo-400" /> {selectedRepo.currentBranch}
                  </div>
                </div>

                <div>
                  <label className="block text-4xs text-slate-500 font-mono mb-1">COMMIT LOG MESSAGE</label>
                  <textarea
                    required
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    rows={3}
                    className="w-full text-xs font-mono bg-slate-950 border border-slate-850 rounded p-2 text-slate-330 focus:outline-none focus:border-indigo-505"
                    placeholder="E.g., Added regression test for heart-rate decay..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCommitting}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-xs font-mono font-semibold rounded text-slate-100 transition"
                >
                  {isCommitting ? "Syncing commit logs..." : "COMMIT & PUSH WORKSPACE"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Branch Commits and Automated CI/CD Terminal logs */}
        <div className="lg:col-span-8 space-y-6">
          {selectedRepo && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-indigo-400" />
                  Active Branch Commit History
                </h3>
                <span className="text-4xs font-mono bg-indigo-900/20 text-indigo-300 border border-indigo-500/10 px-1.5 py-0.5 rounded">
                  {selectedRepo.currentBranch}
                </span>
              </div>

              <div className="space-y-3 max-h-[170px] overflow-y-auto pr-1">
                {selectedRepo.commits.map((commit, i) => (
                  <div key={commit.hash + i} className="flex gap-3 items-start p-2.5 bg-slate-950/80 rounded border border-slate-850">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 select-none">
                      {commit.hash}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-300 font-mono leading-tight">{commit.message}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-500 font-mono">
                        <span>Author: {commit.author}</span>
                        <span>•</span>
                        <span>{new Date(commit.date).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedRepo.commits.length === 0 && (
                  <div className="text-center py-6 font-mono text-3xs text-slate-500">
                    No commits tracked on this repository index. Submit above to stage changes.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Docker Automated CI/CD execution */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  AUTOMATED CI/CD PLATFORM RUNNER
                </h3>
                <p className="text-4xs text-slate-500 font-mono mt-0.5">
                  Launch automated build environments, triggers pytests, docker builds and hot rolls to K8s nodes.
                </p>
              </div>
              <button
                onClick={handleTriggerCicd}
                disabled={cicd.running}
                className="px-4 py-2 hover:cursor-pointer bg-emerald-660 hover:bg-emerald-600 disabled:bg-slate-800 text-xs font-mono font-bold text-slate-100 rounded flex items-center gap-1.5 transition"
              >
                <Play className="w-3.5 h-3.5" />
                {cicd.running ? "PIPELINE ACTIVE..." : "TRIGGER PIPELINE FLOW"}
              </button>
            </div>

            {/* Pipeline progress logs */}
            {cicd.running || cicd.logs.length > 0 ? (
              <div className="space-y-3">
                {/* Visual Step indicators */}
                <div className="grid grid-cols-4 gap-2">
                  <div className={`p-2 border rounded font-mono text-[9px] text-center ${
                    cicd.activeStep === "linting" ? "border-indigo-500 bg-indigo-950/20 text-indigo-300 animate-pulse" : (cicd.logs.some(l => l.includes("Lint")) ? "border-emerald-500/20 bg-emerald-950/5 text-emerald-400" : "border-slate-850 bg-slate-950/20 text-slate-600")
                  }`}>
                    1. ESLint & Types
                  </div>
                  <div className={`p-2 border rounded font-mono text-[9px] text-center ${
                    cicd.activeStep === "testing" ? "border-indigo-500 bg-indigo-950/20 text-indigo-300 animate-pulse" : (cicd.logs.some(l => l.includes("testing")) ? "border-emerald-500/20 bg-emerald-950/5 text-emerald-400" : "border-slate-850 bg-slate-950/20 text-slate-600")
                  }`}>
                    2. Backend PyTest
                  </div>
                  <div className={`p-2 border rounded font-mono text-[9px] text-center ${
                    cicd.activeStep === "building" ? "border-indigo-500 bg-indigo-950/20 text-indigo-300 animate-pulse" : (cicd.logs.some(l => l.includes("docker")) ? "border-emerald-500/20 bg-emerald-950/5 text-emerald-400" : "border-slate-850 bg-slate-950/20 text-slate-600")
                  }`}>
                    3. Docker Build
                  </div>
                  <div className={`p-2 border rounded font-mono text-[9px] text-center ${
                    cicd.activeStep === "deployment" ? "border-indigo-500 bg-indigo-950/20 text-indigo-300 animate-pulse" : (cicd.logs.some(l => l.includes("rollout")) ? "border-emerald-500/20 bg-emerald-950/5 text-emerald-400" : "border-slate-850 bg-slate-950/20 text-slate-600")
                  }`}>
                    4. Ingress Release
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-4xs font-mono text-slate-400 mb-1">
                    <span>BUILD PIPELINE SYNTAX IN PROGRESS...</span>
                    <span>{cicd.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded overflow-hidden border border-slate-900">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${cicd.progress}%` }}
                    />
                  </div>
                </div>

                {/* Simulated CLI stdout terminal */}
                <div className="bg-slate-950 p-4 border border-slate-850 rounded-lg aspect-[5/2] overflow-y-auto font-mono text-left text-xs leading-relaxed max-h-52 pr-2">
                  {cicd.logs.map((log, index) => (
                    <div
                      key={index}
                      className={
                        log.includes("compiled") || log.includes("passed") || log.includes("SUCCESS")
                          ? "text-emerald-400 mb-1"
                          : log.includes("Error")
                          ? "text-rose-450 mb-1"
                          : "text-slate-350 mb-1 font-normal"
                      }
                    >
                      {log}
                    </div>
                  ))}
                  {cicd.running && (
                    <span className="inline-block w-2.5 h-3.5 bg-indigo-400 animate-pulse align-middle ml-1" />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 font-mono text-xs text-slate-500 bg-slate-955/50 border border-slate-850/50 rounded-lg">
                Automated continuous integration pipeline ready. Press trigger above to simulate checkout steps.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
