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
      const initialNodes = data?.nodes ?? mockCanvasNodes;
      const initialEdges = data?.edges ?? mockCanvasEdges;
      const initialLanes = data?.lanes ?? mockLanes;
      const canvasData: CanvasData = {
        nodes: initialNodes,
        edges: initialEdges,
        lanes: initialLanes,
      };
      const initialVersion: Version = {
        id: generateId('ver'),
        version: 'v1.0.0',
        createdAt: new Date().toISOString(),
        author: '我',
        description: '初始版本',
        snapshot: {
          nodes: JSON.parse(JSON.stringify(canvasData.nodes)),
          edges: JSON.parse(JSON.stringify(canvasData.edges)),
          lanes: JSON.parse(JSON.stringify(canvasData.lanes)),
        },
      };

      const presetVersions = getPresetVersions(projectId, initialNodes, initialEdges, initialLanes);

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
          [projectId]: state.projectVersions[projectId] || presetVersions || [initialVersion],
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
    const { currentProjectId, projectVersions, projectCanvases } = get();
    if (!currentProjectId) return null;
    
    const versions = projectVersions[currentProjectId] || [];
    const targetVersion = versions.find(v => v.id === versionId);
    if (!targetVersion) return null;
    
    const currentVersion = versions[0];
    const canvas = projectCanvases[currentProjectId] || defaultCanvas;
    
    const backupVersion: Version = {
      id: generateId('ver'),
      version: `备份 - ${currentVersion.version} - 恢复前`,
      createdAt: new Date().toISOString(),
      author: '我',
      description: `恢复到 ${targetVersion.version} 前的自动备份`,
      snapshot: {
        nodes: JSON.parse(JSON.stringify(canvas.nodes)),
        edges: JSON.parse(JSON.stringify(canvas.edges)),
        lanes: JSON.parse(JSON.stringify(canvas.lanes)),
      },
    };
    
    set((state) => ({
      projectVersions: {
        ...state.projectVersions,
        [currentProjectId]: [backupVersion, ...(state.projectVersions[currentProjectId] || [])],
      },
    }));
    
    set((state) => {
      const canvasData = state.projectCanvases[currentProjectId] || defaultCanvas;
      return {
        projectCanvases: {
          ...state.projectCanvases,
          [currentProjectId]: {
            ...canvasData,
            nodes: JSON.parse(JSON.stringify(targetVersion.snapshot.nodes)),
            edges: JSON.parse(JSON.stringify(targetVersion.snapshot.edges)),
            lanes: JSON.parse(JSON.stringify(targetVersion.snapshot.lanes)),
          },
        },
        selectedNodeId: null,
        selectedEdgeId: null,
      };
    });
    get().pushHistory();
    
    return backupVersion;
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

