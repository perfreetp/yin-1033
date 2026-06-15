import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Funnel, BarChart3, Route, ShoppingCart, Database, Crown, Users, ChevronRight, Sparkles } from 'lucide-react';
import { mockTemplates } from '@/data/mockData';
import { useProjectStore } from '@/store/useProjectStore';
import { useProjectCanvasStore } from '@/store/useProjectCanvasStore';
import { generateId } from '@/utils/helpers';
import { cn } from '@/utils/helpers';
import Button from '@/components/common/Button';
import type { Template } from '@/types';

const categories = [
  { key: 'all', label: '全部' },
  { key: '业务流程', label: '业务流程' },
  { key: '数据架构', label: '数据架构' },
  { key: '指标体系', label: '指标体系' },
];

const gradientMap: Record<string, string> = {
  'tpl-001': 'from-indigo-500 to-purple-600',
  'tpl-002': 'from-emerald-500 to-teal-600',
  'tpl-003': 'from-rose-500 to-pink-600',
  'tpl-004': 'from-amber-500 to-orange-600',
  'tpl-005': 'from-cyan-500 to-blue-600',
  'tpl-006': 'from-violet-500 to-fuchsia-600',
};

const iconMap: Record<string, React.ReactNode> = {
  funnel: <Funnel className="w-10 h-10" />,
  metrics: <BarChart3 className="w-10 h-10" />,
  journey: <Route className="w-10 h-10" />,
  order: <ShoppingCart className="w-10 h-10" />,
  warehouse: <Database className="w-10 h-10" />,
  vip: <Crown className="w-10 h-10" />,
};

const categoryColorMap: Record<string, string> = {
  '业务流程': 'bg-indigo-100 text-indigo-700',
  '数据架构': 'bg-emerald-100 text-emerald-700',
  '指标体系': 'bg-amber-100 text-amber-700',
};

export default function Templates() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { addProject } = useProjectStore();
  const { initProjectCanvas } = useProjectCanvasStore();

  const filteredTemplates = useMemo(() => {
    return mockTemplates.filter((template) => {
      const matchCategory = activeCategory === 'all' || template.category === activeCategory;
      const matchSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleUseTemplate = (template: Template) => {
    if (template.nodes.length === 0 && template.edges.length === 0) {
      alert('该模板暂无画布内容，无法使用');
      return;
    }

    const nodeIdMap: Record<string, string> = {};
    const newNodes = template.nodes.map(node => {
      const newId = generateId('node');
      nodeIdMap[node.id] = newId;
      return { ...node, id: newId };
    });
    const newEdges = template.edges.map(edge => ({
      ...edge,
      id: generateId('edge'),
      source: nodeIdMap[edge.source] || edge.source,
      target: nodeIdMap[edge.target] || edge.target,
    }));

    const newProject = {
      id: generateId('proj'),
      name: `${template.name} - 副本`,
      description: template.description,
      coverColor: gradientMap[template.id] || 'from-indigo-500 to-purple-600',
      ownerId: 'user-001',
      ownerName: '我',
      role: 'admin' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [
        { userId: 'user-001', userName: '我', avatar: '', role: 'admin' as const },
      ],
      nodeCount: newNodes.length,
      versionCount: 1,
    };
    addProject(newProject);
    initProjectCanvas(newProject.id, {
      nodes: newNodes,
      edges: newEdges,
    });
    navigate(`/project/${newProject.id}/canvas`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">模板库</h1>
          </div>
          <p className="text-slate-600 ml-12">
            选择一个模板快速开始，或从零开始创建你的专属项目
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users className="w-4 h-4" />
            <span>共 {filteredTemplates.length} 个模板</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
              className={cn(
                'px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200',
                activeCategory === category.key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div
                  className={cn(
                    'h-40 bg-gradient-to-br flex items-center justify-center text-white relative overflow-hidden',
                    gradientMap[template.id] || 'from-indigo-500 to-purple-600'
                  )}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                    {iconMap[template.thumbnail] || <Sparkles className="w-10 h-10" />}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-white/20 text-white'
                      )}
                    >
                      {template.category}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between mb-5">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-medium',
                        categoryColorMap[template.category] || 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {template.category}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Users className="w-4 h-4" />
                      <span>{template.usageCount} 次使用</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full group/btn"
                    onClick={() => handleUseTemplate(template)}
                  >
                    使用模板
                    <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="p-4 bg-slate-100 rounded-full mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">没有找到匹配的模板</h3>
            <p className="text-sm text-slate-500">
              试试其他关键词或分类吧
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
