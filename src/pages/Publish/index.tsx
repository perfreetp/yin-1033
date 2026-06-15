import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Rocket,
  Copy,
  Check,
  Share2,
  Lock,
  Eye,
  MessageSquare,
  Clock,
  Download,
  Image,
  FileSpreadsheet,
  FileJson,
  History,
  Plus,
  Calendar,
  User,
  ChevronRight,
  Shield,
  Link2,
  Edit3,
  Save,
  FileText,
  Sparkles,
} from 'lucide-react';
import ProjectLayout from '@/components/Layout/ProjectLayout';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { mockPublish, mockChangeLog, mockDataFields, mockMetrics } from '@/data/mockData';
import { useProjectStore } from '@/store/useProjectStore';
import { useProjectCanvasStore } from '@/store/useProjectCanvasStore';
import { usePermissionLogStore } from '@/store/usePermissionLogStore';
import type { PublishPermission, ChangeLogItem, Version } from '@/types';
import { cn, formatDate, copyToClipboard, exportToCSV, exportToJSON, exportCanvasToPNG } from '@/utils/helpers';

const permissionOptions: { value: PublishPermission; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'private',
    label: '私有',
    icon: <Lock className="w-4 h-4" />,
    description: '仅项目成员可查看',
  },
  {
    value: 'view_only',
    label: '仅查看',
    icon: <Eye className="w-4 h-4" />,
    description: '获得链接的人可查看',
  },
  {
    value: 'comment',
    label: '可评论',
    icon: <MessageSquare className="w-4 h-4" />,
    description: '获得链接的人可查看和评论',
  },
];

const expireOptions = [
  { value: '7d', label: '7 天' },
  { value: '30d', label: '30 天' },
  { value: '90d', label: '90 天' },
  { value: 'never', label: '永久有效' },
];

