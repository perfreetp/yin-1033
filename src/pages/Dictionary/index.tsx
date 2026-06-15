import { useState, useMemo } from 'react';
import { Search, Plus, Database, Calculator, ChevronRight, X, Hash, Type, Calendar, Check, Info, FileText, Layers } from 'lucide-react';
import ProjectLayout from '@/components/Layout/ProjectLayout';
import Button from '@/components/common/Button';
import { mockDataFields, mockMetrics } from '@/data/mockData';
import type { DataField, Metric, FieldType } from '@/types';
import { cn } from '@/utils/helpers';

type TabType = 'fields' | 'metrics';

const fieldTypeColors: Record<FieldType, string> = {
  string: 'bg-emerald-100 text-emerald-700',
  number: 'bg-blue-100 text-blue-700',
  boolean: 'bg-amber-100 text-amber-700',
  date: 'bg-purple-100 text-purple-700',
  object: 'bg-rose-100 text-rose-700',
  array: 'bg-cyan-100 text-cyan-700',
};

const fieldTypeIcons: Record<FieldType, React.ReactNode> = {
  string: <Type className="w-3 h-3" />,
  number: <Hash className="w-3 h-3" />,
  boolean: <Check className="w-3 h-3" />,
  date: <Calendar className="w-3 h-3" />,
  object: <Layers className="w-3 h-3" />,
  array: <Database className="w-3 h-3" />,
};

