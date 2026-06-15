import { useState, useMemo } from 'react';
import { Search, Plus, Database, Calculator, ChevronRight, X, Hash, Type, Calendar, Check, Info, FileText, Layers } from 'lucide-react';
import ProjectLayout from '@/components/Layout/ProjectLayout';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
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

const fieldTypes: FieldType[] = ['string', 'number', 'boolean', 'date', 'object', 'array'];

interface NewFieldForm {
  name: string;
  type: FieldType;
  category: string;
  description: string;
  required: boolean;
  defaultValue: string;
}

interface NewMetricForm {
  name: string;
  category: string;
  formula: string;
  meaning: string;
  unit: string;
}

const initialFieldForm: NewFieldForm = {
  name: '',
  type: 'string',
  category: '',
  description: '',
  required: false,
  defaultValue: '',
};

const initialMetricForm: NewMetricForm = {
  name: '',
  category: '',
  formula: '',
  meaning: '',
  unit: '',
};

export default function Dictionary() {
  const [activeTab, setActiveTab] = useState<TabType>('fields');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedField, setSelectedField] = useState<DataField | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [fields, setFields] = useState<DataField[]>(mockDataFields);
  const [metrics, setMetrics] = useState<Metric[]>(mockMetrics);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [fieldForm, setFieldForm] = useState<NewFieldForm>(initialFieldForm);
  const [metricForm, setMetricForm] = useState<NewMetricForm>(initialMetricForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof NewFieldForm, string>>>({});
  const [metricErrors, setMetricErrors] = useState<Partial<Record<keyof NewMetricForm, string>>>({});

  const fieldCategories = useMemo(() => {
    const categories = new Set(fields.map(f => f.category));
    return ['all', ...Array.from(categories)];
  }, [fields]);

  const metricCategories = useMemo(() => {
    const categories = new Set(metrics.map(m => m.category));
    return ['all', ...Array.from(categories)];
  }, [metrics]);

  const filteredFields = useMemo(() => {
    return fields.filter(field => {
      const matchesSearch = field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || field.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [fields, searchQuery, selectedCategory]);

  const filteredMetrics = useMemo(() => {
    return metrics.filter(metric => {
      const matchesSearch = metric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        metric.meaning.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || metric.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [metrics, searchQuery, selectedCategory]);

  const validateFieldForm = (): boolean => {
    const errors: Partial<Record<keyof NewFieldForm, string>> = {};
    if (!fieldForm.name.trim()) {
      errors.name = '字段名称不能为空';
    }
    if (!fieldForm.category.trim()) {
      errors.category = '所属分类不能为空';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateMetricForm = (): boolean => {
    const errors: Partial<Record<keyof NewMetricForm, string>> = {};
    if (!metricForm.name.trim()) {
      errors.name = '指标名称不能为空';
    }
    if (!metricForm.category.trim()) {
      errors.category = '所属分类不能为空';
    }
    setMetricErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddField = () => {
    if (!validateFieldForm()) return;

    const newField: DataField = {
      id: `field-${Date.now()}`,
      name: fieldForm.name.trim(),
      type: fieldForm.type,
      description: fieldForm.description.trim() || '暂无描述',
      category: fieldForm.category.trim(),
      relatedMetrics: [],
      required: fieldForm.required,
      defaultValue: fieldForm.defaultValue.trim() || undefined,
    };

    setFields(prev => [newField, ...prev]);
    setSelectedField(newField);
    setSelectedMetric(null);
    setIsFieldModalOpen(false);
    setFieldForm(initialFieldForm);
    setFieldErrors({});
    setSelectedCategory('all');
  };

  const handleAddMetric = () => {
    if (!validateMetricForm()) return;

    const newMetric: Metric = {
      id: `metric-${Date.now()}`,
      name: metricForm.name.trim(),
      formula: metricForm.formula.trim() || '暂无公式',
      meaning: metricForm.meaning.trim() || '暂无含义',
      category: metricForm.category.trim(),
      unit: metricForm.unit.trim() || undefined,
    };

    setMetrics(prev => [newMetric, ...prev]);
    setSelectedMetric(newMetric);
    setSelectedField(null);
    setIsMetricModalOpen(false);
    setMetricForm(initialMetricForm);
    setMetricErrors({});
    setSelectedCategory('all');
  };

  const openFieldModal = () => {
    setFieldForm(initialFieldForm);
    setFieldErrors({});
    setIsFieldModalOpen(true);
  };

  const openMetricModal = () => {
    setMetricForm(initialMetricForm);
    setMetricErrors({});
    setIsMetricModalOpen(true);
  };

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
                    ? (activeTab === 'fields' ? fields.length : metrics.length)
                    : (activeTab === 'fields'
                      ? fields.filter(f => f.category === category).length
                      : metrics.filter(m => m.category === category).length)
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
                <Button size="sm" className="gap-1.5" onClick={activeTab === 'fields' ? openFieldModal : openMetricModal}>
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
                            const metric = metrics.find(m => m.id === metricId);
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
                        {fields
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
                        {fields.filter(f => f.relatedMetrics.includes(selectedMetric.id)).length === 0 && (
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

      <Modal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        title="新增字段"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              字段名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fieldForm.name}
              onChange={(e) => setFieldForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入字段名称"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all",
                fieldErrors.name
                  ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  : "border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              )}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-rose-500">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              字段类型
            </label>
            <select
              value={fieldForm.type}
              onChange={(e) => setFieldForm(prev => ({ ...prev, type: e.target.value as FieldType }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
            >
              {fieldTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              所属分类 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fieldForm.category}
              onChange={(e) => setFieldForm(prev => ({ ...prev, category: e.target.value }))}
              placeholder="请输入分类名称，可输入新分类或选择已有分类"
              list="field-categories"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all",
                fieldErrors.category
                  ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  : "border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              )}
            />
            <datalist id="field-categories">
              {fieldCategories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            {fieldErrors.category && (
              <p className="mt-1 text-xs text-rose-500">{fieldErrors.category}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              字段描述
            </label>
            <textarea
              value={fieldForm.description}
              onChange={(e) => setFieldForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请输入字段描述"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                是否必填
              </label>
              <p className="text-xs text-slate-400 mt-0.5">该字段是否为必填项</p>
            </div>
            <button
              type="button"
              onClick={() => setFieldForm(prev => ({ ...prev, required: !prev.required }))}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                fieldForm.required ? "bg-indigo-600" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                  fieldForm.required ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              默认值 <span className="text-slate-400 font-normal">（可选）</span>
            </label>
            <input
              type="text"
              value={fieldForm.defaultValue}
              onChange={(e) => setFieldForm(prev => ({ ...prev, defaultValue: e.target.value }))}
              placeholder="请输入默认值"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsFieldModalOpen(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleAddField}
            >
              确认新增
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isMetricModalOpen}
        onClose={() => setIsMetricModalOpen(false)}
        title="新增指标"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              指标名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={metricForm.name}
              onChange={(e) => setMetricForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入指标名称"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all",
                metricErrors.name
                  ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  : "border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              )}
            />
            {metricErrors.name && (
              <p className="mt-1 text-xs text-rose-500">{metricErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              所属分类 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={metricForm.category}
              onChange={(e) => setMetricForm(prev => ({ ...prev, category: e.target.value }))}
              placeholder="请输入分类名称"
              list="metric-categories"
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all",
                metricErrors.category
                  ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  : "border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              )}
            />
            <datalist id="metric-categories">
              {metricCategories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            {metricErrors.category && (
              <p className="mt-1 text-xs text-rose-500">{metricErrors.category}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              计算公式
            </label>
            <input
              type="text"
              value={metricForm.formula}
              onChange={(e) => setMetricForm(prev => ({ ...prev, formula: e.target.value }))}
              placeholder="请输入计算公式"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              业务含义
            </label>
            <textarea
              value={metricForm.meaning}
              onChange={(e) => setMetricForm(prev => ({ ...prev, meaning: e.target.value }))}
              placeholder="请输入业务含义"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              单位 <span className="text-slate-400 font-normal">（可选）</span>
            </label>
            <input
              type="text"
              value={metricForm.unit}
              onChange={(e) => setMetricForm(prev => ({ ...prev, unit: e.target.value }))}
              placeholder="请输入单位，如：人、元、%"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsMetricModalOpen(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleAddMetric}
            >
              确认新增
            </Button>
          </div>
        </div>
      </Modal>
    </ProjectLayout>
  );
}
