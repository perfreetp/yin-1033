import { create } from 'zustand';
import type { CanvasNode, CanvasEdge, Lane, CanvasHistoryItem } from '@/types';
import { mockCanvasNodes, mockCanvasEdges, mockLanes } from '@/data/mockData';

const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  lanes: Lane[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  history: CanvasHistoryItem[];
  historyIndex: number;
  isDragging: boolean;
  isConnecting: boolean;
  connectingFrom: string | null;
  
  setNodes: (nodes: CanvasNode[]) => void;
  setEdges: (edges: CanvasEdge[]) => void;
  setLanes: (lanes: Lane[]) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  
  addNode: (node: Omit<CanvasNode, 'id'>) => void;
  updateNode: (id: string, updates: Partial<CanvasNode>) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, x: number, y: number) => void;
  
  addEdge: (source: string, target: string) => void;
  deleteEdge: (id: string) => void;
  
  addLane: (lane: Omit<Lane, 'id'>) => void;
  updateLane: (id: string, updates: Partial<Lane>) => void;
  deleteLane: (id: string) => void;
  
  startConnecting: (nodeId: string) => void;
  endConnecting: () => void;
  finishConnecting: (targetId: string) => void;
  
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  
  resetCanvas: () => void;
  loadSnapshot: (nodes: CanvasNode[], edges: CanvasEdge[], lanes: Lane[]) => void;
}

const initialHistory: CanvasHistoryItem[] = [{
  nodes: mockCanvasNodes,
  edges: mockCanvasEdges,
  lanes: mockLanes,
  timestamp: new Date().toISOString(),
}];

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: mockCanvasNodes,
  edges: mockCanvasEdges,
  lanes: mockLanes,
  selectedNodeId: null,
  selectedEdgeId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  history: initialHistory,
  historyIndex: 0,
  isDragging: false,
  isConnecting: false,
  connectingFrom: null,
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setLanes: (lanes) => set({ lanes }),
  
  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),
  
  setPan: (x, y) => set({ panX: x, panY: y }),
  
  addNode: (node) => {
    const newNode = { ...node, id: generateId() };
    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newNode.id,
    }));
    get().pushHistory();
  },
  
  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map(n => n.id === id ? { ...n, ...updates } : n),
    }));
  },
  
  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter(n => n.id !== id),
      edges: state.edges.filter(e => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
    get().pushHistory();
  },
  
  moveNode: (id, x, y) => {
    set((state) => ({
      nodes: state.nodes.map(n => n.id === id ? { ...n, x, y } : n),
    }));
  },
  
  addEdge: (source, target) => {
    const newEdge = {
      id: `edge-${Date.now()}`,
      source,
      target,
      style: 'arrow' as const,
    };
    set((state) => ({
      edges: [...state.edges, newEdge],
      selectedEdgeId: newEdge.id,
    }));
    get().pushHistory();
  },
  
  deleteEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter(e => e.id !== id),
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
    }));
    get().pushHistory();
  },
  
  addLane: (lane) => {
    const newLane = { ...lane, id: `lane-${Date.now()}` };
    set((state) => ({
      lanes: [...state.lanes, newLane],
    }));
    get().pushHistory();
  },
  
  updateLane: (id, updates) => {
    set((state) => ({
      lanes: state.lanes.map(l => l.id === id ? { ...l, ...updates } : l),
    }));
  },
  
  deleteLane: (id) => {
    set((state) => ({
      lanes: state.lanes.filter(l => l.id !== id),
    }));
    get().pushHistory();
  },
  
  startConnecting: (nodeId) => {
    set({ isConnecting: true, connectingFrom: nodeId });
  },
  
  endConnecting: () => {
    set({ isConnecting: false, connectingFrom: null });
  },
  
  finishConnecting: (targetId) => {
    const { connectingFrom } = get();
    if (connectingFrom && connectingFrom !== targetId) {
      get().addEdge(connectingFrom, targetId);
    }
    set({ isConnecting: false, connectingFrom: null });
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const item = history[newIndex];
      set({
        nodes: item.nodes,
        edges: item.edges,
        lanes: item.lanes,
        historyIndex: newIndex,
      });
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const item = history[newIndex];
      set({
        nodes: item.nodes,
        edges: item.edges,
        lanes: item.lanes,
        historyIndex: newIndex,
      });
    }
  },
  
  pushHistory: () => {
    const { nodes, edges, lanes, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      lanes: JSON.parse(JSON.stringify(lanes)),
      timestamp: new Date().toISOString(),
    });
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },
  
  resetCanvas: () => {
    set({
      nodes: [],
      edges: [],
      lanes: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      zoom: 1,
      panX: 0,
      panY: 0,
    });
    get().pushHistory();
  },
  
  loadSnapshot: (nodes, edges, lanes) => {
    set({
      nodes,
      edges,
      lanes,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    get().pushHistory();
  },
}));
