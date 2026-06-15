import { create } from 'zustand';
import type { CanvasNode, CanvasEdge, Lane, Version } from '@/types';
import { mockCanvasNodes, mockCanvasEdges, mockLanes, mockVersions } from '@/data/mockData';
import { generateId } from '@/utils/helpers';

interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  lanes: Lane[];
}

interface ProjectCanvasState {
  projectCanvases: Record<string, CanvasData>;
  projectVersions: Record<string, Version[]>;
  currentProjectId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  history: Record<string, CanvasData[]>;
  historyIndex: Record<string, number>;
  isConnecting: boolean;
  connectingFrom: string | null;
  
  initProjectCanvas: (projectId: string, data?: Partial<CanvasData>) => void;
  setCurrentProject: (projectId: string) => void;
  
  getNodes: () => CanvasNode[];
  getEdges: () => CanvasEdge[];
  getLanes: () => Lane[];
  getVersions: () => Version[];
  getHistoryIndex: () => number;
  getHistoryLength: () => number;
  
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
  startConnecting: (nodeId: string) => void;
  endConnecting: () => void;
  finishConnecting: (targetId: string) => void;
  
  addLane: (lane: Omit<Lane, 'id'>) => void;
  updateLane: (id: string, updates: Partial<Lane>) => void;
  deleteLane: (id: string) => void;
  
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  
  createVersion: (description: string) => Version;
  restoreVersion: (versionId: string) => void;
  
  loadSnapshot: (nodes: CanvasNode[], edges: CanvasEdge[], lanes: Lane[]) => void;
}

const defaultCanvas: CanvasData = {
  nodes: [],
  edges: [],
  lanes: [],
};

const defaultHistory: CanvasData[] = [defaultCanvas];

