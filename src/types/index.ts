export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
}

export interface ProjectMember {
  userId: string;
  userName: string;
  avatar: string;
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  coverColor: string;
  ownerId: string;
  ownerName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  nodeCount: number;
  versionCount: number;
}

export type NodeType = 'rectangle' | 'circle' | 'diamond' | 'metric' | 'process' | 'data' | 'text';

export interface CanvasNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  layer: number;
  laneId?: string;
  data?: Record<string, any>;
}

export type EdgeStyle = 'solid' | 'dashed' | 'arrow';

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style: EdgeStyle;
}

export interface Lane {
  id: string;
  title: string;
  direction: 'horizontal' | 'vertical';
  position: number;
  size: number;
}

export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';

export interface DataField {
  id: string;
  name: string;
  type: FieldType;
  description: string;
  category: string;
  relatedMetrics: string[];
  required: boolean;
  defaultValue?: string;
}

export interface Metric {
  id: string;
  name: string;
  formula: string;
  meaning: string;
  category: string;
  unit?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  usageCount: number;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  avatar: string;
  createdAt: string;
  mentions: string[];
  position?: { x: number; y: number };
  resolved: boolean;
  replies: Comment[];
}

export interface Version {
  id: string;
  version: string;
  createdAt: string;
  author: string;
  description: string;
  snapshot: {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    lanes: Lane[];
  };
}

export type PublishPermission = 'private' | 'view_only' | 'comment';

export interface ChangeLogItem {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  description: string;
}

export interface Publish {
  id: string;
  version: string;
  description: string;
  shareUrl: string;
  permission: PublishPermission;
  expireAt?: string;
  createdAt: string;
  changeLog: ChangeLogItem[];
}

export interface CanvasState {
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
}

export interface CanvasHistoryItem {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  lanes: Lane[];
  timestamp: string;
}