const getPresetVersions = (
  projectId: string,
  defaultNodes: CanvasNode[],
  defaultEdges: CanvasEdge[],
  defaultLanes: Lane[]
): Version[] | null => {
  const versionConfigs: Record<string, { nodeCounts: number[]; versionDates: string[]; descriptions: string[] }> = {
    'proj-001': {
      nodeCounts: [], versionDates: [], descriptions: [],
    },
    'proj-002': {
      nodeCounts: [6, 12, 18],
      versionDates: ['2024-03-01T10:00:00Z', '2024-04-15T14:30:00Z', '2024-06-08T16:45:00Z'],
      descriptions: ['订单流程初稿：订单创建与支付流程', '补充仓储物流环节', '完成售后与结算节点'],
    },
    'proj-003': {
      nodeCounts: [8, 16, 24, 32],
      versionDates: ['2024-03-20T09:00:00Z', '2024-04-25T11:20:00Z', '2024-05-28T15:00:00Z', '2024-06-12T10:30:00Z'],
      descriptions: ['基础指标层：DAU/GMV等核心指标', '新增用户行为指标与留存指标', '补充营收与成本指标', '完成风控与质量指标，体系完善'],
    },
    'proj-004': {
      nodeCounts: [8, 15],
      versionDates: ['2024-04-25T14:00:00Z', '2024-05-28T09:10:00Z'],
      descriptions: ['会员等级基础框架', '补充权益与升级条件'],
    },
    'proj-005': {
      nodeCounts: [4, 8],
      versionDates: ['2024-05-01T10:00:00Z', '2024-06-14T11:00:00Z'],
      descriptions: ['活动框架初稿', '补充投放渠道与效果评估'],
    },
  };

  const config = versionConfigs[projectId];
  if (!config || config.nodeCounts.length === 0) return null;

  const { nodeCounts, versionDates, descriptions } = config;
  const maxNodeCount = Math.max(...nodeCounts);

  const extendedNodes: CanvasNode[] = [];
  const extendedEdges: CanvasEdge[] = [];
  let copyIndex = 0;
  while (extendedNodes.length < maxNodeCount) {
    const suffix = copyIndex === 0 ? '' : `-${copyIndex + 1}`;
    const offsetX = copyIndex * 20;
    const offsetY = copyIndex * 15;
    defaultNodes.forEach((node) => {
      if (extendedNodes.length < maxNodeCount) {
        extendedNodes.push({
          ...node,
          id: `${node.id}${suffix}`,
          x: node.x + offsetX,
          y: node.y + offsetY,
        });
      }
    });
    defaultEdges.forEach((edge) => {
      const sourceExists = extendedNodes.some((n) => n.id === `${edge.source}${suffix}`);
      const targetExists = extendedNodes.some((n) => n.id === `${edge.target}${suffix}`);
      if (sourceExists && targetExists) {
        const edgeIdExists = extendedEdges.some((e) => e.id === `${edge.id}${suffix}`);
        if (!edgeIdExists) {
          extendedEdges.push({
            ...edge,
            id: `${edge.id}${suffix}`,
            source: `${edge.source}${suffix}`,
            target: `${edge.target}${suffix}`,
          });
        }
      }
    });
    copyIndex++;
  }

  const extendedLanes: Lane[] = [];
  let laneCopyIndex = 0;
  const maxLaneCount = Math.max(3, Math.ceil(maxNodeCount / 8));
  while (extendedLanes.length < maxLaneCount) {
    const suffix = laneCopyIndex === 0 ? '' : `-${laneCopyIndex + 1}`;
    const positionOffset = laneCopyIndex * (defaultLanes[defaultLanes.length - 1]?.position + defaultLanes[defaultLanes.length - 1]?.size || 200);
    defaultLanes.forEach((lane) => {
      if (extendedLanes.length < maxLaneCount) {
        extendedLanes.push({
          ...lane,
          id: `${lane.id}${suffix}`,
          title: laneCopyIndex === 0 ? lane.title : `${lane.title} ${laneCopyIndex + 1}`,
          position: lane.position + positionOffset,
        });
      }
    });
    laneCopyIndex++;
  }

  const sortedNodes = [...extendedNodes].sort((a, b) => a.id.localeCompare(b.id));
  const sortedEdges = [...extendedEdges].sort((a, b) => a.id.localeCompare(b.id));
  const sortedLanes = [...extendedLanes].sort((a, b) => a.id.localeCompare(b.id));

  const versionNumPrefixes = ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.5.0'];

  const versions: Version[] = [];
  nodeCounts.forEach((count, i) => {
    const actualCount = Math.min(count, sortedNodes.length);
    const versionNodes = sortedNodes.slice(0, actualCount);
    const nodeIds = new Set(versionNodes.map((n) => n.id));
    const versionEdges = sortedEdges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    const laneCount = Math.max(1, Math.ceil(((i + 1) / nodeCounts.length) * sortedLanes.length));
    const versionLanes = sortedLanes.slice(0, laneCount);

    versions.push({
      id: `${projectId}-ver-${String(i + 1).padStart(3, '0')}`,
      version: `v${versionNumPrefixes[i]}`,
      createdAt: versionDates[i],
      author: '张明',
      description: descriptions[i],
      snapshot: {
        nodes: JSON.parse(JSON.stringify(versionNodes)),
        edges: JSON.parse(JSON.stringify(versionEdges)),
        lanes: JSON.parse(JSON.stringify(versionLanes)),
      },
    });
  });

  return versions.reverse();
};
