import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Ensure process.env is read (dotenv is importable if needed but usually parsed by node loader)
import "dotenv/config";

// Interface and standard models
interface User {
  id: string;
  email: string;
  username: string;
  role: "Admin" | "Researcher" | "User";
}

interface Exercise {
  id: string;
  name: string;
  category: "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core";
  equipment: string;
  description: string;
}

interface WorkoutLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  exerciseId: string;
  sets: { reps: number; weight: number }[];
}

interface Notebook {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  cells: {
    id: string;
    type: "code" | "markdown";
    source: string;
    output?: {
      type: "text" | "table" | "chart" | "error";
      content: string;
    };
  }[];
  createdAt: string;
}

interface ContainerSession {
  id: string;
  userId: string;
  username: string;
  status: "running" | "stopped" | "starting";
  cpuLimit: string;
  memoryLimit: string;
  uptime: number; // in seconds
  port: number;
}

interface K8sPod {
  name: string;
  namespace: string;
  status: "Running" | "Pending" | "Failed";
  cpu: string;
  memory: string;
  ip: string;
}

interface OpenStackResource {
  id: string;
  name: string;
  type: "Compute Instance" | "Block Volume" | "Network Router";
  flavor: string;
  status: "ACTIVE" | "PROVISIONING" | "SHUTOFF";
  ipAddress?: string;
  sizeGb?: number;
}

interface GitRepo {
  id: string;
  name: string;
  provider: "github" | "gitlab";
  url: string;
  connected: boolean;
  branches: string[];
  currentBranch: string;
  commits: { hash: string; author: string; message: string; date: string }[];
}

// In-memory Database with high-fidelity seed data
const users: Record<string, User & { passwordHash: string }> = {
  "admin-id": { id: "admin-id", email: "admin@liftops.io", username: "swanadmin", role: "Admin", passwordHash: "password" },
  "research-id": { id: "research-id", email: "research@liftops.io", username: "swanresearch", role: "Researcher", passwordHash: "password" },
  "user-id": { id: "user-id", email: "jitenmoni8@gmail.com", username: "swanjiten", role: "User", passwordHash: "password" }
};

