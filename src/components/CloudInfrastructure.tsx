import React, { useState, useEffect } from "react";
import { K8sPod, OpenStackResource } from "../types";
import { Server, Cloud, Compass, Plus, Trash, Scale, Disc, Network, HardDrive, Cpu, Power, ShieldAlert } from "lucide-react";

export default function CloudInfrastructure() {
  const [pods, setPods] = useState<K8sPod[]>([]);
  const [hpa, setHpa] = useState({ minReplicas: 2, maxReplicas: 10, targetCpuUtilization: 80, currentReplicas: 3 });
  const [cloudResources, setCloudResources] = useState<OpenStackResource[]>([]);

  // Form states
  const [newPodName, setNewPodName] = useState("");
  const [newPodNs, setNewPodNs] = useState("swan-users");

  const [newOsName, setNewOsName] = useState("");
  const [newOsType, setNewOsType] = useState<"Compute Instance" | "Block Volume">("Compute Instance");
  const [newOsFlavor, setNewOsFlavor] = useState("m1.medium (2 VCPU, 4GB RAM)");
  const [newOsSize, setNewOsSize] = useState(100);

  const fetchInfra = async () => {
    try {
      const resPods = await fetch("/api/kubernetes/pods");
      const dataPods = await resPods.json();
      setPods(dataPods);

      const resHpa = await fetch("/api/kubernetes/hpa");
      const dataHpa = await resHpa.json();
      setHpa(dataHpa);

      const resCloud = await fetch("/api/openstack/resources");
      const dataCloud = await resCloud.json();
      setCloudResources(dataCloud);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInfra();
    const interval = setInterval(fetchInfra, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleDeployPod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/kubernetes/pods/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPodName, namespace: newPodNs })
      });
      if (res.ok) {
        setNewPodName("");
        fetchInfra();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTerminatePod = async (name: string) => {
    try {
      const res = await fetch(`/api/kubernetes/pods/${name}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchInfra();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProvisionOpenStack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/openstack/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newOsName,
          type: newOsType,
          flavor: newOsType === "Compute Instance" ? newOsFlavor : `${newOsSize} GB Block Target`,
          sizeGb: newOsType === "Block Volume" ? newOsSize : undefined
        })
      });
      if (res.ok) {
        setNewOsName("");
        fetchInfra();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeallocateOpenStack = async (id: string) => {
    try {
      const res = await fetch(`/api/openstack/resources/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchInfra();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateHpa = async (updatedFields: Partial<typeof hpa>) => {
    const updated = { ...hpa, ...updatedFields };
    setHpa(updated);
    try {
      await fetch("/api/kubernetes/hpa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-100 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-400" />
            CERN OpenStack & Kubernetes Integration Cockpit
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Command-level allocation of bare-metal hypervisor nodes, namespaces, horizontal scaling and real k8s pods representation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left column: Kubernetes control card & HPAs */}
        <div className="xl:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-indigo-300 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              Kubernetes Core Engine Orchestration
            </h3>

            {/* Config & Spawn Pods Row */}
            <form onSubmit={handleDeployPod} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-950 p-3 rounded border border-slate-850">
              <div>
                <label className="block text-4xs text-slate-500 font-mono mb-1">POD DEPLOY NAME</label>
                <input
                  type="text"
                  required
                  value={newPodName}
                  onChange={(e) => setNewPodName(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-250 focus:outline-none focus:border-indigo-500"
                  placeholder="swan-analysis-pod-3"
                />
              </div>
              <div>
                <label className="block text-4xs text-slate-500 font-mono mb-1">NAMESPACE</label>
                <select
                  value={newPodNs}
                  onChange={(e) => setNewPodNs(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-250 focus:outline-none"
                >
                  <option value="swan-users">swan-users</option>
                  <option value="swan-platform">swan-platform</option>
                  <option value="kube-system">kube-system</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-1.5 hover:cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-xs font-mono font-semibold rounded text-slate-100 transition duration-150"
              >
                DEPLOY IMAGES
              </button>
            </form>

            {/* Pods Browser */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {pods.map((pod) => (
                <div key={pod.name} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded text-left">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Disc className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-slate-300 truncate max-w-[210px]">{pod.name}</span>
                        <span className="text-[8px] font-mono text-slate-500">({pod.namespace})</span>
                      </div>
                      <p className="text-4xs text-slate-500 font-mono mt-0.5">
                        IP Node: {pod.ip} | CPU allocation: {pod.cpu} | RAM: {pod.memory}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/20 px-1 py-0.2 rounded">
                      ACTIVE
                    </span>
                    <button
                      onClick={() => handleTerminatePod(pod.name)}
                      className="p-1 hover:bg-slate-900 text-slate-600 hover:text-rose-400 rounded transition"
                      title="Gracefully evict pod"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Horizontal Pod Autoscaler Sliders */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-indigo-300 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              Horizontal Pod Scaling Settings (HPA)
            </h3>
            
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-2 border border-slate-850 rounded">
                  <span className="text-4xs text-slate-500 block">KUBE PODS DEMAND REPLICAS</span>
                  <span className="text-lg font-bold text-indigo-400">{hpa.currentReplicas} nodes</span>
                </div>
                <div className="bg-slate-950 p-2 border border-slate-850 rounded">
                  <span className="text-4xs text-slate-500 block">TARGET CPU METRIC</span>
                  <span className="text-lg font-bold text-emerald-400">{hpa.targetCpuUtilization}% Limit</span>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-3xs text-slate-400 mb-1">
                    <span>MINIMUM REPLICAS CONSTRAINT</span>
                    <span className="text-indigo-300 font-bold">{hpa.minReplicas} nodes</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={hpa.minReplicas}
                    onChange={(e) => handleUpdateHpa({ minReplicas: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-3xs text-slate-400 mb-1">
                    <span>MAXIMUM REPLICAS CONTEXT</span>
                    <span className="text-indigo-300 font-bold">{hpa.maxReplicas} nodes</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={hpa.maxReplicas}
                    onChange={(e) => handleUpdateHpa({ maxReplicas: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-3xs text-slate-400 mb-1">
                    <span>SCALING TARGET OVERALL STRESS %</span>
                    <span className="text-indigo-300 font-bold">{hpa.targetCpuUtilization}% Usage</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={hpa.targetCpuUtilization}
                    onChange={(e) => handleUpdateHpa({ targetCpuUtilization: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: OpenStack resource management */}
        <div className="xl:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-indigo-300 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
              <Cloud className="w-4 h-4 text-indigo-400" />
              OpenStack Private Hypervisor VM Allocation
            </h3>

            {/* Provision Resource */}
            <form onSubmit={handleProvisionOpenStack} className="space-y-3.5 bg-slate-950 p-4 border border-slate-850 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-4xs text-slate-500 font-mono mb-1">INSTANCE ID TAG</label>
                  <input
                    type="text"
                    required
                    value={newOsName}
                    onChange={(e) => setNewOsName(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-250 focus:outline-none focus:border-indigo-500"
                    placeholder="CephFS-LUN-Worker"
                  />
                </div>

                <div>
                  <label className="block text-4xs text-slate-500 font-mono mb-1">RESOURCE COMPONENT TYPE</label>
                  <select
                    value={newOsType}
                    onChange={(e: any) => setNewOsType(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-250"
                  >
                    <option value="Compute Instance">Bare-Metal Compute VM</option>
                    <option value="Block Volume">SAN SSD Block Storage (LUN)</option>
                  </select>
                </div>
              </div>

              {newOsType === "Compute Instance" ? (
                <div>
                  <label className="block text-4xs text-slate-500 font-mono mb-1">FLAVORS SELECTION</label>
                  <select
                    value={newOsFlavor}
                    onChange={(e) => setNewOsFlavor(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-250"
                  >
                    <option value="m1.medium (2 VCPU, 4GB RAM)">m1.medium (2 Dedicated VCPU, 4GB Memory)</option>
                    <option value="m1.large (4 VCPU, 8GB RAM)">m1.large (4 Dedicated VCPU, 8GB Memory)</option>
                    <option value="m1.xlarge (8 VCPU, 16GB RAM)">m1.xlarge (8 Dedicated VCPU, 16GB Memory)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-4xs text-slate-500 font-mono mb-1">BLOCK DISK SIZE (GB)</label>
                  <input
                    type="number"
                    value={newOsSize}
                    onChange={(e) => setNewOsSize(Number(e.target.value))}
                    className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-250 focus:outline-none focus:border-indigo-500"
                    min="10"
                    max="1000"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 hover:cursor-pointer bg-emerald-650 hover:bg-emerald-600 font-semibold text-xs font-mono rounded text-slate-100 transition duration-150"
              >
                PROVISION OPENSTACK FLAVOR
              </button>
            </form>

            {/* List provisioned VMs / disks */}
            <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
              {cloudResources.map((res) => (
                <div key={res.id} className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center justify-between text-left">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-slate-900 border border-slate-800 text-indigo-400 rounded shrink-0">
                      {res.type === "Compute Instance" ? <Cpu className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-mono font-semibold text-slate-350">{res.name}</span>
                      <p className="text-4xs text-slate-500 font-mono mt-0.5">
                        Type: {res.type} | Specs: <span className="text-slate-400">{res.flavor}</span>
                      </p>
                      {res.ipAddress && (
                        <span className="text-[9px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1 py-0.2 rounded mt-1 inline-block">
                          IP Address: {res.ipAddress}
                        </span>
                      )}
                      {res.sizeGb && (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 rounded mt-1 inline-block">
                          Size Allocation: {res.sizeGb} GB
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeallocateOpenStack(res.id)}
                    className="p-1.5 hover:bg-slate-900 text-slate-650 hover:text-rose-400 rounded"
                    title="Terminate OpenStack physical slice"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