export const useProjectCanvasStore = create<ProjectCanvasState>((set, get) => ({
  projectCanvases: {
    'proj-001': {
      nodes: mockCanvasNodes,
      edges: mockCanvasEdges,
      lanes: mockLanes,
    },
  },
  projectVersions: {
    'proj-001': mockVersions,
  },
  currentProjectId: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  isConnecting: false,
  connectingFrom: null,
  history: {
    'proj-001': [{
      nodes: [...mockCanvasNodes],
      edges: [...mockCanvasEdges],
      lanes: [...mockLanes],
    }],
  },
  historyIndex: {
    'proj-001': 0,
  },
  
  initProjectCanvas: (projectId, data) => {
    set((state) => {
      if (state.projectCanvases[projectId]) {
        return { currentProjectId: projectId };
      }
      const canvasData: CanvasData = {
        nodes: data?.nodes || [],
        edges: data?.edges || [],
        lanes: data?.lanes || [],
      };
      return {
        projectCanvases: {
          ...state.projectCanvases,
          [projectId]: canvasData,
        },
        history: {
          ...state.history,
          [projectId]: [JSON.parse(JSON.stringify(canvasData))],
        },
        historyIndex: {
          ...state.historyIndex,
          [projectId]: 0,
        },
        projectVersions: {
          ...state.projectVersions,
          [projectId]: state.projectVersions[projectId] || [],
        },
        currentProjectId: projectId,
      };
    });
  },
  
  setCurrentProject: (projectId) => {
    set({ currentProjectId: projectId });
  },
  
  getNodes: () => {
    const { projectCanvases, currentProjectId } = get();
    if (!currentProjectId) return [];
    return projectCanvases[currentProjectId]?.nodes || [];
  },
  
  getEdges: () => {
    const { projectCanvases, currentProjectId } = get();
    if (!currentProjectId) return [];
    return projectCanvases[currentProjectId]?.edges || [];
  },
  
  getLanes: () => {
    const { projectCanvases, currentProjectId } = get();
    if (!currentProjectId) return [];
    return projectCanvases[currentProjectId]?.lanes || [];
  },
  
  getVersions: () => {
    const { projectVersions, currentProjectId } = get();
    if (!currentProjectId) return [];
    return projectVersions[currentProjectId] || [];
  },
  
  getHistoryIndex: () => {
    const { historyIndex, currentProjectId } = get();
    if (!currentProjectId) return 0;
    return historyIndex[currentProjectId] || 0;
  },
  
  getHistoryLength: () => {
    const { history, currentProjectId } = get();
    if (!currentProjectId) return 0;
    return history[currentProjectId]?.length || 0;
  },
  
  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  
  addNode: (node) => {
    const { currentProjectId } = get();
    if (!currentProjectId) return;
    
    const newNode = { ...node, id: generateId('node') };
    set((state) => {
      const canvas = state.projectCanvases[currentProjectId] || defaultCanvas;
      return {
        projectCanvases: {
          ...state.projectCanvases,
          [currentProjectId]: {
            ...canvas,
            nodes: [...canvas.nodes, newNode],
          },
        },
        selectedNodeId: newNode.id,
      };
    });
    get().pushHistory();
  },
  
  updateNode: (id, updates) => {
    const { currentProjectId } = get();
    if (!currentProjectId) return;
    
    set((state) => {
      const canvas = state.projectCanvases[currentProjectId] || defaultCanvas;
      return {
        projectCanvases: {
          ...state.projectCanvases,
          [currentProjectId]: {
            ...canvas,
            nodes: canvas.nodes.map(n => n.id === id ? { ...n, ...updates } : n),
          },
        },
      };
    });
  },
  
  deleteNode: (id) => {
    const { currentProjectId, selectedNodeId } = get();
    if (!currentProjectId) return;
    
    set((state) => {
      const canvas = state.projectCanvases[currentProjectId] || defaultCanvas;
      return {
        projectCanvases: {
          ...state.projectCanvases,
          [currentProjectId]: {
            ...canvas,
            nodes: canvas.nodes.filter(n => n.id !== id),
            edges: canvas.edges.filter(e => e.source !== id && e.target !== id),
          },
        },
        selectedNodeId: selectedNodeId === id ? null : selectedNodeId,
      };
    });
    get().pushHistory();
  },
  
  moveNode: (id, x, y) => {
    const { currentProjectId } = get();
    if (!currentProjectId) return;
    
    set((state) => {
      const canvas = state.projectCanvases[currentProjectId] || defaultCanvas;
      return {
        projectCanvases: {
          ...state.projectCanvases,
          [currentProjectId]: {
            ...canvas,
            nodes: canvas.nodes.map(n => n.id === id ? { ...n, x, y } : n),
          },
        },
      };
    });
  },
  
  addEdge: (source, target) => {
    const { currentProjectId } = get();
    if (!currentProjectId) return;
    
    const newEdge = {
      id: generateId('edge'),
      source,
      target,
      style: 'arrow' as const,
    };
    set((state) => {
      const canvas = state.projectCanvases[currentProjectId] || defaultCanvas;
      return {
        projectCanvases: {
          ...state.projectCanvases,
          [currentProjectId]: {
            ...canvas,
            edges: [...canvas.edges, newEdge],
          },
        },
        selectedEdgeId: newEdge.id,
      };
    });
    get().pushHistory();
  },
  
  deleteEdge: (id) => {
    const { currentProjectId, selectedEdgeId } = get();
    if (!currentProjectId) return;
    
    set((state) => {
      const canvas = state.projectCanvases[currentProjectId] || defaultCanvas;
      return {
        projectCanvases: {
          ...state.projectCanvases,
          [currentProjectId]: {
            ...canvas,
            edges: canvas.edges.filter(e => e.id !== id),
          },
        },
        selectedEdgeId: selectedEdgeId === id ? null : selectedEdgeId,
      };
    });
    get().pushHistory();
  },
  
  startConnecting: (nodeId) => {
    set({ isConnecting: true, connectingFrom: nodeId });
  },
  
  endConnecting: () => {
    set({ isConnecting: false, connectingFrom: null });
  },
  
  finishConnecting: (targetId) => {
    const { connectingFrom, addEdge } = get();
    if (connectingFrom && connectingFrom !== targetId) {
      addEdge(connectingFrom, targetId);
    }
    set({ isConnecting: false, connectingFrom: null });
  },
  
  addLane: (lane) => {
    const { currentProjectId } = get();
    if (!currentProjectId) return;
    
    const newLane = { ...lane, id: generateId('lane') };
    set((state) => {
      const canvas = state.projectCanvases[currentProjectId] || defaultCanvas;
      return {
        projectCanvases: {
          ...state.projectCanvases,
          [currentProjectId]: {
            ...canvas,
            lanes: [...canvas.lanes, newLane],
          },
        },
      };
    });
    get().pushHistory();
  },
  
  updateLane: (id, updates) => {
    const { currentProjectId } = get();
    if (!currentProjectId) return;
    
    set((state) => {
      const canvas = state.projectCanvases[currentProjectId] || defaultCanvas;
      return {
        projectCanvases: {
          ...state.projectCanvases,
          [currentProjectId]: {
            ...canvas,
            lanes: canvas.lanes.map(l => l.id === id ? { ...l, ...updates } : l),
          },
        },
      };
    });
  },
  
  deleteLane: (id) => {
    const { currentProjectId } = get();
    if (!currentProjectId) return;
    
    set((state) => {
      const canvas = state.projectCanvases[currentProjectId] || defaultCanvas;
      return {
        projectCanvases: {
          ...state.projectCanvases,
          [currentProjectId]: {
            ...canvas,
            lanes: canvas.lanes.filter(l => l.id !== id),
          },
        },
      };
    });
    get().pushHistory();
  },
  
  undo: () => {
    const { currentProjectId, historyIndex, history } = get();
    if (!currentProjectId) return;
    
    const idx = historyIndex[currentProjectId] || 0;
    if (idx > 0) {
      const newIndex = idx - 1;
      const item = history[currentProjectId][newIndex];
      set((state) => {
        const canvas = state.projectCanvases[currentProjectId] || defaultCanvas;
        return {
          projectCanvases: {
            ...state.projectCanvases,
            [currentProjectId]: {
              ...canvas,
              nodes: item.nodes,
              edges: item.edges,
              lanes: item.lanes,
            },
          },
          historyIndex: {
            ...state.historyIndex,
            [currentProjectId]: newIndex,
          },
          selectedNodeId: null,
          selectedEdgeId: null,
        };
      });
    }
  },
  
  redo: () => {
    const { currentProjectId, historyIndex, history } = get();
    if (!currentProjectId) return;
    
    const idx = historyIndex[currentProjectId] || 0;
    const hist = history[currentProjectId] || [];
    if (idx < hist.length - 1) {
      const newIndex = idx + 1;
      const item = hist[newIndex];
      set((state) => {
        const canvas = state.projectCanvases[currentProjectId] || defaultCanvas;
        return {
          projectCanvases: {
            ...state.projectCanvases,
            [currentProjectId]: {
              ...canvas,
              nodes: item.nodes,
              edges: item.edges,
              lanes: item.lanes,
            },
          },
          historyIndex: {
            ...state.historyIndex,
            [currentProjectId]: newIndex,
          },
          selectedNodeId: null,
          selectedEdgeId: null,
        };
      });
    }
  },
  
  pushHistory: () => {
    const { currentProjectId, projectCanvases, history, historyIndex } = get();
    if (!currentProjectId) return;
    
    const canvas = projectCanvases[currentProjectId] || defaultCanvas;
    const idx = historyIndex[currentProjectId] || 0;
    const hist = history[currentProjectId] || defaultHistory;
    
    const newHistory = hist.slice(0, idx + 1);
    newHistory.push({
      nodes: JSON.parse(JSON.stringify(canvas.nodes)),
      edges: JSON.parse(JSON.stringify(canvas.edges)),
      lanes: JSON.parse(JSON.stringify(canvas.lanes)),
    });
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    set((state) => ({
      history: {
        ...state.history,
        [currentProjectId]: newHistory,
      },
      historyIndex: {
        ...state.historyIndex,
        [currentProjectId]: newHistory.length - 1,
      },
    }));
  },
  
  createVersion: (description) => {
    const { currentProjectId, projectCanvases, projectVersions } = get();
    if (!currentProjectId) {
      throw new Error('No project selected');
    }
    
    const canvas = projectCanvases[currentProjectId] || defaultCanvas;
    const versions = projectVersions[currentProjectId] || [];
    const versionNum = versions.length + 1;
    const versionStr = `v1.${versionNum}.0`;
    
    const newVersion: Version = {
      id: generateId('ver'),
      version: versionStr,
      createdAt: new Date().toISOString(),
      author: '我',
      description,
      snapshot: {
        nodes: JSON.parse(JSON.stringify(canvas.nodes)),
        edges: JSON.parse(JSON.stringify(canvas.edges)),
        lanes: JSON.parse(JSON.stringify(canvas.lanes)),
      },
    };
    
    set((state) => ({
      projectVersions: {
        ...state.projectVersions,
        [currentProjectId]: [newVersion, ...(state.projectVersions[currentProjectId] || [])],
      },
    }));
    
    return newVersion;
  },
  
  restoreVersion: (versionId) => {
    const { currentProjectId, projectVersions } = get();
    if (!currentProjectId) return;
    
    const versions = projectVersions[currentProjectId] || [];
    const version = versions.find(v => v.id === versionId);
    if (!version) return;
    
    set((state) => {
      const canvas = state.projectCanvases[currentProjectId] || defaultCanvas;
      return {
        projectCanvases: {
          ...state.projectCanvases,
          [currentProjectId]: {
            ...canvas,
            nodes: JSON.parse(JSON.stringify(version.snapshot.nodes)),
            edges: JSON.parse(JSON.stringify(version.snapshot.edges)),
            lanes: JSON.parse(JSON.stringify(version.snapshot.lanes)),
          },
        },
        selectedNodeId: null,
        selectedEdgeId: null,
      };
    });
    get().pushHistory();
  },
  
  loadSnapshot: (nodes, edges, lanes) => {
    const { currentProjectId } = get();
    if (!currentProjectId) return;
    
    set((state) => {
      const canvas = state.projectCanvases[currentProjectId] || defaultCanvas;
      return {
        projectCanvases: {
          ...state.projectCanvases,
          [currentProjectId]: {
            ...canvas,
            nodes,
            edges,
            lanes,
          },
        },
        selectedNodeId: null,
        selectedEdgeId: null,
      };
    });
    get().pushHistory();
  },
}));
