import React, { useState, useEffect } from "react";
import { Notebook, NotebookCell } from "../types";
import { Play, Plus, Trash, FileText, Code, CheckCircle, Save, Database, ShieldAlert, Sparkles, AlertCircle } from "lucide-react";
import { apiRequest } from "../utils/api";

interface NotebookHubProps {
  userId: string;
  username: string;
}

export default function NotebookHub({ userId, username }: NotebookHubProps) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(false);
  const [executingCellId, setExecutingCellId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [gptActive, setGptActive] = useState(false);

  const fetchNotebooks = async () => {
    try {
      const data = await apiRequest<Notebook[]>("/api/notebooks");
      setNotebooks(data);
      if (data.length > 0 && !selectedNotebook) {
        setSelectedNotebook(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const selectNotebook = async (id: string) => {
    try {
      const data = await apiRequest<Notebook>(`/api/notebooks/${id}`);
      setSelectedNotebook(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNotebook = async () => {
    try {
      const data = await apiRequest<Notebook>("/api/notebooks", {
        method: "POST",
        body: JSON.stringify({
          title: `analysis_routine_${Math.random().toString(36).substring(2, 6)}.ipynb`,
          userId,
          username
        })
      });
      setNotebooks([...notebooks, data]);
      setSelectedNotebook(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCellSource = (cellId: string, updatedSource: string) => {
    if (!selectedNotebook) return;
    const updatedCells = selectedNotebook.cells.map(c => {
      if (c.id === cellId) {
        return { ...c, source: updatedSource };
      }
      return c;
    });
    setSelectedNotebook({ ...selectedNotebook, cells: updatedCells });
  };

  const handleAddCell = (type: "code" | "markdown") => {
    if (!selectedNotebook) return;
    const newCell: NotebookCell = {
      id: "c-dyn-" + Math.random().toString(36).substring(2, 6),
      type,
      source: type === "code" ? "# Write Python Code here:\n" : "### New Markdown Section\nEnter description here."
    };
    setSelectedNotebook({
      ...selectedNotebook,
      cells: [...selectedNotebook.cells, newCell]
    });
  };

  const handleDeleteCell = (cellId: string) => {
    if (!selectedNotebook) return;
    setSelectedNotebook({
      ...selectedNotebook,
      cells: selectedNotebook.cells.filter(c => c.id !== cellId)
    });
  };

  const handleSaveNotebook = async () => {
    if (!selectedNotebook) return;
    setLoading(true);
    try {
      await apiRequest(`/api/notebooks/${selectedNotebook.id}/cells`, {
        method: "PUT",
        body: JSON.stringify({ cells: selectedNotebook.cells })
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleExecuteCell = async (cellId: string, source: string) => {
    if (!selectedNotebook) return;
    setExecutingCellId(cellId);

    try {
      const data = await apiRequest<any>(`/api/notebooks/${selectedNotebook.id}/cells/${cellId}/execute`, {
        method: "POST",
        body: JSON.stringify({ code: source })
      });

      // Check if Gemini execution was active based on signature of output
      if (data.type !== "error" && data.content.includes("Simulated") === false) {
        setGptActive(true);
      } else {
        setGptActive(false);
      }

      // Sync and update UI
      const updatedCells = selectedNotebook.cells.map(c => {
        if (c.id === cellId) {
          return { ...c, output: data };
        }
        return c;
      });
      setSelectedNotebook({ ...selectedNotebook, cells: updatedCells });
    } catch (err) {
      console.error(err);
    } finally {
      setExecutingCellId(null);
    }
  };

  // Convert tables to pretty tables
  const formatOutput = (outputContent: string, outputType: string) => {
    if (outputType === "table") {
      const rows = outputContent.split("\n");
      return (
        <div className="overflow-x-auto my-2 border border-slate-800 rounded">
          <table className="min-w-full text-4xs font-mono text-slate-350 bg-slate-950">
            <tbody>
              {rows.map((row, i) => {
                const cols = row.split("|");
                const isHeader = i === 0 || row.includes("---");
                if (row.includes("---")) {
                  return null;
                }
                return (
                  <tr key={i} className={isHeader ? "bg-slate-900 border-b border-slate-800" : "border-b border-slate-850/30"}>
                    {cols.map((col, j) => (
                      <td key={j} className="p-2 truncate max-w-xs">{col.trim()}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (outputType === "chart") {
      return (
        <div className="p-4 rounded border border-indigo-500/20 bg-indigo-950/20 text-indigo-400 font-mono text-3xs flex flex-col items-center gap-1.5 my-2">
          <Database className="w-5 h-5 text-indigo-400 animate-pulse" />
          <span>{outputContent}</span>
          <span className="text-4xs text-slate-500">Rendered dynamically via CERN-SWAN Bokeh extension.</span>
        </div>
      );
    }

    if (outputType === "error") {
      return (
        <pre className="p-3 my-2 rounded border border-rose-500/30 bg-rose-950/20 text-rose-400 text-4xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
          {outputContent}
        </pre>
      );
    }

    return (
      <pre className="p-3 my-2 rounded border border-slate-800 bg-slate-950 text-slate-350 text-4xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
        {outputContent}
      </pre>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-100 flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-400" />
            SWAN JupyterHub Notebook Environment
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Execute in-browser container isolated scientific analysis pipelines supporting Pandas, NumPy, and cardiac model calculations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNotebook}
            className="px-3.5 py-1.5 hover:cursor-pointer bg-slate-800 border border-slate-c hover:bg-slate-750 text-xs font-mono font-semibold text-slate-200 rounded transition"
          >
            + SPAWN NB WORKSPACE
          </button>
          <button
            onClick={handleSaveNotebook}
            disabled={loading || !selectedNotebook}
            className="px-3.5 py-1.5 hover:cursor-pointer bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-xs font-mono font-semibold text-slate-100 rounded transition flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {loading ? "Persisting..." : "PERSIST REPO"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Notebook List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-4xs font-bold text-slate-500 uppercase tracking-widest font-mono">
              Persisted Analyses
            </h4>
            <div className="space-y-1.5">
              {notebooks.map((nb) => (
                <div
                  key={nb.id}
                  onClick={() => selectNotebook(nb.id)}
                  className={`p-3 rounded border text-left cursor-pointer transition flex items-center justify-between ${
                    selectedNotebook?.id === nb.id
                      ? "bg-slate-850 hover:bg-slate-800 border-indigo-500/70"
                      : "bg-slate-950 hover:bg-slate-850 border-slate-850"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-250 font-mono truncate max-w-xs">{nb.title}</h4>
                      <p className="text-4xs text-slate-500 font-mono mt-0.5">Author: {nb.ownerName}</p>
                    </div>
                  </div>
                </div>
              ))}
              {notebooks.length === 0 && (
                <div className="text-center py-6 font-mono text-3xs text-slate-500">
                  No notebooks deployed.
                </div>
              )}
            </div>
          </div>

          {/* AI Info Status Box */}
          <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-1 text-left">
            <h5 className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              INTELLIGENT KERNEL ACCELERATOR
            </h5>
            <p className="text-4xs text-slate-350 leading-relaxed font-mono">
              If a <span className="text-indigo-300 font-semibold">GEMINI_API_KEY</span> secret is defined in the workspace, LiftOps SWAN automatically powers Python syntax with logical execution traces for equations, data structures, and workout statistics.
            </p>
            <div className="pt-2 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${process.env.GEMINI_API_KEY ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-[9px] font-mono text-slate-400 uppercase">
                {process.env.GEMINI_API_KEY ? "Gemini Engine: READY" : "Gemini Engine: MOCK SIMULATION"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Active Jupyter notebook canvas */}
        {selectedNotebook ? (
          <div className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            {/* Notebook top bar */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono px-2 py-0.5 rounded uppercase">
                  ACTIVE ENVIRONMENT
                </span>
                <span className="text-xs font-mono font-bold text-slate-250">
                  {selectedNotebook.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddCell("code")}
                  className="px-2 py-1 text-5xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300 flex items-center gap-1"
                >
                  <Code className="w-3 h-3 text-indigo-400" /> + CODE CELL
                </button>
                <button
                  onClick={() => handleAddCell("markdown")}
                  className="px-2 py-1 text-5xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300 flex items-center gap-1"
                >
                  <FileText className="w-3 h-3 text-amber-500" /> + MARKDOWN CELL
                </button>
              </div>
            </div>

            {/* Cell list container */}
            <div className="p-6 space-y-6 max-h-[580px] overflow-y-auto bg-slate-950/40">
              {selectedNotebook.cells.map((cell, index) => (
                <div
                  key={cell.id}
                  className={`group relative rounded-lg border p-4 transition-all duration-150 ${
                    cell.type === "code" ? "bg-slate-900/60 border-slate-850" : "bg-slate-905/30 border-transparent hover:border-slate-870/40"
                  }`}
                >
                  {/* Left gutter tags */}
                  <div className="absolute left-[-24px] top-6 font-mono text-[9px] text-slate-600 hidden group-hover:block select-none">
                    [{index + 1}]
                  </div>

                  {/* Actions overlay absolute */}
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteCell(cell.id)}
                      className="p-1 hover:bg-slate-801 text-slate-550 hover:text-rose-400 rounded"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {cell.type === "markdown" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-5xs font-mono text-amber-500 uppercase tracking-widest border-b border-slate-900/40 pb-1.5">
                        <FileText className="w-3.5 h-3.5" /> Markdown Cell
                      </div>
                      <textarea
                        value={cell.source}
                        onChange={(e) => handleUpdateCellSource(cell.id, e.target.value)}
                        className="w-full bg-slate-950/70 text-slate-200 border border-slate-850 rounded p-2.5 outline-none focus:border-indigo-500 text-xs font-mono font-normal leading-relaxed text-left"
                        rows={3}
                        placeholder="# Title\nEdit Markdown description logs..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-900/40">
                        <div className="flex items-center gap-1.5 text-5xs font-mono text-indigo-400 uppercase tracking-widest">
                          <Code className="w-3.5 h-3.5" /> Python Cell [{index + 1}]
                        </div>
                        <button
                          onClick={() => handleExecuteCell(cell.id, cell.source)}
                          disabled={executingCellId === cell.id}
                          className="px-2.5 py-0.5 rounded text-5xs font-mono font-semibold bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-800/60 flex items-center gap-1 transition"
                        >
                          <Play className="w-3 h-3 text-emerald-400" />
                          {executingCellId === cell.id ? "EXECUTING..." : "RUN CELL"}
                        </button>
                      </div>

                      {/* Code Area */}
                      <div className="bg-slate-950 rounded p-3 border border-slate-850">
                        <textarea
                          value={cell.source}
                          onChange={(e) => handleUpdateCellSource(cell.id, e.target.value)}
                          className="w-full bg-transparent text-indigo-300 font-mono text-xs focus:outline-none resize-none min-h-[80px]"
                          spellCheck="false"
                        />
                      </div>

                      {/* Output Area */}
                      {cell.output && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-5xs font-mono text-slate-500 mb-1.5">
                            <span className="uppercase font-semibold tracking-wider flex items-center gap-0.5">
                              <CheckCircle className="w-3 h-3 text-emerald-500" /> Execution output
                            </span>
                            <span>CPU time: 0.04s</span>
                          </div>
                          {formatOutput(cell.output.content, cell.output.type)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-xl p-10 text-center font-mono text-slate-500 text-xs">
            No Jupyter Notebook selected. Access workspace by spawning a notebook coordinate above.
          </div>
        )}
      </div>
    </div>
  );
}
