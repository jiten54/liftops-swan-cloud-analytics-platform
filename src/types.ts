export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: "Admin" | "Researcher" | "User";
}

export interface Exercise {
  id: string;
  name: string;
  category: "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core";
  equipment: string;
  description: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  date: string;
  exerciseId: string;
  sets: { reps: number; weight: number }[];
}

export interface NotebookCell {
  id: string;
  type: "code" | "markdown";
  source: string;
  output?: {
    type: "text" | "table" | "chart" | "error";
    content: string;
  };
}

export interface Notebook {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  cells: NotebookCell[];
  createdAt: string;
}

export interface ContainerSession {
  id: string;
  userId: string;
  username: string;
  status: "running" | "stopped" | "starting";
  cpuLimit: string;
  memoryLimit: string;
  uptime: number;
  port: number;
}

export interface K8sPod {
  name: string;
  namespace: string;
  status: "Running" | "Pending" | "Failed";
  cpu: string;
  memory: string;
  ip: string;
}

export interface OpenStackResource {
  id: string;
  name: string;
  type: "Compute Instance" | "Block Volume" | "Network Router";
  flavor: string;
  status: "ACTIVE" | "PROVISIONING" | "SHUTOFF";
  ipAddress?: string;
  sizeGb?: number;
}

export interface GitRepo {
  id: string;
  name: string;
  provider: "github" | "gitlab";
  url: string;
  connected: boolean;
  branches: string[];
  currentBranch: string;
  commits: { hash: string; author: string; message: string; date: string }[];
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  network: number;
  activeUsers: number;
  activeContainers: number;
  kubePodsCount: number;
}

export interface PresenceUser {
  username: string;
  activeNotebook: string;
  location: string;
  isMe: boolean;
}
