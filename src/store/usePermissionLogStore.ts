import { create } from 'zustand';

export interface PermissionLog {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  timestamp: string;
}

interface PermissionLogState {
  logs: Record<string, PermissionLog[]>;
  
  addLog: (projectId: string, log: Omit<PermissionLog, 'id' | 'timestamp' | 'projectId'>) => void;
  getLogs: (projectId: string) => PermissionLog[];
}

export const usePermissionLogStore = create<PermissionLogState>((set, get) => ({
  logs: {
    'proj-001': [
      { id: 'log-1', projectId: 'proj-001', userId: 'user-004', userName: '赵强', userRole: 'viewer', action: '尝试发布新版本', timestamp: '2024-06-12T10:30:00Z' },
      { id: 'log-2', projectId: 'proj-001', userId: 'user-004', userName: '赵强', userRole: 'viewer', action: '尝试创建版本', timestamp: '2024-06-13T14:20:00Z' },
      { id: 'log-3', projectId: 'proj-001', userId: 'user-006', userName: '刘伟', userRole: 'viewer', action: '尝试添加节点', timestamp: '2024-06-14T09:15:00Z' },
    ],
  },
  
  addLog: (projectId, log) => {
    set((state) => ({
      logs: {
        ...state.logs,
        [projectId]: [
          {
            id: `pl-${Date.now()}`,
            projectId,
            ...log,
            timestamp: new Date().toISOString(),
          },
          ...(state.logs[projectId] || []),
        ].slice(0, 50),
      },
    }));
  },
  
  getLogs: (projectId) => {
    return get().logs[projectId] || [];
  },
}));
