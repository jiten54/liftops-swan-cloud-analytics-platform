import React, { useState, useEffect } from "react";
import { ContainerSession } from "../types";
import { Cpu, Terminal, Play, Square, RefreshCcw, PlusSquare, AlertOctagon, HelpCircle, Network, HardDrive } from "lucide-react";

interface ContainerPodsProps {
  userId: string;
  username: string;
}

export default function ContainerPods({ userId, username }: ContainerPodsProps) {
  const [containers, setContainers] = useState<ContainerSession[]>([]);
  const [cpuLimit, setCpuLimit] = useState("1.0 Core");
  const [memoryLimit, setMemoryLimit] = useState("2.0 GB");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchContainers = async () => {
    try {
      const res = await fetch("/api/containers");
      const data = await res.json();
      setContainers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateContainer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/containers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          username,
          cpuLimit,
          memoryLimit
        })
      });
      if (res.ok) {
        fetchContainers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleContainerAction = async (id: string, action: "start" | "stop" | "restart") => {
    setActionLoading(id + "-" + action);
    try {
      const res = await fetch(`/api/containers/${id}/${action}`, {
        method: "POST"
      });
      if (res.ok) {
        await fetchContainers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return "Stopped";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + "h " : ""}${m > 0 ? m + "m " : ""}${s}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Isolated Sandbox Workspace Containers (CERN-LXC Inspired)
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Deploy micro-compute workspace environments bound securely into the sandboxed hypervision matrix.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Registering new Container limits */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-850 pl-1 pb-2 font-mono flex items-center gap-1.5">
            <PlusSquare className="w-4 h-4 text-indigo-400" />
            SPAWN CONTAINER NODE
          </h3>
          <form onSubmit={handleCreateContainer} className="space-y-4 text-left">
            <div>
              <label className="block text-3xs text-slate-400 font-mono mb-1">Compute Core Partition</label>
              <select
                value={cpuLimit}
                onChange={(e) => setCpuLimit(e.target.value)}
                className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded p-2 text-slate-300"
              >
                <option value="0.5 Core (Shared)">0.5 Core (Shared Micro)</option>
                <option value="1.0 Core">1.0 Dedicated Core (Standard)</option>
                <option value="2.0 Cores">2.0 Cores (High Analytics workload)</option>
                <option value="4.0 Cores">4.0 Cores (Ultra Heavy regression)</option>
              </select>
            </div>

            <div>
              <label className="block text-3xs text-slate-400 font-mono mb-1">Persistent Ram Limits</label>
              <select
                value={memoryLimit}
                onChange={(e) => setMemoryLimit(e.target.value)}
                className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded p-2 text-slate-300"
              >
                <option value="1.0 GB">1.0 GB Shared Cache</option>
                <option value="2.0 GB">2.0 GB Stack Pool (Standard)</option>
                <option value="4.0 GB">4.0 GB High Performance Memory</option>
                <option value="8.0 GB">8.0 GB Quantum Cluster Memory</option>
              </select>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded space-y-1">
              <span className="text-4xs font-mono text-slate-500 uppercase tracking-widest block">Allocated Sandbox Gateways</span>
              <ul className="text-4xs font-mono text-indigo-300 space-y-0.5">
                <li>• CephFS Block mounts</li>
                <li>• Python Pandas & Numpy Kernel layers</li>
                <li>• Port mapping bindings</li>
              </ul>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 hover:cursor-pointer text-xs font-mono font-semibold rounded text-slate-100 transition duration-150"
            >
              SPAWN CERN-LXC DISK IMAGE
            </button>
          </form>
        </div>

        {/* Right Column: Active containers browser list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 pl-1 pb-1 font-mono flex items-center gap-1.5">
              <Network className="w-4 h-4 text-emerald-400" />
              SWAN-LXC ACTIVE CORE ALLOCATION ({containers.length} ALLOCATED)
            </h3>

            <div className="space-y-3">
              {containers.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-950 border border-slate-850/80 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-800"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-slate-900 text-indigo-400 border border-slate-800 rounded">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-250">
                          jupyter-client-{c.id}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-5xs font-mono font-bold border uppercase ${
                          c.status === "running"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 animate-pulse"
                            : c.status === "stopped"
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-450"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-4xs text-slate-400 font-mono mt-1">
                        SSH Gateway: <span className="text-indigo-300 font-semibold">swan@{c.id}.cern.internal</span> | Port: {c.port}
                      </p>
                      
                      {/* Specs badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400 rounded">
                          CPU: {c.cpuLimit}
                        </span>
                        <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400 rounded">
                          RAM: {c.memoryLimit}
                        </span>
                        <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400 rounded">
                          Uptime: {formatUptime(c.uptime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5">
                    {c.status !== "running" ? (
                      <button
                        onClick={() => handleContainerAction(c.id, "start")}
                        disabled={actionLoading === `${c.id}-start`}
                        className="px-2 py-1 bg-emerald-950 border border-emerald-900/40 text-emerald-400 hover:bg-emerald-900/30 text-5xs font-mono font-bold rounded flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        {actionLoading === `${c.id}-start` ? "BOOTING..." : "START"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleContainerAction(c.id, "stop")}
                        disabled={actionLoading === `${c.id}-stop`}
                        className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 text-5xs font-mono font-bold rounded flex items-center gap-1"
                      >
                        <Square className="w-3 h-3" />
                        {actionLoading === `${c.id}-stop` ? "STOPPING..." : "SHUTDOWN"}
                      </button>
                    )}

                    <button
                      onClick={() => handleContainerAction(c.id, "restart")}
                      disabled={actionLoading === `${c.id}-restart` || c.status === "stopped"}
                      className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-slate-900 rounded border border-transparent hover:border-slate-800"
                      title="Graceful restart container layer"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {containers.length === 0 && (
                <div className="text-center py-10 font-mono text-xs text-slate-500">
                  No container partitions allocated. Request image spawning on left panel.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