// Exercise Database (50+ exercises)
const exercises: Exercise[] = [
  // Chest
  { id: "e1", name: "Barbell Bench Press", category: "Chest", equipment: "Barbell", description: "Standard compound lift for chest, shoulders, and triceps." },
  { id: "e2", name: "Incline Dumbbell Press", category: "Chest", equipment: "Dumbbells", description: "Target the upper pectoral fibers using an inclined bench." },
  { id: "e3", name: "Cable Crossover", category: "Chest", equipment: "Cables", description: "Isolation fly movement focusing on inner chest contraction." },
  { id: "e4", name: "Dips (Chest Focus)", category: "Chest", equipment: "Bodyweight", description: "Leaning forward on parallel bars targets the lower chest." },
  { id: "e5", name: "Push-ups", category: "Chest", equipment: "Bodyweight", description: "Classic bodyweight exercise for pectoral endurance and control." },
  { id: "e6", name: "Decline Bench Press", category: "Chest", equipment: "Barbell", description: "Target the lower chest part with decline angle." },
  { id: "e7", name: "Dumbbell Flyes", category: "Chest", equipment: "Dumbbells", description: "Stretches the chest fibers at the bottom, isolated stretch." },
  { id: "e8", name: "Pec Deck Fly", category: "Chest", equipment: "Machine", description: "Chest isolation with consistent resistance curve." },
  // Back
  { id: "e9", name: "Deadlift", category: "Back", equipment: "Barbell", description: "Ultimate test of posterior chain, back, traps, glutes and hamstrings." },
  { id: "e10", name: "Pull-ups", category: "Back", equipment: "Bodyweight", description: "Broaden the latissimus dorsi with high-intensity body resistance." },
  { id: "e11", name: "Barbell Rows", category: "Back", equipment: "Barbell", description: "Compound rowing motion for thickness in middle back." },
  { id: "e12", name: "Lat Pulldown", category: "Back", equipment: "Machine", description: "Excellent isolation variant for lat development and posture." },
  { id: "e13", name: "Seated Cable Row", category: "Back", equipment: "Cables", description: "Controlled horizontal row targeting lats, traps, and rhomboids." },
  { id: "e14", name: "Hyper-extensions", category: "Back", equipment: "Bodyweight", description: "Strengthen the lower back erector spinae muscles." },
  { id: "e15", name: "T-Bar Row", category: "Back", equipment: "Barbell", description: "Enables heavy neutral grip rowing for middle back mass." },
  { id: "e16", name: "Single-Arm Dumbbell Row", category: "Back", equipment: "Dumbbells", description: "Unilateral rowing movement to fix lats imbalances." },
  // Legs
  { id: "e17", name: "Barbell Back Squat", category: "Legs", equipment: "Barbell", description: "The king of leg movements, targeting quads, glutes, and core." },
  { id: "e18", name: "Romanian Deadlift", category: "Legs", equipment: "Barbell", description: "Isolate hamstrings and glutes with a hip hinge mechanism." },
  { id: "e19", name: "Leg Press", category: "Legs", equipment: "Machine", description: "Heavy load variation without spine loading stress." },
  { id: "e20", name: "Calf Raises", category: "Legs", equipment: "Bodyweight", description: "Isolate the gastrocnemius and soleus for lower leg bounds." },
  { id: "e21", name: "Bulgarian Split Squat", category: "Legs", equipment: "Dumbbells", description: "Intense unilateral exercise for quads balance and hip stability." },
  { id: "e22", name: "Leg Extensions", category: "Legs", equipment: "Machine", description: "Strict quadriceps isolation to develop definition and power." },
  { id: "e23", name: "Lying Hamstring Curl", category: "Legs", equipment: "Machine", description: "Anatomical knee flexion isolation targeting hamstring fibers." },
  { id: "e24", name: "Walking Lunges", category: "Legs", equipment: "Dumbbells", description: "Dynamic lower-body conditioner improving functional gait." },
  // Shoulders
  { id: "e25", name: "Overhead Military Press", category: "Shoulders", equipment: "Barbell", description: "Compound press targeting vertical push strength, anterior delts." },
  { id: "e26", name: "Dumbbell Lateral Raise", category: "Shoulders", equipment: "Dumbbells", description: "Isolate lateral deltoids to build physical shoulder width." },
  { id: "e27", name: "Rear Delt Fly", category: "Shoulders", equipment: "Dumbbells", description: "Target the rear deltoid area for muscular back-to-shoulder transition." },
  { id: "e28", name: "Arnold Press", category: "Shoulders", equipment: "Dumbbells", description: "Rotational press covering anterior and lateral deltoid fibers." },
  { id: "e29", name: "Face Pulls", category: "Shoulders", equipment: "Cables", description: "Rotator cuff and rear deltoid health compound developer." },
  { id: "e30", name: "Barbell Shrugs", category: "Shoulders", equipment: "Barbell", description: "Target the upper trapezius muscles directly." },
  // Arms
  { id: "e31", name: "Barbell Bicep Curl", category: "Arms", equipment: "Barbell", description: "Classic compound isolation for biceps brachii thickness." },
  { id: "e32", name: "Triceps Pushdown", category: "Arms", equipment: "Cables", description: "Continuous cable tension for triceps lateral head development." },
  { id: "e33", name: "Incline Dumbbell Curl", category: "Arms", equipment: "Dumbbells", description: "Biceps long head builder using a deep pre-stretch position." },
  { id: "e34", name: "Skull Crushers", category: "Arms", equipment: "Barbell", description: "Overhead triceps extension compound targeting long-head mass." },
  { id: "e35", name: "Hammer Curls", category: "Arms", equipment: "Dumbbells", description: "Develop brachioradialis and forearm thickness." },
  { id: "e36", name: "Close-Grip Bench Press", category: "Arms", equipment: "Barbell", description: "Target triceps using a chest-press format." },
  // Core
  { id: "e37", name: "Cable Woodchoppers", category: "Core", equipment: "Cables", description: "Rotational stability exercise mimicking athletic motions." },
  { id: "e38", name: "Plank", category: "Core", equipment: "Bodyweight", description: "Isometric endurance developer for deep core transverse abdomens." },
  { id: "e39", name: "Hanging Leg Raise", category: "Core", equipment: "Bodyweight", description: "Intense lower rectus abdominis and hip flexors builder." },
  { id: "e40", name: "Ab Wheel Rollout", category: "Core", equipment: "Rollers", description: "Anti-extension core development for spinal protection." }
];

// Seed Historical Workout Logging Data for user-id (Last 4 weeks)
let workoutLogs: WorkoutLog[] = [
  // Session week 1 (4 weeks ago)
  { id: "wl-1", userId: "user-id", date: "2026-05-01", exerciseId: "e1", sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 70 }, { reps: 6, weight: 80 }] },
  { id: "wl-1b", userId: "user-id", date: "2026-05-01", exerciseId: "e9", sets: [{ reps: 5, weight: 100 }, { reps: 5, weight: 120 }, { reps: 5, weight: 140 }] },
  { id: "wl-2", userId: "user-id", date: "2026-05-03", exerciseId: "e17", sets: [{ reps: 10, weight: 80 }, { reps: 8, weight: 90 }, { reps: 8, weight: 100 }] },
  { id: "wl-3", userId: "user-id", date: "2026-05-05", exerciseId: "e11", sets: [{ reps: 10, weight: 50 }, { reps: 10, weight: 60 }, { reps: 8, weight: 70 }] },

  // Session week 2 (3 weeks ago)
  { id: "wl-4", userId: "user-id", date: "2026-05-08", exerciseId: "e1", sets: [{ reps: 10, weight: 65 }, { reps: 8, weight: 75 }, { reps: 6, weight: 85 }] },
  { id: "wl-4b", userId: "user-id", date: "2026-05-08", exerciseId: "e9", sets: [{ reps: 5, weight: 110 }, { reps: 5, weight: 130 }, { reps: 4, weight: 150 }] },
  { id: "wl-5", userId: "user-id", date: "2026-05-10", exerciseId: "e17", sets: [{ reps: 10, weight: 85 }, { reps: 8, weight: 95 }, { reps: 6, weight: 110 }] },
  { id: "wl-6", userId: "user-id", date: "2026-05-12", exerciseId: "e11", sets: [{ reps: 10, weight: 55 }, { reps: 8, weight: 65 }, { reps: 8, weight: 75 }] },

  // Session week 3 (2 weeks ago)
  { id: "wl-7", userId: "user-id", date: "2026-05-15", exerciseId: "e1", sets: [{ reps: 10, weight: 70 }, { reps: 8, weight: 80 }, { reps: 5, weight: 90 }] },
  { id: "wl-7b", userId: "user-id", date: "2026-05-15", exerciseId: "e9", sets: [{ reps: 5, weight: 120 }, { reps: 5, weight: 140 }, { reps: 3, weight: 155 }] },
  { id: "wl-8", userId: "user-id", date: "2026-05-17", exerciseId: "e17", sets: [{ reps: 10, weight: 90 }, { reps: 8, weight: 105 }, { reps: 6, weight: 115 }] },
  { id: "wl-9", userId: "user-id", date: "2026-05-19", exerciseId: "e11", sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 70 }, { reps: 6, weight: 80 }] },

  // Session week 4 (This week)
  { id: "wl-10", userId: "user-id", date: "2026-05-25", exerciseId: "e1", sets: [{ reps: 10, weight: 72.5 }, { reps: 8, weight: 82.5 }, { reps: 6, weight: 92.5 }] },
  { id: "wl-10b", userId: "user-id", date: "2026-05-25", exerciseId: "e9", sets: [{ reps: 5, weight: 125 }, { reps: 5, weight: 145 }, { reps: 5, weight: 160 }] },
  { id: "wl-11", userId: "user-id", date: "2026-05-27", exerciseId: "e17", sets: [{ reps: 10, weight: 95 }, { reps: 8, weight: 110 }, { reps: 6, weight: 120 }] },
  { id: "wl-12", userId: "user-id", date: "2026-05-28", exerciseId: "e11", sets: [{ reps: 10, weight: 62.5 }, { reps: 8, weight: 72.5 }, { reps: 8, weight: 82.5 }] },
];

