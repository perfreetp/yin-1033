import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  LayoutGrid,
  Users,
  GitBranch,
  Layers,
} from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import { generateId } from '@/utils/helpers';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import type { Project } from '@/types';

const coverColorOptions = [
  { value: 'from-indigo-500 to-purple-600', label: '靛紫渐变' },
  { value: 'from-emerald-500 to-teal-600', label: '青绿渐变' },
  { value: 'from-amber-500 to-orange-600', label: '琥珀渐变' },
  { value: 'from-rose-500 to-pink-600', label: '玫瑰渐变' },
  { value: 'from-cyan-500 to-blue-600', label: '青蓝渐变' },
  { value: 'from-slate-600 to-gray-700', label: '石板灰渐变' },
];

export default function Projects() {
  const navigate = useNavigate();
  const { projects, searchQuery, setSearchQuery, addProject } = useProjectStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    coverColor: 'from-indigo-500 to-purple-600',
  });

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const handleCardClick = (projectId: string) => {
    navigate(`/project/${projectId}/canvas`);
  };

  const handleCreateProject = () => {
    if (!newProject.name.trim()) return;

    const project: Project = {
      id: generateId('proj'),
      name: newProject.name,
      description: newProject.description || '暂无描述',
      coverColor: newProject.coverColor,
      ownerId: 'user-001',
      ownerName: '张明',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [
        { userId: 'user-001', userName: '张明', avatar: '', role: 'admin' },
      ],
      nodeCount: 0,
      versionCount: 1,
    };

    addProject(project);
    setIsModalOpen(false);
    setNewProject({
      name: '',
      description: '',
      coverColor: 'from-indigo-500 to-purple-600',
    });
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">项目列表</h1>
            <p className="text-slate-500 mt-1">
              共 {projects.length} 个项目
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="lg">
            <Plus className="w-5 h-5" />
            新建项目
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索项目名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleCardClick(project.id)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 group"
              >
                <div
                  className={`h-32 bg-gradient-to-br ${project.coverColor} relative`}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-5 h-5 text-white/90" />
                      <span className="text-white/90 text-sm font-medium">
                        {project.nodeCount} 个节点
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {project.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Layers className="w-4 h-4" />
                        <span className="text-sm">{project.versionCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <GitBranch className="w-4 h-4" />
                        <span className="text-sm">{project.nodeCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {project.members.slice(0, 3).map((member) => (
                          <div
                            key={member.userId}
                            className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600"
                          >
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.userName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(member.userName)
                            )}
                          </div>
                        ))}
                        {project.members.length > 3 && (
                          <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-500">
                            +{project.members.length - 3}
                          </div>
                        )}
                      </div>
                      <Users className="w-4 h-4 text-slate-400 ml-2" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              未找到匹配的项目
            </h3>
            <p className="text-slate-500">
              试试其他关键词，或
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-indigo-600 hover:text-indigo-700 font-medium ml-1"
              >
                创建新项目
              </button>
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新建项目"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              项目名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newProject.name}
              onChange={(e) =>
                setNewProject({ ...newProject, name: e.target.value })
              }
              placeholder="请输入项目名称"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-700 placeholder:text-slate-400"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              项目描述
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
              placeholder="请输入项目描述（可选）"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-700 placeholder:text-slate-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              封面颜色
            </label>
            <div className="grid grid-cols-3 gap-3">
              {coverColorOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setNewProject({ ...newProject, coverColor: option.value })
                  }
                  className={`relative h-16 rounded-lg bg-gradient-to-br ${option.value} transition-all ${
                    newProject.coverColor === option.value
                      ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105'
                      : 'hover:scale-102'
                  }`}
                >
                  {newProject.coverColor === option.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {
                coverColorOptions.find((o) => o.value === newProject.coverColor)
                  ?.label
              }
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProject.name.trim()}
            >
              创建项目
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
