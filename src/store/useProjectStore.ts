import { create } from 'zustand';
import type { Project } from '@/types';
import { mockProjects } from '@/data/mockData';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  searchQuery: string;
  setProjects: (projects: Project[]) => void;
  setCurrentProjectId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  getCurrentProject: () => Project | undefined;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: mockProjects,
  currentProjectId: null,
  searchQuery: '',
  
  setProjects: (projects) => set({ projects }),
  
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  getCurrentProject: () => {
    const { projects, currentProjectId } = get();
    return projects.find(p => p.id === currentProjectId);
  },
  
  addProject: (project) => set((state) => ({
    projects: [project, ...state.projects],
  })),
  
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ),
  })),
  
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id),
  })),
}));