// Curated active template notebooks
let notebooks: Notebook[] = [
  {
    id: "nh-1",
    title: "Overload Analysis.ipynb",
    ownerId: "user-id",
    ownerName: "swanjiten",
    createdAt: "2026-05-28T10:00:00Z",
    cells: [
      {
        id: "c-1",
        type: "markdown",
        source: "# Progressive Overload & Biorhythms Analytics\nDeveloped for LiftOps SWAN. This interactive notebook downloads workout logs, calculates weekly cumulative training volume, filters outliers, and computes predictive max thresholds."
      },
      {
        id: "c-2",
        type: "code",
        source: "import pandas as pd\nimport numpy as np\n\n# Loading current SWAN user's workout volume database...\ndata = {\n    'Week': ['Week 1', 'Week 2', 'Week 3', 'Week 4'],\n    'Bench_Press_Vol_kg': [1640, 1710, 1790, 1940],\n    'Deadlift_Vol_kg': [2200, 2180, 2265, 2300],\n    'Squats_Vol_kg': [2320, 2410, 2450, 2550]\n}\ndf = pd.DataFrame(data)\ndf['Total_Volume_kg'] = df['Bench_Press_Vol_kg'] + df['Deadlift_Vol_kg'] + df['Squats_Vol_kg']\ndf",
        output: {
          type: "table",
          content: "Week      | Bench_Press_Vol_kg | Deadlift_Vol_kg | Squats_Vol_kg | Total_Volume_kg\n----------|--------------------|-----------------|---------------|----------------\nWeek 1    | 1640               | 2200            | 2320          | 6160\nWeek 2    | 1710               | 2180            | 2410          | 6300\nWeek 3    | 1790               | 2265            | 2450          | 6505\nWeek 4    | 1940               | 2300            | 2550          | 6790"
        }
      },
      {
        id: "c-3",
        type: "markdown",
        source: "### Calculate Progression Rate\nLet's apply a basic pandas percentage modification function to observe the week-on-week enhancement."
      },
      {
        id: "c-4",
        type: "code",
        source: "df['Progression_Pct'] = df['Total_Volume_kg'].pct_change() * 100\nprint(\"Average Weekly Progression Rate:\", round(df['Progression_Pct'].mean(), 2), \"%\")\ndf[['Week', 'Total_Volume_kg', 'Progression_Pct']]",
        output: {
          type: "text",
          content: "Average Weekly Progression Rate: 3.3 % \n\n     Week  Total_Volume_kg  Progression_Pct\n0  Week 1             6160              NaN\n1  Week 2             6300         2.272727\n2  Week 3             6505         3.253968\n3  Week 4             6790         4.381245"
        }
      }
    ]
  },
  {
    id: "nh-2",
    title: "Myocardial-Metabolic Response.ipynb",
    ownerId: "research-id",
    ownerName: "swanresearch",
    createdAt: "2026-05-24T12:00:00Z",
    cells: [
      {
        id: "c-10",
        type: "markdown",
        source: "# Heart Rate Recovery (HRR) Decay Rate\nInvestigating the correlation between post-exercise hyper-ventilation cardiac deceleration and 1-Rep Max benchmarks."
      },
      {
        id: "c-11",
        type: "code",
        source: "import numpy as np\n# Exponential decay simulation: HR(t) = HR_rest + (HR_peak - HR_rest) * e^(-k * t)\nt = np.array([0, 30, 60, 90, 120])\nhr = np.array([178, 142, 115, 94, 78])\n# Fitted recovery coefficient k matches highly efficient cardiovascular athletic profiles\nprint(\"Fitted Athletic Deceleration Factor K: 0.024 s^-1\")",
        output: {
          type: "text",
          content: "Fitted Athletic Deceleration Factor K: 0.024 s^-1"
        }
      }
    ]
  }
];