const getActionIcon = (action: string) => {
  switch (action) {
    case '创建项目':
      return <Plus className="w-4 h-4" />;
    case '添加节点':
      return <Plus className="w-4 h-4" />;
    case '修改节点':
      return <Edit3 className="w-4 h-4" />;
    case '发布版本':
      return <Rocket className="w-4 h-4" />;
    case '添加成员':
      return <User className="w-4 h-4" />;
    case '评论':
      return <MessageSquare className="w-4 h-4" />;
    default:
      return <History className="w-4 h-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case '创建项目':
      return 'bg-emerald-100 text-emerald-600';
    case '添加节点':
      return 'bg-blue-100 text-blue-600';
    case '修改节点':
      return 'bg-amber-100 text-amber-600';
    case '发布版本':
      return 'bg-indigo-100 text-indigo-600';
    case '添加成员':
      return 'bg-purple-100 text-purple-600';
    case '评论':
      return 'bg-rose-100 text-rose-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

export default function Publish() {
  const { id } = useParams<{ id: string }>();
  const projects = useProjectStore(state => state.projects);
  const initProjectCanvas = useProjectCanvasStore(state => state.initProjectCanvas);
  const createVersion = useProjectCanvasStore(state => state.createVersion);
  const projectCanvases = useProjectCanvasStore(state => state.projectCanvases);
  const projectVersions = useProjectCanvasStore(state => state.projectVersions);
  const currentProjectId = useProjectCanvasStore(state => state.currentProjectId);
  
  const [copied, setCopied] = useState(false);
  const [permission, setPermission] = useState<PublishPermission>(mockPublish.permission);
  const [expireOption, setExpireOption] = useState('never');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishDescription, setPublishDescription] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [changeLogs, setChangeLogs] = useState<ChangeLogItem[]>(mockChangeLog);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [draftDescription, setDraftDescription] = useState('');
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    if (id) {
      initProjectCanvas(id);
    }
  }, [id, initProjectCanvas]);

  const currentProject = useMemo(() => {
    return projects.find(p => p.id === id);
  }, [projects, id]);

  const isViewer = currentProject?.role === 'viewer';
  const addPermissionLog = usePermissionLogStore(state => state.addLog);

  const handlePermissionDenied = (action: string) => {
    if (id && currentProject) {
      addPermissionLog(id, {
        userId: currentProject.ownerId,
        userName: currentProject.ownerName,
        userRole: currentProject.role,
        action,
      });
    }
    alert('您是查看者，没有权限执行此操作。如需编辑，请联系管理员。');
  };

  const versions = useMemo(() => {
    if (!currentProjectId) return [];
    return projectVersions[currentProjectId] || [];
  }, [projectVersions, currentProjectId]);

  const latestVersion = useMemo(() => {
    return versions.length > 0 ? versions[0] : null;
  }, [versions]);

  const selectedVersion = useMemo(() => {
    if (selectedVersionId) {
      return versions.find(v => v.id === selectedVersionId) || null;
    }
    return latestVersion;
  }, [selectedVersionId, versions, latestVersion]);

  const canvasData = useMemo(() => {
    if (selectedVersion) {
      return selectedVersion.snapshot;
    }
    if (!currentProjectId) return { nodes: [], edges: [], lanes: [] };
    const canvas = projectCanvases[currentProjectId];
    return canvas || { nodes: [], edges: [], lanes: [] };
  }, [selectedVersion, projectCanvases, currentProjectId]);

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(mockPublish.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleExportPNG = async () => {
    try {
      setExporting(true);
      const { nodes, edges, lanes } = canvasData;
      const version = selectedVersion?.version || 'current';
      await exportCanvasToPNG(nodes, edges, lanes, `canvas-${version}.png`);
    } catch (err) {
      console.error('导出图片失败:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['类型', '名称', '描述', '分类'];
    const rows = [
      ...mockDataFields.map(f => ['字段', f.name, f.description, f.category]),
      ...mockMetrics.map(m => ['指标', m.name, m.meaning, m.category]),
    ];
    exportToCSV(headers, rows, `data-dictionary-${selectedVersion?.version || 'current'}.csv`);
  };

  const handleExportJSON = () => {
    const data = {
      version: selectedVersion?.version || 'v1.0.0',
      publishDate: selectedVersion?.createdAt || new Date().toISOString(),
      fields: mockDataFields,
      metrics: mockMetrics,
    };
    exportToJSON(data, `data-dictionary-${selectedVersion?.version || 'current'}.json`);
  };

  const handleSaveDraft = () => {
    if (draftDescription.trim()) {
      setHasDraft(true);
    }
  };

  const handlePublish = () => {
    setPublishing(true);
    const description = publishDescription.trim() || draftDescription.trim() || '发布新版本';
    setTimeout(() => {
      const newVersion = createVersion(description);
      setSelectedVersionId(newVersion.id);
      setChangeLogs(prev => [{
        id: `cl-${Date.now()}`,
        action: '发布版本',
        user: '我',
        timestamp: new Date().toISOString(),
        description: `发布版本 ${newVersion.version}`,
      }, ...prev]);
      setPublishing(false);
      setPublishSuccess(true);
      setHasDraft(false);
      setDraftDescription('');
      setTimeout(() => {
        setPublishSuccess(false);
        setIsPublishModalOpen(false);
        setPublishDescription('');
      }, 1500);
    }, 800);
  };

  const handleSelectVersion = (versionId: string) => {
    setSelectedVersionId(versionId);
  };

  const currentPermission = permissionOptions.find(p => p.value === permission);

  const handleOpenPublishModal = () => {
    if (isViewer) {
      handlePermissionDenied('尝试发布新版本');
      return;
    }
    if (hasDraft && draftDescription) {
      setPublishDescription(draftDescription);
    }
    setIsPublishModalOpen(true);
  };

  return (
    <ProjectLayout>
      <div className="min-h-full bg-slate-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-slate-800">发布管理</h1>
              <p className="mt-1 text-sm text-slate-500">管理项目的发布版本和分享设置</p>
            </div>
            <Button
              onClick={handleOpenPublishModal}
              className={cn("gap-2", isViewer && "opacity-50 cursor-not-allowed")}
            >
              <Rocket className="w-4 h-4" />
              {isViewer ? '无发布权限' : '发布新版本'}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <History className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">发布历史</h3>
                    <span className="ml-auto text-xs text-slate-400">
                      共 {versions.length} 个版本
                    </span>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {versions.map((version, index) => (
                    <button
                      key={version.id}
                      onClick={() => handleSelectVersion(version.id)}
                      className={cn(
                        'w-full p-4 text-left border-b border-slate-100 transition-all hover:bg-slate-50',
                        selectedVersion?.id === version.id && 'bg-indigo-50/50',
                        index === versions.length - 1 && 'border-b-0'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          index === 0
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        )}>
                          {index === 0 ? (
                            <Sparkles className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800 truncate">
                              {version.version}
                            </span>
                            {index === 0 && (
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-600 rounded-full">
                              当前发布
                            </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {version.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {version.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(version.createdAt)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          'w-4 h-4 flex-shrink-0 transition-colors',
                          selectedVersion?.id === version.id
                            ? 'text-indigo-500'
                            : 'text-slate-300'
                        )} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {!isViewer && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Edit3 className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      草稿箱
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <textarea
                      value={draftDescription}
                      onChange={(e) => setDraftDescription(e.target.value)}
                      placeholder="记录下一次发布的说明..."
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                    />
                    <div className="flex items-center justify-between">
                      {hasDraft && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <Save className="w-3 h-3" />
                          有未发布的草稿
                        </span>
                      )}
                      {!hasDraft && <span className="text-xs text-slate-400">暂无草稿</span>}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSaveDraft}
                        disabled={!draftDescription.trim()}
                        className="gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        保存草稿
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Rocket className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-white/80">
                        {selectedVersion?.id === latestVersion?.id
                          ? '当前发布版本'
                          : '历史发布版本'
                        }
                      </span>
                    </div>
                    <div className="text-3xl font-bold mb-2">
                      {selectedVersion?.version || 'v1.0.0'}
                    </div>
                    <p className="text-sm text-white/70 max-w-md">
                      {selectedVersion?.description || '暂无发布'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/60 mb-1">发布时间</div>
                    <div className="text-sm font-medium">
                      {formatDate(selectedVersion?.createdAt || new Date().toISOString())}
                    </div>
                    <div className="text-xs text-white/60 mt-2 mb-1">发布人</div>
                    <div className="text-sm font-medium">
                      {selectedVersion?.author || '-'}
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-white/70" />
                      <span className="text-sm text-white/80">
                        {currentPermission?.label}
                      </span>
                    </div>
                    {mockPublish.expireAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-white/70" />
                        <span className="text-sm text-white/80">
                          有效期至 {formatDate(mockPublish.expireAt)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full bg-white/30 border-2 border-white/50 flex items-center justify-center text-xs font-medium"
                        >
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-white/70 ml-2">24 次查看</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Share2 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">分享设置</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-2 block">分享链接</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <Link2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-600 truncate font-mono">
                            {mockPublish.shareUrl}
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleCopyLink}
                          className="gap-1.5"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-500" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              复制
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-2 block">
                        权限设置
                        {isViewer && <span className="ml-2 text-amber-500">（仅查看）</span>}
                      </label>
                      <div className="space-y-2">
                        {permissionOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              if (isViewer) {
                                handlePermissionDenied('尝试修改权限设置');
                              } else {
                                setPermission(option.value);
                              }
                            }}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                              permission === option.value
                                ? 'border-indigo-300 bg-indigo-50/50 ring-1 ring-indigo-200'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                              isViewer && 'opacity-60 hover:border-slate-200 hover:bg-transparent'
                            )}
                          >
                            <div className={cn(
                              'p-2 rounded-lg flex-shrink-0',
                              permission === option.value
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'bg-slate-100 text-slate-500'
                            )}>
                              {option.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-800">
                                {option.label}
                              </div>
                              <div className="text-xs text-slate-500">
                                {option.description}
                              </div>
                            </div>
                            <div className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                              permission === option.value
                                ? 'border-indigo-500 bg-indigo-500'
                                : 'border-slate-300'
                            )}>
                              {permission === option.value && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-2 block">
                        有效期
                        {isViewer && <span className="ml-2 text-amber-500">（仅查看）</span>}
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {expireOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              if (isViewer) {
                                handlePermissionDenied('尝试修改有效期设置');
                              } else {
                                setExpireOption(option.value);
                              }
                            }}
                            className={cn(
                              'px-3 py-2 text-sm rounded-lg border transition-all',
                              expireOption === option.value
                                ? 'border-indigo-300 bg-indigo-50 text-indigo-600 font-medium'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                              isViewer && 'opacity-60 hover:border-slate-200 hover:bg-transparent'
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Download className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">导出功能</h3>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleExportPNG}
                      disabled={exporting}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-lg border transition-all group",
                        exporting
                          ? "border-slate-200 opacity-60 cursor-not-allowed"
                          : "border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30"
                      )}
                    >
                      <div className={cn(
                        "p-2.5 rounded-lg transition-colors",
                        exporting ? "bg-slate-100" : "bg-slate-100 group-hover:bg-indigo-100"
                      )}>
                        {exporting ? (
                          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        ) : (
                          <Image className={cn("w-5 h-5 transition-colors",
                            exporting ? "text-slate-400" : "text-slate-600 group-hover:text-indigo-600"
                          )} />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-slate-800">
                          {exporting ? '导出中...' : '导出图片'}
                        </div>
                        <div className="text-xs text-slate-500">PNG 格式，高清画布截图</div>
                      </div>
                      {!exporting && (
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      )}
                    </button>

                    <button
                      onClick={handleExportCSV}
                      className="w-full flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                    >
                      <div className="p-2.5 bg-slate-100 group-hover:bg-indigo-100 rounded-lg transition-colors">
                        <FileSpreadsheet className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-slate-800">导出清单 CSV</div>
                        <div className="text-xs text-slate-500">包含字段和指标的完整清单</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </button>

                    <button
                      onClick={handleExportJSON}
                      className="w-full flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                    >
                      <div className="p-2.5 bg-slate-100 group-hover:bg-indigo-100 rounded-lg transition-colors">
                        <FileJson className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-slate-800">导出清单 JSON</div>
                        <div className="text-xs text-slate-500">结构化数据，便于程序处理</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </button>
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-500 leading-relaxed">
                        导出的数据基于 <span className="font-medium text-slate-700">{selectedVersion?.version || '当前版本'}</span>，包含所有字段和指标的完整信息。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <History className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">变更记录</h3>
                  <span className="ml-auto text-xs text-slate-400">
                    共 {changeLogs.length} 条记录
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
                  <div className="space-y-5">
                    {changeLogs.map((log: ChangeLogItem) => (
                      <div key={log.id} className="relative flex gap-4">
                        <div className={cn(
                          'relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                          getActionColor(log.action)
                        )}>
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex-1 pt-1 pb-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-medium text-slate-800">
                                {log.description}
                              </div>
                              <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" />
                                  {log.user}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {formatDate(log.timestamp)}
                                </span>
                              </div>
                            </div>
                            <span className={cn(
                              'flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full',
                              getActionColor(log.action)
                            )}>
                              {log.action}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => !publishing && !publishSuccess && setIsPublishModalOpen(false)}
        title="发布新版本"
        className="max-w-md"
      >
        {publishSuccess ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">发布成功</h3>
            <p className="text-sm text-slate-500">新版本已成功发布</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                版本说明
              </label>
              <textarea
                value={publishDescription}
                onChange={(e) => setPublishDescription(e.target.value)}
                placeholder="描述本次发布的主要内容和变更..."
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500 mb-2">发布预览</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  v
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">新版本将创建</div>
                  <div className="text-xs text-slate-500">基于当前画布的最新状态</div>
                </div>
              </div>
            </div>

            {hasDraft && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-xs text-amber-600 flex items-center gap-1">
                  <Save className="w-3.5 h-3.5" />
                  当前有未发布的草稿，已自动填充版本说明
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setIsPublishModalOpen(false)}
                disabled={publishing}
              >
                取消
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handlePublish}
                disabled={publishing}
              >
                {publishing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    发布中...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    确认发布
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </ProjectLayout>
  );
}
