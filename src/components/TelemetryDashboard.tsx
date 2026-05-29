import React, { useState, useEffect } from "react";
import { SystemMetrics, PresenceUser } from "../types";
import { Activity, ShieldCheck, MapPin, Loader2, Eye, Database, Terminal, Cpu, Network, Radio } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

export default function TelemetryDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  
  // Keep historical metrics array for Recharts lines
  const [history, setHistory] = useState<{ time: string; cpu: number; memory: number; network: number }[]>([]);

  const fetchTelemetry = async () => {
    try {
      const resMet = await fetch("/api/system/metrics");
      const dataMet = await resMet.json();
      setMetrics(dataMet);

      // Append to charts history
      const now = new Date().toLocaleTimeString().split(" ")[0];
      setHistory(prev => {
        const next = [...prev, { time: now, cpu: dataMet.cpu, memory: dataMet.memory, network: dataMet.network }];
        if (next.length > 15) next.shift();
        return next;
      });

      const resLogs = await fetch("/api/system/logs");
      const dataLogs = await resLogs.json();
      setLogs(dataLogs);

      const resPres = await fetch("/api/system/presence");
      const dataPres = await resPres.json();
      setPresence(dataPres);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            SWAN Node Telemetry & Prometheus Scrapers
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Full physical slice node telemetry metrics capturing cluster memory bounds and multi-user presence coordinate maps.
          </p>
        </div>
      </div>

      {/* Grid of 4 fast counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-left">
          <div className="font-mono">
            <span className="text-5xs uppercase tracking-widest text-slate-500">Core CPU Stress</span>
            <div className="text-xl font-bold text-indigo-405 mt-1 font-mono">
              {metrics ? `${metrics.cpu}%` : "34%"}
            </div>
          </div>
          <div className="p-2 bg-slate-950 rounded border border-slate-850 text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-left">
          <div className="font-mono">
            <span className="text-5xs uppercase tracking-widest text-slate-500">Node Memory Load</span>
            <div className="text-xl font-bold text-emerald-405 mt-1 font-mono">
              {metrics ? `${metrics.memory}%` : "58%"}
            </div>
          </div>
          <div className="p-2 bg-slate-950 rounded border border-slate-850 text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-left">
          <div className="font-mono">
            <span className="text-5xs uppercase tracking-widest text-slate-500">CERN WAN Traffic</span>
            <div className="text-xl font-bold text-amber-405 mt-1 font-mono">
              {metrics ? `${metrics.network} Mb/s` : "145 Mb/s"}
            </div>
          </div>
          <div className="p-2 bg-slate-950 rounded border border-slate-850 text-amber-500">
            <Network className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-left">
          <div className="font-mono">
            <span className="text-5xs uppercase tracking-widest text-slate-500">Hypervisors Active</span>
            <div className="text-xl font-bold text-rose-405 mt-1 font-mono">
              {metrics ? `${metrics.activeContainers} Containers` : "1 Session"}
            </div>
          </div>
          <div className="p-2 bg-slate-950 rounded border border-slate-850 text-rose-450">
            <Database className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Real-time graphs */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-left">
          <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Prometheus Live Stream Grafana Panel
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.length > 0 ? history : [
                { time: "05:00", cpu: 32, memory: 58, network: 120 },
                { time: "05:01", cpu: 38, memory: 59, network: 140 },
                { time: "05:02", cpu: 34, memory: 57, network: 135 }
              ]}>
                <defs>
                  <linearGradient id="promCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="promMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" style={{ fontSize: "9px" }} />
                <YAxis stroke="#475569" style={{ fontSize: "9px" }} />
                <Tooltip contentStyle={{ backgroundColor: "#0b0f19", border: "1px solid #1e293b", color: "#e2e8f0" }} />
                <Area type="monotone" dataKey="cpu" name="CPU Usage %" stroke="#4f46e5" fillOpacity={1} fill="url(#promCpu)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="memory" name="Memory Bound %" stroke="#10b981" fillOpacity={1} fill="url(#promMem)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right column: Multi-user presence list */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-left">
          <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            SWAN Real-time Collaborations matrix
          </h3>

          <div className="space-y-3">
            {presence.map((peer) => (
              <div key={peer.username} className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-mono font-bold text-slate-250">{peer.username}</span>
                  </div>
                  <span className={`text-[8px] uppercase tracking-wider font-mono font-bold ${
                    peer.isMe ? "bg-indigo-900/40 text-indigo-300 border border-indigo-505/30" : "bg-slate-900 text-slate-500 border border-slate-800"
                  } px-1 rounded`}>
                    {peer.isMe ? "Me" : "Peer Connected"}
                  </span>
                </div>

                <div className="space-y-1 text-3xs font-mono text-slate-400 leading-tight">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" /> Local Node: <span className="text-slate-300">{peer.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-600 shrink-0" /> Notebook Focus: <span className="text-indigo-400 truncate max-w-[160px]">{peer.activeNotebook}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Underneath: Interactive server system event log streams */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-left space-y-3">
        <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          SWAN Hypervisor raw SysLog outputs (/var/log/swan-core.log)
        </h3>
        <div className="bg-slate-950 p-4 border border-slate-850 rounded-lg aspect-[5/1] overflow-y-auto pr-2 max-h-48 font-mono text-left text-xs leading-relaxed space-y-1 shadow">
          {logs.slice().reverse().map((log, i) => (
            <div key={i} className="text-slate-450 hover:text-slate-250 transition-colors">
              <span className="text-slate-600 dark:text-slate-500 select-none mr-2">[{i}]</span>
              {log}
            </div>
          ))}
          <div className="flex items-center gap-1 text-indigo-400 mt-1 font-semibold">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Streaming live daemon metrics from cern-swan-core cluster...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