// Isolated Workspace Containers Database
let activeContainers: ContainerSession[] = [
  { id: "cont-1", userId: "user-id", username: "swanjiten", status: "running", cpuLimit: "1.0 Core", memoryLimit: "2.0 GB", uptime: 12400, port: 8201 },
  { id: "cont-2", userId: "admin-id", username: "swanadmin", status: "stopped", cpuLimit: "2.0 Cores", memoryLimit: "4.0 GB", uptime: 0, port: 8202 }
];

// Kubernetes Cockpit Simulated Pods
let kubernetesPods: K8sPod[] = [
  { name: "swan-ingress-controller-65fd8d", namespace: "kube-system", status: "Running", cpu: "12%", memory: "110MB", ip: "10.244.0.12" },
  { name: "jupyterhub-deployment-99bc2d", namespace: "swan-platform", status: "Running", cpu: "4%", memory: "220MB", ip: "10.244.1.34" },
  { name: "liftops-backend-state-8cadd9", namespace: "swan-platform", status: "Running", cpu: "8%", memory: "180MB", ip: "10.244.1.35" },
  { name: "postgres-db-deployment-ffd7ea", namespace: "swan-platform", status: "Running", cpu: "18%", memory: "320MB", ip: "10.244.1.36" },
  { name: "swan-user-jupyter-pod-swanjiten", namespace: "swan-users", status: "Running", cpu: "2%", memory: "450MB", ip: "10.244.2.4" }
];

// K8s HPA parameters
let hpaSettings = {
  minReplicas: 2,
  maxReplicas: 10,
  targetCpuUtilization: 80,
  currentReplicas: 3
};

// OpenStack Cloud Resource Allocation
let openstackResources: OpenStackResource[] = [
  { id: "os-vm1", name: "Compute-Worker-01", type: "Compute Instance", flavor: "m1.medium (2 VCPU, 4GB RAM)", status: "ACTIVE", ipAddress: "192.168.10.15" },
  { id: "os-vm2", name: "Compute-Worker-02", type: "Compute Instance", flavor: "m1.medium (2 VCPU, 4GB RAM)", status: "PROVISIONING", ipAddress: "192.168.10.16" },
  { id: "os-vol1", name: "SWAN-ObjectStore-LUN0", type: "Block Volume", flavor: "PureSSD LUN Block", status: "ACTIVE", sizeGb: 200 },
  { id: "os-net1", name: "SWAN-Router-Public", type: "Network Router", flavor: "Cisco CSR vNIC", status: "ACTIVE", ipAddress: "100.64.0.1" }
];

// Connected Repositories Workflow
let gitRepos: GitRepo[] = [
  {
    id: "git-1",
    name: "swanjiten/swan-workout-models",
    provider: "github",
    url: "https://github.com/swanjiten/swan-workout-models.git",
    connected: true,
    branches: ["main", "dev-feature-cardio", "regression-test"],
    currentBranch: "main",
    commits: [
      { hash: "ae0df31", author: "swanjiten", message: "Initial Pandas parser pipeline for 1-Rep Max strength indicators", date: "2026-05-28T09:12:00Z" },
      { hash: "7fbc5a2", author: "swanjiten", message: "Optimized deadlift volume percentage breakdown", date: "2026-05-26T14:45:00Z" },
    ]
  },
  {
    id: "git-2",
    name: "swan-platform/gitlab-cern-research-pipelines",
    provider: "gitlab",
    url: "https://gitlab.com/swan-platform/gitlab-cern-research-pipelines.git",
    connected: false,
    branches: ["master"],
    currentBranch: "master",
    commits: []
  }
];

// Live Notifications and Active Log Simulation
let livePresence = [
  { username: "swanjiten", activeNotebook: "Overload Analysis.ipynb", location: "Room 4-2-CERN", isMe: true },
  { username: "swanresearch", activeNotebook: "Myocardial-Metabolic Response.ipynb", location: "LHC-Atlas-Control", isMe: false },
  { username: "swanadmin", activeNotebook: "DevOps Console", location: "IT-Infra-Sec-9", isMe: false },
];

let serverLogs: string[] = [
  "[SYSTEM] Kernel initialized successfully",
  "[SYSTEM] Port 3000 mapped for CERN-SWAN Proxy Ingress",
  "[INFRA] Mounting persistent CephFS block Storage volumes to /mnt/swan-volumes",
  "[JUPYTER] Spawning Jupyter REST gateway on endpoint http://localhost:8888",
  "[DOCKER] Container cont-1 spun up successfully by researcher swanjiten",
  "[PROMETHEUS] Scraping active metrics from node exporter client 10.244.0.12",
  "[KUBE] Namespace 'swan-platform' configured with standard CPU/Memory requests with RBAC rules",
  "[SWAN-API] LiftOps SWAN production REST controllers bound securely to server."
];

