import { useState, useEffect, useCallback } from 'react';
import { Network, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function ArchitectMode() {
  const { getToken } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  // In a real app we'd fetch this from the router or state

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        // 1. Fetch repositories
        const repoRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/v1/repositories`, { headers });
        let repoId = localStorage.getItem('codelore_active_repo');
        if (repoRes.ok) {
           const repos = await repoRes.json();
           if (repos.length > 0) {
             if (!repoId) {
               repoId = repos[0].id;
               localStorage.setItem('codelore_active_repo', repoId as string);
             }
           }
        }
        
        if (!repoId) return;

        // 2. Fetch functions and edges for this repo
        const [funcRes, edgesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/v1/repositories/${repoId}/functions`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/v1/repositories/${repoId}/edges`, { headers })
        ]);
        
        if (funcRes.ok) {
          const funcs = await funcRes.json();
          const edges = edgesRes.ok ? await edgesRes.json() : [];
          
          // Let's create flow nodes.
          const flowNodes = funcs.map((f: any, index: number) => ({
            id: f.id,
            position: { x: (index % 5) * 250, y: Math.floor(index / 5) * 150 },
            data: { label: f.name },
            style: { 
              background: '#0f172a', 
              color: '#f8fafc', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '10px'
            }
          }));
          setNodes(flowNodes);

          const flowEdges = edges.map((e: any) => ({
            id: e.id,
            source: e.callerId,
            target: e.calleeId,
            animated: true,
            style: { stroke: '#06b6d4' } // cyan
          }));
          setEdges(flowEdges);
        }
      } catch (e) {
        console.error("Failed to load architect graph", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [getToken, setNodes, setEdges]);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 bg-transparent">
        <Loader2 className="animate-spin mr-2" /> Building Dependency Graph...
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-500 bg-transparent p-8 text-center max-w-lg mx-auto">
        <Network size={48} className="text-slate-400 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">No Graph Data</h2>
        <p className="mb-6 leading-relaxed">
          We haven't detected any functions for this repository yet. Run the parser to populate the graph.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col bg-transparent">
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Blast Radius Graph</h1>
          <p className="text-slate-400 max-w-2xl">Interactive structural analysis. Explore tightly coupled modules and trace execution paths.</p>
        </div>
      </div>

      <div className="flex-1 bg-midnight-100 border border-white/10 rounded-xl overflow-hidden" style={{ minHeight: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          colorMode="dark"
        >
          <Controls className="bg-slate-800 border-white/10 fill-white" />
          <MiniMap style={{ background: '#0f172a' }} nodeColor="#334155" maskColor="rgba(0,0,0,0.2)" />
          <Background color="#334155" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
