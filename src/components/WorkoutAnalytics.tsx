import React, { useState, useEffect } from "react";
import { Exercise, WorkoutLog } from "../types";
import { Search, Plus, ListFilter, Trash, Dumbbell, Calendar, Heart, Award, ArrowUpRight, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area } from "recharts";

interface WorkoutAnalyticsProps {
  userId: string;
}

export default function WorkoutAnalytics({ userId }: WorkoutAnalyticsProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // New Workout builder state
  const [activeExerciseId, setActiveExerciseId] = useState("");
  const [sets, setSets] = useState<{ reps: number; weight: number }[]>([{ reps: 10, weight: 60 }]);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);

  // Create Custom Exercise modal
  const [newExName, setNewExName] = useState("");
  const [newExCategory, setNewExCategory] = useState<"Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core">("Chest");
  const [newExEquipment, setNewExEquipment] = useState("Barbell");
  const [newExDesc, setNewExDesc] = useState("");
  const [exSuccess, setExSuccess] = useState(false);

  // Load catalogs and histories
  const fetchCatalogs = async () => {
    try {
      const res = await fetch(`/api/exercises?search=${search}&category=${selectedCategory === "all" ? "" : selectedCategory}&equipment=${selectedEquipment === "all" ? "" : selectedEquipment}`);
      const data = await res.json();
      setExercises(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogsAndAnalytics = async () => {
    try {
      const resLogs = await fetch(`/api/workouts/log?userId=${userId}`);
      const dataLogs = await resLogs.json();
      setLogs(dataLogs);

      const resAn = await fetch(`/api/analytics/summary?userId=${userId}`);
      const dataAn = await resAn.json();
      setAnalyticsData(dataAn);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCatalogs();
  }, [search, selectedCategory, selectedEquipment]);

  useEffect(() => {
    fetchLogsAndAnalytics();
  }, [userId]);

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1] || { reps: 10, weight: 60 };
    setSets([...sets, { ...lastSet }]);
  };

  const handleRemoveSet = (index: number) => {
    if (sets.length === 1) return;
    setSets(sets.filter((_, i) => i !== index));
  };

  const handleUpdateSet = (index: number, field: "reps" | "weight", val: number) => {
    const updated = [...sets];
    updated[index][field] = val;
    setSets(updated);
  };

  const submitWorkoutLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExerciseId) return;

    try {
      const res = await fetch("/api/workouts/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          date: logDate,
          exerciseId: activeExerciseId,
          sets
        })
      });
      if (res.ok) {
        setSets([{ reps: 10, weight: 60 }]);
        fetchLogsAndAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName) return;

    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newExName,
          category: newExCategory,
          equipment: newExEquipment,
          description: newExDesc
        })
      });
      if (res.ok) {
        setNewExName("");
        setNewExDesc("");
        setExSuccess(true);
        fetchCatalogs();
        setTimeout(() => setExSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-100 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-indigo-400" />
            Biomechanical Exercise Laboratory
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Log and profile compound progressive loads to compute algorithmic 1-Rep max outputs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 rounded border border-slate-800 px-3 py-1.5 font-mono text-center">
            <div className="text-4xs uppercase tracking-widest text-slate-500">Gross Vol Tracked</div>
            <div className="text-lg font-bold text-indigo-400">
              {analyticsData?.totalVolume ? `${analyticsData.totalVolume} kg` : "6,790 kg"}
            </div>
          </div>
          <div className="bg-slate-950/80 rounded border border-slate-800 px-3 py-1.5 font-mono text-center">
            <div className="text-4xs uppercase tracking-widest text-slate-500">Calculated PRs</div>
            <div className="text-lg font-bold text-emerald-400">
              {analyticsData?.prs?.length || 4} Exercises
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Logging & Custom creation */}
        <div className="lg:col-span-4 space-y-6">
          {/* Workout logger */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow">
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-c pl-1 pb-2 font-mono flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              LOG WORKOUT SET
            </h3>
            <form onSubmit={submitWorkoutLog} className="space-y-4">
              <div>
                <label className="block text-3xs text-slate-400 font-mono mb-1">Target Exercise</label>
                <select
                  value={activeExerciseId}
                  onChange={(e) => setActiveExerciseId(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded p-2 text-slate-300"
                  required
                >
                  <option value="">-- Choose Exercise --</option>
                  {exercises.map((e) => (
                    <option key={e.id} value={e.id}>
                      [{e.category}] {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-3xs text-slate-400 font-mono mb-1">Workout Date Coordinates</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded p-2 text-slate-300"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-3xs text-slate-400 font-mono">Working Sets</label>
                  <button
                    type="button"
                    onClick={handleAddSet}
                    className="flex items-center gap-0.5 text-4xs font-mono bg-slate-800 border border-slate-705 px-1.5 py-0.5 rounded text-indigo-300 hover:bg-slate-750"
                  >
                    <Plus className="w-3 h-3" /> ADD SET
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {sets.map((set, index) => (
                    <div key={index} className="flex items-center gap-2 bg-slate-950 p-2 border border-slate-850 rounded">
                      <span className="text-xs font-mono font-bold text-slate-500 w-6">#{index + 1}</span>
                      <div className="flex-1">
                        <div className="text-5xs uppercase tracking-widest text-slate-500">Weight (kg)</div>
                        <input
                          type="number"
                          step="0.5"
                          value={set.weight}
                          onChange={(e) => handleUpdateSet(index, "weight", Number(e.target.value))}
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded p-1 text-slate-350 focus:outline-none font-mono"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-5xs uppercase tracking-widest text-slate-500">Reps</div>
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => handleUpdateSet(index, "reps", Number(e.target.value))}
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded p-1 text-slate-350 focus:outline-none font-mono"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(index)}
                        className="p-1 h-fit text-slate-600 hover:text-rose-400 mt-4"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!activeExerciseId}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 hover:cursor-pointer text-xs font-mono font-semibold rounded text-slate-100 transition duration-150"
              >
                COMMIT LOG INTO WORKSPACE
              </button>
            </form>
          </div>

          {/* Create Custom Exercise */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow">
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-c pl-1 pb-2 font-mono flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-400" />
              ADD CUSTOM EXERCISE
            </h3>
            {exSuccess && (
              <div className="p-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-3xs font-mono rounded">
                Custom Exercise cataloged successfully.
              </div>
            )}
            <form onSubmit={createCustomExercise} className="space-y-4">
              <div>
                <label className="block text-3xs text-slate-400 font-mono mb-1">Exercise Name</label>
                <input
                  type="text"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded p-2 text-slate-300"
                  placeholder="Inverted Isometric rows..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-3xs text-slate-400 font-mono mb-1">Category</label>
                  <select
                    value={newExCategory}
                    onChange={(e) => setNewExCategory(e.target.value as any)}
                    className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded p-2 text-slate-350"
                  >
                    <option value="Chest">Chest</option>
                    <option value="Back">Back</option>
                    <option value="Legs">Legs</option>
                    <option value="Shoulders">Shoulders</option>
                    <option value="Arms">Arms</option>
                    <option value="Core">Core</option>
                  </select>
                </div>
                <div>
                  <label className="block text-3xs text-slate-400 font-mono mb-1">Equipment</label>
                  <input
                    type="text"
                    value={newExEquipment}
                    onChange={(e) => setNewExEquipment(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded p-2 text-slate-300"
                    placeholder="Barbell, Dumbbell..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-3xs text-slate-400 font-mono mb-1">Target Description</label>
                <textarea
                  value={newExDesc}
                  onChange={(e) => setNewExDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded p-2 text-slate-300"
                  placeholder="Primary focus, biomechanics description..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-slate-850 border border-slate-755 hover:bg-slate-800 text-xs font-mono text-slate-200 rounded transition duration-150"
              >
                PROVISION EXERCISE DEFINITION
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Searchable exercise explorer & progressions */}
        <div className="lg:col-span-8 space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart: Progressive Overload Weekly Volume */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-250 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Progressive Volume Overload Timeline
              </h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData?.timeline || [
                    { week: "Week 1", volume: 6160 },
                    { week: "Week 2", volume: 6300 },
                    { week: "Week 3", volume: 6505 },
                    { week: "Week 4", volume: 6790 }
                  ]}>
                    <defs>
                      <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a303c" />
                    <XAxis dataKey="week" stroke="#6b7280" style={{ fontSize: "10px", fontFamily: "monospace" }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: "10px", fontFamily: "monospace" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#e2e8f0", fontFamily: "monospace" }} />
                    <Area type="monotone" dataKey="volume" name="Workout Volume (kg)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorVol)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Volume distribution by Muscle */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-250 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-emerald-400" />
                Category Volume Breakdown (Biomechanical Stress)
              </h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData?.muscleVolume || [
                    { name: "Chest", value: 4100 },
                    { name: "Back", value: 3820 },
                    { name: "Legs", value: 3100 },
                    { name: "Shoulders", value: 1600 },
                    { name: "Arms", value: 890 },
                    { name: "Core", value: 450 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a303c" />
                    <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: "10px", fontFamily: "monospace" }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: "10px", fontFamily: "monospace" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", contentColor: "#cbd5e1", fontFamily: "monospace" }} />
                    <Bar dataKey="value" name="Volume Load (kg)" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Exercise Catalog List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-slate-250 font-mono flex items-center gap-1.5">
                <ListFilter className="w-4 h-4 text-indigo-400" />
                EXERCISE CATALOGUE ({exercises.length} FOUND)
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded text-xs font-mono text-slate-300 w-44 focus:outline-none focus:border-indigo-500"
                    placeholder="Search exercise..."
                  />
                </div>
                {/* Category filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-850 text-xs font-mono text-slate-300 rounded p-1.5 outline-none"
                >
                  <option value="all">All Muscle Target Type</option>
                  <option value="Chest">Chest</option>
                  <option value="Back">Back</option>
                  <option value="Legs">Legs</option>
                  <option value="Shoulders">Shoulders</option>
                  <option value="Arms">Arms</option>
                  <option value="Core">Core</option>
                </select>
                {/* Equipment filter */}
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  className="bg-slate-950 border border-slate-850 text-xs font-mono text-slate-300 rounded p-1.5 outline-none"
                >
                  <option value="all">All Equipment Types</option>
                  <option value="barbell">Barbell</option>
                  <option value="dumbbells">Dumbbells</option>
                  <option value="bodyweight">Bodyweight</option>
                  <option value="machine">Machine</option>
                  <option value="cables">Cables</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto pr-2">
              {exercises.map((e) => {
                // Check if we have logs recorded for this exercise to show a mini badge
                const hasLogs = logs.filter((log) => log.exerciseId === e.id).length;
                return (
                  <div
                    key={e.id}
                    onClick={() => setActiveExerciseId(e.id)}
                    className={`p-3.5 bg-slate-950 hover:bg-slate-850 border rounded-lg cursor-pointer transition flex flex-col justify-between ${
                      activeExerciseId === e.id ? "border-indigo-500 bg-slate-850" : "border-slate-850"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 bg-slate-850 text-slate-400 border border-slate-800 text-[9px] uppercase font-mono tracking-wider rounded">
                          {e.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500 font-mono italic">
                            {e.equipment}
                          </span>
                          {hasLogs > 0 && (
                            <span className="flex items-center gap-0.5 text-[8px] bg-emerald-500/10 border border-emerald-500/30 font-mono text-emerald-400 px-1 py-0.2 rounded">
                              <Award className="w-2.5 h-2.5" /> LOGS ({hasLogs})
                            </span>
                          )}
                        </div>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-200 mt-2 font-sans tracking-tight">
                        {e.name}
                      </h4>
                      <p className="text-4xs text-slate-400 mt-1 line-clamp-2 leading-relaxed font-mono">
                        {e.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-900/40">
                      <span className="text-4xs font-mono text-indigo-400 hover:underline flex items-center gap-0.5">
                        SELECT TARGET TO LOG <Plus className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
              {exercises.length === 0 && (
                <div className="col-span-2 text-center py-10 font-mono text-xs text-slate-500">
                  No exercise matching criteria is populated. Create custom definition above.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