// CI/CD pipelines simulated pipeline run
let liveCicdPipeline = {
  running: false,
  progress: 100,
  activeStep: "idle", // "linting", "testing", "building", "deployment", "done"
  logs: [] as string[],
  status: "success" // "idle", "running", "success", "failed"
};

// Start a thread to add random server logs, prometheus metrics or change container uptimes
setInterval(() => {
  // Update uptime
  activeContainers.forEach(c => {
    if (c.status === "running") {
      c.uptime += 5;
    }
  });

  // Random log insertion periodically to simulate active ecosystem
  if (Math.random() > 0.6) {
    const alerts = [
      `[PROMETHEUS] Alertmanager reported CPU spikes of 4.5% on Jupiter node Jupyter-swanjiten`,
      `[DOCKER] Syncing volumes in background for swanjiten workspace. Saved to local storage-pool.`,
      `[KUBE] HorizontalPodAutoscaler assessed jupyter-deployment. Scaling factor stable at 3 replicas.`,
      `[API] User swanjiten queried exercise catalogs. 200 OK`,
      `[GIT] Checked repository sync for swanjiten/swan-workout-models: UP-TO-DATE.`
    ];
    const log = alerts[Math.floor(Math.random() * alerts.length)];
    serverLogs.push(`[${new Date().toISOString().split("T")[1].slice(0, 8)}] ${log}`);
    if (serverLogs.length > 80) serverLogs.shift();
  }
}, 5000);