export default function Dictionary() {
  const [activeTab, setActiveTab] = useState<TabType>('fields');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedField, setSelectedField] = useState<DataField | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);

  const fieldCategories = useMemo(() => {
    const categories = new Set(mockDataFields.map(f => f.category));
    return ['all', ...Array.from(categories)];
  }, []);

  const metricCategories = useMemo(() => {
    const categories = new Set(mockMetrics.map(m => m.category));
    return ['all', ...Array.from(categories)];
  }, []);

  const filteredFields = useMemo(() => {
    return mockDataFields.filter(field => {
      const matchesSearch = field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || field.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const filteredMetrics = useMemo(() => {
    return mockMetrics.filter(metric => {
      const matchesSearch = metric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        metric.meaning.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || metric.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedCategory('all');
    setSelectedField(null);
    setSelectedMetric(null);
    setSearchQuery('');
  };

  const handleFieldClick = (field: DataField) => {
    setSelectedField(field);
    setSelectedMetric(null);
  };

  const handleMetricClick = (metric: Metric) => {
    setSelectedMetric(metric);
    setSelectedField(null);
  };

  const categories = activeTab === 'fields' ? fieldCategories : metricCategories;
  const categoryLabel = activeTab === 'fields' ? '字段分类' : '指标分类';

  return (
    <ProjectLayout>
      <div className="h-full flex bg-slate-50">
        <aside className="w-52 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">{categoryLabel}</h2>
          </div>
          <nav className="flex-1 p-2 overflow-y-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors",
                  selectedCategory === category
                    ? "bg-indigo-50 text-indigo-600 font-medium"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <span className="truncate">
                  {category === 'all' ? '全部' : category}
                </span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  selectedCategory === category
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-slate-100 text-slate-500"
                )}>
                  {category === 'all'
                    ? (activeTab === 'fields' ? mockDataFields.length : mockMetrics.length)
                    : (activeTab === 'fields'
                      ? mockDataFields.filter(f => f.category === category).length
                      : mockMetrics.filter(m => m.category === category).length)
                  }
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  <button
                    onClick={() => handleTabChange('fields')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                      activeTab === 'fields'
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <Database className="w-4 h-4" />
                    字段列表
                  </button>
                  <button
                    onClick={() => handleTabChange('metrics')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                      activeTab === 'metrics'
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <Calculator className="w-4 h-4" />
                    指标列表
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={activeTab === 'fields' ? '搜索字段名称或描述...' : '搜索指标名称或含义...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  {activeTab === 'fields' ? '新增字段' : '新增指标'}
                </Button>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>共找到</span>
              <span className="font-medium text-indigo-600">
                {activeTab === 'fields' ? filteredFields.length : filteredMetrics.length}
              </span>
              <span>个{activeTab === 'fields' ? '字段' : '指标'}</span>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'fields' ? (
              <div className="grid gap-3">
                {filteredFields.map((field) => (
                  <div
                    key={field.id}
                    onClick={() => handleFieldClick(field)}
                    className={cn(
                      "bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md",
                      selectedField?.id === field.id
                        ? "border-indigo-300 ring-2 ring-indigo-100 shadow-md"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-semibold text-slate-800 font-mono">
                            {field.name}
                          </h3>
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full",
                            fieldTypeColors[field.type]
                          )}>
                            {fieldTypeIcons[field.type]}
                            {field.type}
                          </span>
                          {field.required && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-rose-600 bg-rose-50 rounded-full">
                              必填
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">
                          {field.description}
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {field.category}
                          </span>
                          {field.relatedMetrics.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Calculator className="w-3.5 h-3.5" />
                              关联 {field.relatedMetrics.length} 个指标
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        selectedField?.id === field.id ? "text-indigo-500" : "text-slate-300"
                      )} />
                    </div>
                  </div>
                ))}

                {filteredFields.length === 0 && (
                  <div className="py-16 text-center">
                    <Database className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">暂无匹配的字段</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredMetrics.map((metric) => (
                  <div
                    key={metric.id}
                    onClick={() => handleMetricClick(metric)}
                    className={cn(
                      "bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md",
                      selectedMetric?.id === metric.id
                        ? "border-indigo-300 ring-2 ring-indigo-100 shadow-md"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-semibold text-slate-800">
                            {metric.name}
                          </h3>
                          {metric.unit && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full">
                              {metric.unit}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 px-3 py-2 bg-slate-50 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">计算公式</div>
                          <code className="text-xs text-slate-700 font-mono">{metric.formula}</code>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" />
                            {metric.category}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        selectedMetric?.id === metric.id ? "text-indigo-500" : "text-slate-300"
                      )} />
                    </div>
                  </div>
                ))}

                {filteredMetrics.length === 0 && (
                  <div className="py-16 text-center">
                    <Calculator className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">暂无匹配的指标</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col">
          {(selectedField || selectedMetric) ? (
            <>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">详情信息</h2>
                <button
                  onClick={() => {
                    setSelectedField(null);
                    setSelectedMetric(null);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {selectedField && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        字段名称
                      </label>
                      <div className="mt-1.5 text-sm font-semibold text-slate-800 font-mono">
                        {selectedField.name}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          字段类型
                        </label>
                        <div className="mt-1.5">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full",
                            fieldTypeColors[selectedField.type]
                          )}>
                            {fieldTypeIcons[selectedField.type]}
                            {selectedField.type}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          是否必填
                        </label>
                        <div className="mt-1.5">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full",
                            selectedField.required
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-100 text-slate-600"
                          )}>
                            {selectedField.required ? '是' : '否'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        所属分类
                      </label>
                      <div className="mt-1.5 text-sm text-slate-700">
                        {selectedField.category}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        字段描述
                      </label>
                      <div className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                        {selectedField.description}
                      </div>
                    </div>

                    {selectedField.defaultValue !== undefined && (
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          默认值
                        </label>
                        <div className="mt-1.5">
                          <code className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded-md font-mono">
                            {selectedField.defaultValue}
                          </code>
                        </div>
                      </div>
                    )}

                    {selectedField.relatedMetrics.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          关联指标 ({selectedField.relatedMetrics.length})
                        </label>
                        <div className="mt-2 space-y-2">
                          {selectedField.relatedMetrics.map(metricId => {
                            const metric = mockMetrics.find(m => m.id === metricId);
                            if (!metric) return null;
                            return (
                              <div
                                key={metric.id}
                                onClick={() => handleMetricClick(metric)}
                                className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors"
                              >
                                <div className="text-sm font-medium text-indigo-700">
                                  {metric.name}
                                </div>
                                <div className="text-xs text-indigo-500/70 mt-0.5 truncate">
                                  {metric.formula}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedMetric && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        指标名称
                      </label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                          {selectedMetric.name}
                        </span>
                        {selectedMetric.unit && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full">
                            {selectedMetric.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        所属分类
                      </label>
                      <div className="mt-1.5 text-sm text-slate-700">
                        {selectedMetric.category}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        计算公式
                      </label>
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <code className="text-xs text-slate-700 font-mono break-all">
                          {selectedMetric.formula}
                        </code>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        业务含义
                      </label>
                      <div className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                        {selectedMetric.meaning}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        相关字段
                      </label>
                      <div className="mt-2 space-y-2">
                        {mockDataFields
                          .filter(f => f.relatedMetrics.includes(selectedMetric.id))
                          .map(field => (
                            <div
                              key={field.id}
                              onClick={() => handleFieldClick(field)}
                              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-indigo-50 hover:border-indigo-100 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700 font-mono">
                                  {field.name}
                                </span>
                                <span className={cn(
                                  "inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded",
                                  fieldTypeColors[field.type]
                                )}>
                                  {field.type}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-1 truncate">
                                {field.description}
                              </div>
                            </div>
                          ))}
                        {mockDataFields.filter(f => f.relatedMetrics.includes(selectedMetric.id)).length === 0 && (
                          <p className="text-sm text-slate-400">暂无关联字段</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                {activeTab === 'fields' ? (
                  <Database className="w-8 h-8 text-slate-400" />
                ) : (
                  <Calculator className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">
                选择一个{activeTab === 'fields' ? '字段' : '指标'}查看详情
              </h3>
              <p className="text-xs text-slate-400">
                点击左侧列表中的{activeTab === 'fields' ? '字段' : '指标'}项
              </p>
            </div>
          )}
        </aside>
      </div>
    </ProjectLayout>
  );
}