// Initialize Gemini API Client lazily if the key is available
let aiClient: any = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ----------------------
  // 1. JWT / Auth Endpoints
  // ----------------------
  app.post("/api/auth/register", (req, res) => {
    const { email, username, password, role } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: "Missing registration fields" });
    }
    const id = "user-" + Math.random().toString(36).substring(2, 9);
    users[id] = { id, email, username, role: role || "User", passwordHash: password };
    return res.json({ success: true, user: { id, email, username, role: role || "User" } });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const matchedUser = Object.values(users).find(u => u.email === email && u.passwordHash === password);
    if (!matchedUser) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    return res.json({
      token: "mock-jwt-" + Math.random().toString(36).substring(2, 12),
      user: {
        id: matchedUser.id,
        email: matchedUser.email,
        username: matchedUser.username,
        role: matchedUser.role
      }
    });
  });

  // ----------------------
  // 2. Workout and Exercise Catalog
  // ----------------------
  app.get("/api/exercises", (req, res) => {
    const { search, category, equipment } = req.query;
    let filtered = [...exercises];
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(e => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }
    if (category) {
      filtered = filtered.filter(e => e.category === category);
    }
    if (equipment) {
      filtered = filtered.filter(e => e.equipment.toLowerCase() === String(equipment).toLowerCase());
    }
    res.json(filtered);
  });

  app.post("/api/exercises", (req, res) => {
    const { name, category, equipment, description } = req.body;
    if (!name || !category || !equipment) {
      return res.status(400).json({ error: "Name, category and equipment required" });
    }
    const newEx: Exercise = {
      id: "e-" + Math.random().toString(36).substring(2, 6),
      name,
      category,
      equipment,
      description: description || "Custom exercise."
    };
    exercises.push(newEx);
    res.json(newEx);
  });

  app.get("/api/workouts/log", (req, res) => {
    const { userId } = req.query;
    const uid = userId ? String(userId) : "user-id";
    const logs = workoutLogs.filter(l => l.userId === uid);
    res.json(logs);
  });

  app.post("/api/workouts/log", (req, res) => {
    const { userId, date, exerciseId, sets } = req.body;
    if (!exerciseId || !sets || !Array.isArray(sets)) {
      return res.status(400).json({ error: "Exercise ID and sets array required" });
    }
    const newLog: WorkoutLog = {
      id: "wl-" + Math.random().toString(36).substring(2, 7),
      userId: userId || "user-id",
      date: date || new Date().toISOString().split("T")[0],
      exerciseId,
      sets: sets.map(s => ({ reps: Number(s.reps || 10), weight: Number(s.weight || 0) }))
    };
    workoutLogs.push(newLog);

    // Sync a new server log
    serverLogs.push(`[${new Date().toISOString().split("T")[1].slice(0, 8)}] [SYSTEM] Workout Logged: 1RM Calculated on exercise ${exerciseId}`);
    res.json(newLog);
  });

  // ----------------------
  // 3. Advanced Workout Analytics Endpoints
  // ----------------------
  app.get("/api/analytics/summary", (req, res) => {
    const { userId } = req.query;
    const uid = userId ? String(userId) : "user-id";
    const logs = workoutLogs.filter(l => l.userId === uid);

    // 1. Calculate Est 1RM progression per week for key exercises: Bench Press (e1), Deadlift (e9), Squat (e17)
    // Epley formula: 1RM = w * (1 + r / 30)
    const computeMax = (sets: { reps: number; weight: number }[]) => {
      let max1rm = 0;
      sets.forEach(s => {
        const est = s.weight * (1 + s.reps / 30);
        if (est > max1rm) max1rm = est;
      });
      return max1rm;
    };

    // Group logs by date or week
    const exercisePRs: Record<string, number> = {};
    const muscleGroupVolume: Record<string, number> = { Chest: 0, Back: 0, Legs: 0, Shoulders: 0, Arms: 0, Core: 0 };
    let totalTrainingVolume = 0;

    logs.forEach(log => {
      const ex = exercises.find(e => e.id === log.exerciseId);
      if (!ex) return;

      const logVolume = log.sets.reduce((acc, s) => acc + (s.reps * s.weight), 0);
      muscleGroupVolume[ex.category] = (muscleGroupVolume[ex.category] || 0) + logVolume;
      totalTrainingVolume += logVolume;

      const est1RM = computeMax(log.sets);
      if (!exercisePRs[ex.name] || est1RM > exercisePRs[ex.name]) {
        exercisePRs[ex.name] = Math.round(est1RM);
      }
    });

    // Create regression timeline
    const timeline = [
      { week: "Week 1", bench: 80, deadlift: 140, squat: 100, volume: 6160 },
      { week: "Week 2", bench: 85, deadlift: 150, squat: 110, volume: 6300 },
      { week: "Week 3", bench: 90, deadlift: 155, squat: 115, volume: 6505 },
      { week: "Week 4", bench: 92.5, deadlift: 160, squat: 120, volume: 6790 }
    ];

    res.json({
      muscleVolume: Object.entries(muscleGroupVolume).map(([name, value]) => ({ name, value })),
      prs: Object.entries(exercisePRs).map(([name, value]) => ({ name, value })),
      totalVolume: totalTrainingVolume,
      timeline
    });
  });

  // ----------------------
  // 4. JupyterHub Environment Simulation
  // ----------------------
  app.get("/api/notebooks", (req, res) => {
    res.json(notebooks);
  });

  app.get("/api/notebooks/:id", (req, res) => {
    const notebook = notebooks.find(n => n.id === req.params.id);
    if (!notebook) return res.status(404).json({ error: "Notebook not found" });
    res.json(notebook);
  });

  app.post("/api/notebooks", (req, res) => {
    const { title, userId, username } = req.body;
    const newNb: Notebook = {
      id: "nh-" + Math.random().toString(36).substring(2, 6),
      title: title || "Untitled_Notebook.ipynb",
      ownerId: userId || "user-id",
      ownerName: username || "swanjiten",
      createdAt: new Date().toISOString(),
      cells: [
        { id: "c-init1", type: "markdown", source: "# Welcome to your Jupyter Workspace\nStart analyzing using raw Python pandas data structures." },
        { id: "c-init2", type: "code", source: "# Calculate basic metabolic indexes:\nweight = 85.2 # kg\nheight = 1.83 # m\nbmi = weight / (height ** 2)\nprint(f\"Target Body Mass Index: {round(bmi, 2)} kg/m^2\")", output: { type: "text", content: "Target Body Mass Index: 25.44 kg/m^2" } }
      ]
    };
    notebooks.push(newNb);
    res.json(newNb);
  });

  app.put("/api/notebooks/:id/cells", (req, res) => {
    const index = notebooks.findIndex(n => n.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Notebook not found" });
    notebooks[index].cells = req.body.cells;
    res.json(notebooks[index]);
  });

  // Code Execution Route
  app.post("/api/notebooks/:id/cells/:cellId/execute", async (req, res) => {
    const { code } = req.body;
    // Execute simulation. If Gemini is available, use it to evaluate/explain or generate Python-style dummy responses!
    const gemini = getGeminiClient();

    let simulatedOutput = "";
    let simulatedType: "text" | "table" | "chart" | "error" = "text";

    if (gemini) {
      try {
        const response = await gemini.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `You are simulating a Python Jupyter kernel in LiftOps SWAN.
Identify what outputs this cell code would produce if run in Python with Pandas, Numpy, Matplotlib.
Return ONLY a short JSON response following this structure:
{
  "output_type": "text" or "table" or "chart" or "error",
  "content": "The actual console log, ASCII dataframe table, error details, or description of the plotted chart."
}
Here is the user's code:
\`\`\`python
${code}
\`\`\`
`,
          config: {
            responseMimeType: "application/json"
          }
        });
        const parsed = JSON.parse(response.text.trim());
        simulatedType = parsed.output_type || "text";
        simulatedOutput = parsed.content || "Code executed successfully.";
      } catch (err) {
        simulatedType = "error";
        simulatedOutput = "Simulated execution error. Failed to query Gemini engine: " + String(err);
      }
    } else {
      // Rule-based fallbacks for offline execution experience
      const c = code.toLowerCase();
      if (c.includes("import pandas") || c.includes("pd.dataframe")) {
        simulatedType = "table";
        simulatedOutput = "Index | Exercise            | Peak_Volume | Overload_Status\n------|---------------------|-------------|----------------\n0     | Deadlift            | 2800 kg     | Achieved\n1     | Squats              | 2550 kg     | Achieved\n2     | Overhead Press      | 940 kg      | High Recovery\n3     | Barbell Bicep Curl  | 560 kg      | Deload Advised";
      } else if (c.includes("plt.") || c.includes("matplotlib") || c.includes("sns.scatterplot")) {
        simulatedType = "chart";
        simulatedOutput = "[Matplotlib Canvas Visualizer Map: Linear Regression Fit of Workout Fatigue vs. Night Sleep Hours (R^2 = 0.84)]";
      } else if (c.includes("print(") || c.includes("=")) {
        // Evaluate simple things or print
        if (c.includes("bmi")) {
          simulatedType = "text";
          simulatedOutput = "Target Body Mass Index: 25.44 kg/m^2\nSimulation success.";
        } else {
          simulatedType = "text";
          const matchPrint = code.match(/print\((.*?)\)/);
          simulatedOutput = matchPrint ? `[Console Output]: ${matchPrint[1].replace(/['"]/g, "")}` : "Code executed successfully. Variables allocated in active memory.";
        }
      } else if (c.includes("error") || c.includes("raise ")) {
        simulatedType = "error";
        simulatedOutput = "NameError: name 'undefined_variable' is not defined\nLine 2: index = undefined_variable * 10";
      } else {
        simulatedType = "text";
        simulatedOutput = "Output:\nCell executed in 0.043s successfully. Standard process code 0.";
      }
    }

    // Save this back into notebooks database
    const notebook = notebooks.find(n => n.id === req.params.id);
    if (notebook) {
      const cell = notebook.cells.find(cl => cl.id === req.params.cellId);
      if (cell) {
        cell.output = { type: simulatedType, content: simulatedOutput };
      }
    }

    res.json({ type: simulatedType, content: simulatedOutput });
  });

  // ----------------------
  // 5. Containerized User Session Controls
  // ----------------------
  app.get("/api/containers", (req, res) => {
    res.json(activeContainers);
  });

  app.post("/api/containers/:id/:action", (req, res) => {
    const { id, action } = req.params;
    const container = activeContainers.find(c => c.id === id);
    if (!container) return res.status(404).json({ error: "Container not found" });

    if (action === "start") {
      container.status = "running";
      container.uptime = 1;
      serverLogs.push(`[SYSTEM] Container ${id} spun up successfully.`);
    } else if (action === "stop") {
      container.status = "stopped";
      container.uptime = 0;
      serverLogs.push(`[SYSTEM] Container ${id} stopped by administrator.`);
    } else if (action === "restart") {
      container.status = "starting";
      container.uptime = 0;
      setTimeout(() => container.status = "running", 2000);
      serverLogs.push(`[SYSTEM] Container ${id} triggered graceful restart workflow.`);
    }

    res.json(container);
  });

  app.post("/api/containers", (req, res) => {
    const { userId, username, cpuLimit, memoryLimit } = req.body;
    const newCont: ContainerSession = {
      id: "cont-" + Math.random().toString(36).substring(2, 6),
      userId: userId || "user-id",
      username: username || "swanjiten",
      status: "running",
      cpuLimit: cpuLimit || "1.0 Core",
      memoryLimit: memoryLimit || "2.0 GB",
      uptime: 5,
      port: 8200 + activeContainers.length + 1
    };
    activeContainers.push(newCont);
    serverLogs.push(`[SYSTEM] Provisioned isolated Jupyter Workspace Container ${newCont.id} [${cpuLimit || "1.0 Core"}, ${memoryLimit || "2.0 GB"}]`);
    res.json(newCont);
  });

  // ----------------------
  // 6. Kubernetes Infrastructure APIs
  // ----------------------
  app.get("/api/kubernetes/pods", (req, res) => {
    res.json(kubernetesPods);
  });

  app.post("/api/kubernetes/pods/deploy", (req, res) => {
    const { name, namespace } = req.body;
    const newPod: K8sPod = {
      name: name || "swan-user-pod-" + Math.random().toString(36).substring(2, 6),
      namespace: namespace || "swan-users",
      status: "Running",
      cpu: "1.2%",
      memory: "180MB",
      ip: `10.244.2.${Math.floor(Math.random() * 250) + 10}`
    };
    kubernetesPods.push(newPod);
    serverLogs.push(`[KUBE] Scheduled pod ${newPod.name} on node cern-worker-3`);
    res.json(newPod);
  });

  app.delete("/api/kubernetes/pods/:name", (req, res) => {
    kubernetesPods = kubernetesPods.filter(p => p.name !== req.params.name);
    serverLogs.push(`[KUBE] Terminated pod ${req.params.name} gracefully.`);
    res.json({ success: true });
  });

  app.get("/api/kubernetes/hpa", (req, res) => {
    res.json(hpaSettings);
  });

  app.put("/api/kubernetes/hpa", (req, res) => {
    hpaSettings = { ...hpaSettings, ...req.body };
    serverLogs.push(`[KUBE] HPA horizontal policy limits modified by operator. Scale range: ${hpaSettings.minReplicas}-${hpaSettings.maxReplicas}`);
    res.json(hpaSettings);
  });

  // ----------------------
  // 7. OpenStack Cloud Infrastructure APIs
  // ----------------------
  app.get("/api/openstack/resources", (req, res) => {
    res.json(openstackResources);
  });

  app.post("/api/openstack/resources", (req, res) => {
    const { name, type, flavor, sizeGb } = req.body;
    const newRes: OpenStackResource = {
      id: "os-" + Math.random().toString(36).substring(2, 6),
      name: name || "OS-Worker-Compute",
      type: type || "Compute Instance",
      flavor: flavor || "m1.medium (2 VCPU, 4GB RAM)",
      sizeGb: sizeGb ? Number(sizeGb) : undefined,
      status: "ACTIVE",
      ipAddress: type === "Compute Instance" ? `192.168.10.${Math.floor(Math.random() * 100) + 50}` : undefined
    };
    openstackResources.push(newRes);
    serverLogs.push(`[OPENSTACK] Allocated raw resource ${newRes.name} of type ${newRes.type} successfully.`);
    res.json(newRes);
  });

  app.delete("/api/openstack/resources/:id", (req, res) => {
    openstackResources = openstackResources.filter(r => r.id !== req.params.id);
    serverLogs.push(`[OPENSTACK] Terminated flavor resource instance: ${req.params.id}`);
    res.json({ success: true });
  });

  // ----------------------
  // 8. GitHub/GitLab Integration APIs
  // ----------------------
  app.get("/api/git/repos", (req, res) => {
    res.json(gitRepos);
  });

  app.post("/api/git/connect", (req, res) => {
    const { repoId } = req.body;
    const r = gitRepos.find(rp => rp.id === repoId);
    if (r) {
      r.connected = true;
      serverLogs.push(`[GIT] Connected secure OAuth integration channel with provider repo: ${r.name}`);
    }
    res.json({ success: true, repos: gitRepos });
  });

  app.post("/api/git/:id/commit", (req, res) => {
    const { message, author } = req.body;
    const r = gitRepos.find(rp => rp.id === req.params.id);
    if (!r) return res.status(404).json({ error: "Repo not found" });

    const newCommit = {
      hash: Math.random().toString(16).substring(2, 9),
      author: author || "swanjiten",
      message: message || "Refined training regressions & dynamic neural parameters",
      date: new Date().toISOString()
    };
    r.commits.unshift(newCommit);
    serverLogs.push(`[GIT] User ${author} pushed commit ${newCommit.hash} into branch ${r.currentBranch}`);
    res.json(r);
  });

  // ----------------------
  // 9. DevOps & CI/CD Pipeline Streams
  // ----------------------
  app.get("/api/cicd", (req, res) => {
    res.json(liveCicdPipeline);
  });

  app.post("/api/cicd/trigger", (req, res) => {
    if (liveCicdPipeline.running) {
      return res.status(400).json({ error: "Pipeline already running" });
    }

    liveCicdPipeline.running = true;
    liveCicdPipeline.progress = 0;
    liveCicdPipeline.status = "running";
    liveCicdPipeline.logs = ["[CI] Triggered pipeline runner for swanjiten/swan-workout-models"];

    const steps = [
      { name: "linting", time: 1500, log: "[CI] Step 1: Running ESLint and TS compiler flags... All tests compiled successfully [84 files]." },
      { name: "testing", time: 2500, log: "[CI] Step 2: Launching PyTest backend workout core tests... 142 passed, 0 failed. Direct SQL connection simulated with 100% test coverage." },
      { name: "building", time: 2500, log: "[CI] Step 3: Compiling docker production layers: docker build -t liftops/swan-jupiter:latest . Base OS Alpine size: 45MB" },
      { name: "deployment", time: 2000, log: "[CI] Step 4: Rolling out K8s state update via Helm charts to swan-platform namespace." },
      { name: "done", time: 1000, log: "[CI] Step 5: Rolling release completed. Ingress status 200 OK. Dynamic routing stable." }
    ];

    let currentStepIndex = 0;

    const runNextStep = () => {
      if (currentStepIndex >= steps.length) {
        liveCicdPipeline.running = false;
        liveCicdPipeline.progress = 100;
        liveCicdPipeline.activeStep = "idle";
        liveCicdPipeline.status = "success";
        liveCicdPipeline.logs.push("[CI] PIPELINE SUCCESS. Platform fully synced.");
        serverLogs.push("[SYS-CI] Microservice deployment rolled out to Helm node successfully.");
        return;
      }

      const step = steps[currentStepIndex];
      liveCicdPipeline.activeStep = step.name;
      liveCicdPipeline.progress = Math.round(((currentStepIndex + 1) / steps.length) * 100);
      liveCicdPipeline.logs.push(step.log);

      currentStepIndex++;
      setTimeout(runNextStep, step.time);
    };

    setTimeout(runNextStep, 800);
    res.json(liveCicdPipeline);
  });

  // ----------------------
  // 10. System Metrics & Logs
  // ----------------------
  app.get("/api/system/metrics", (req, res) => {
    // Generate slight oscillations for prometheus / grafana simulation
    const cpuOsc = Math.round(35 + Math.sin(Date.now() / 15000) * 10 + Math.random() * 5);
    const memOsc = Math.round(58 + Math.cos(Date.now() / 20000) * 3 + Math.random() * 2);
    const netOsc = Math.round(120 + Math.sin(Date.now() / 10000) * 40 + Math.random() * 15);

    res.json({
      cpu: cpuOsc,
      memory: memOsc,
      network: netOsc,
      activeUsers: livePresence.length,
      activeContainers: activeContainers.filter(c => c.status === "running").length,
      kubePodsCount: kubernetesPods.length
    });
  });

  app.get("/api/system/logs", (req, res) => {
    res.json(serverLogs);
  });

  app.get("/api/system/presence", (req, res) => {
    res.json(livePresence);
  });

  // Serve static assets in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LIFTOPS SWAN] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Fatal: failed to trigger LiftOps SWAN server boot:", err);
});
