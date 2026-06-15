import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  GitBranch, 
  Clock, 
  User, 
  Eye, 
  RotateCcw, 
  ArrowLeftRight, 
  Plus, 
  X, 
  Check,
  ChevronRight,
  FileCode,
  AlertTriangle,
  Circle,
  Minus,
  Zap
} from 'lucide-react';
import ProjectLayout from '@/components/Layout/ProjectLayout';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { useProjectCanvasStore } from '@/store/useProjectCanvasStore';
import { useProjectStore } from '@/store/useProjectStore';
import { usePermissionLogStore } from '@/store/usePermissionLogStore';
import type { Version, CanvasNode, CanvasEdge } from '@/types';
import { cn, formatDate, formatRelativeTime } from '@/utils/helpers';

type ViewMode = 'detail' | 'compare';
type ChangeTab = 'nodes' | 'edges';

interface NodeDiff {
  added: CanvasNode[];
  removed: CanvasNode[];
  modified: { before: CanvasNode; after: CanvasNode; changes: string[] }[];
}

interface EdgeDiff {
  added: CanvasEdge[];
  removed: CanvasEdge[];
}

export default function Versions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projects = useProjectStore(state => state.projects);
  const currentProject = useMemo(() => projects.find(p => p.id === id), [projects, id]);
  const isViewer = currentProject?.role === 'viewer';
  const addPermissionLog = usePermissionLogStore(state => state.addLog);
  const initProjectCanvas = useProjectCanvasStore(state => state.initProjectCanvas);
  const createVersion = useProjectCanvasStore(state => state.createVersion);
  const restoreVersion = useProjectCanvasStore(state => state.restoreVersion);
  const projectVersions = useProjectCanvasStore(state => state.projectVersions);
  const currentProjectId = useProjectCanvasStore(state => state.currentProjectId);
  
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [compareVersion1, setCompareVersion1] = useState<Version | null>(null);
  const [compareVersion2, setCompareVersion2] = useState<Version | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<Version | null>(null);
  const [newVersionDescription, setNewVersionDescription] = useState('');
  const [highlightNodeId, setHighlightNodeId] = useState<string | null>(null);
  const [highlightEdgeId, setHighlightEdgeId] = useState<string | null>(null);
  const [changeTab, setChangeTab] = useState<ChangeTab>('nodes');

  useEffect(() => {
    if (id) {
      initProjectCanvas(id);
    }
  }, [id, initProjectCanvas]);

  const versions = useMemo(() => {
    if (!currentProjectId) return [];
    return projectVersions[currentProjectId] || [];
  }, [projectVersions, currentProjectId]);

  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [versions]);

  const currentVersion = sortedVersions[0];

  const isCurrentVersion = (version: Version) => {
    return version.id === currentVersion?.id;
  };

  const handleVersionClick = (version: Version) => {
    setSelectedVersion(version);
    setViewMode('detail');
  };

  const handlePreview = (version: Version, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVersion(version);
    setViewMode('detail');
  };

  const handleCompare = (version: Version, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!compareVersion1) {
      setCompareVersion1(version);
    } else if (!compareVersion2 && version.id !== compareVersion1.id) {
      setCompareVersion2(version);
      setViewMode('compare');
    } else {
      setCompareVersion1(version);
      setCompareVersion2(null);
    }
  };

  const handleRestore = (version: Version, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentVersion(version)) return;
    if (isViewer) {
      handlePermissionDenied('尝试恢复版本');
      return;
    }
    setVersionToRestore(version);
    setIsRestoreModalOpen(true);
  };

  const confirmRestore = () => {
    if (versionToRestore) {
      restoreVersion(versionToRestore.id);
      if (id) {
        navigate(`/project/${id}/canvas`);
      }
    }
    setIsRestoreModalOpen(false);
    setVersionToRestore(null);
  };

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

  const handleCreateVersion = () => {
    if (isViewer) {
      handlePermissionDenied('尝试创建版本');
      return;
    }
    setIsCreateModalOpen(true);
  };

  const confirmCreateVersion = () => {
    if (newVersionDescription.trim()) {
      createVersion(newVersionDescription.trim());
      setNewVersionDescription('');
      setIsCreateModalOpen(false);
    }
  };

  const clearCompare = () => {
    setCompareVersion1(null);
    setCompareVersion2(null);
    setViewMode('detail');
  };

  const swapCompare = () => {
    const temp = compareVersion1;
    setCompareVersion1(compareVersion2);
    setCompareVersion2(temp);
    setHighlightNodeId(null);
    setHighlightEdgeId(null);
  };

  const nodeDiff = useMemo<NodeDiff>(() => {
    if (!compareVersion1 || !compareVersion2) {
      return { added: [], removed: [], modified: [] };
    }

    const v1Nodes = compareVersion1.snapshot.nodes;
    const v2Nodes = compareVersion2.snapshot.nodes;
    const v1NodeMap = new Map(v1Nodes.map(n => [n.id, n]));
    const v2NodeMap = new Map(v2Nodes.map(n => [n.id, n]));

    const added: CanvasNode[] = [];
    const removed: CanvasNode[] = [];
    const modified: { before: CanvasNode; after: CanvasNode; changes: string[] }[] = [];

    for (const node of v2Nodes) {
      if (!v1NodeMap.has(node.id)) {
        added.push(node);
      }
    }

    for (const node of v1Nodes) {
      if (!v2NodeMap.has(node.id)) {
        removed.push(node);
      }
    }

    for (const v2Node of v2Nodes) {
      const v1Node = v1NodeMap.get(v2Node.id);
      if (v1Node) {
        const changes: string[] = [];
        if (v1Node.label !== v2Node.label) changes.push('label');
        if (v1Node.color !== v2Node.color) changes.push('color');
        if (v1Node.x !== v2Node.x || v1Node.y !== v2Node.y) changes.push('position');
        if (v1Node.width !== v2Node.width || v1Node.height !== v2Node.height) changes.push('size');
        if (v1Node.type !== v2Node.type) changes.push('type');
        if (v1Node.laneId !== v2Node.laneId) changes.push('lane');
        if (changes.length > 0) {
          modified.push({ before: v1Node, after: v2Node, changes });
        }
      }
    }

    return { added, removed, modified };
  }, [compareVersion1, compareVersion2]);

  const edgeDiff = useMemo<EdgeDiff>(() => {
    if (!compareVersion1 || !compareVersion2) {
      return { added: [], removed: [] };
    }

    const v1Edges = compareVersion1.snapshot.edges;
    const v2Edges = compareVersion2.snapshot.edges;
    const v1EdgeMap = new Map(v1Edges.map(e => [e.id, e]));

    const added: CanvasEdge[] = [];
    const removed: CanvasEdge[] = [];

    for (const edge of v2Edges) {
      if (!v1EdgeMap.has(edge.id)) {
        added.push(edge);
      }
    }

    for (const edge of v1Edges) {
      if (!v2Edges.find(e => e.id === edge.id)) {
        removed.push(edge);
      }
    }

    return { added, removed };
  }, [compareVersion1, compareVersion2]);

  const handleNodeChangeClick = (nodeId: string) => {
    setHighlightNodeId(nodeId);
    setHighlightEdgeId(null);
  };

  const handleEdgeChangeClick = (edgeId: string) => {
    setHighlightEdgeId(edgeId);
    setHighlightNodeId(null);
  };

  const previewNodes = useMemo(() => {
    if (!compareVersion2) return [];
    return compareVersion2.snapshot.nodes;
  }, [compareVersion2]);

  const previewEdges = useMemo(() => {
    if (!compareVersion2) return [];
    return compareVersion2.snapshot.edges;
  }, [compareVersion2]);

  const previewBounds = useMemo(() => {
    if (previewNodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 300, maxY: 200 };
    }
    const minX = Math.min(...previewNodes.map(n => n.x));
    const minY = Math.min(...previewNodes.map(n => n.y));
    const maxX = Math.max(...previewNodes.map(n => n.x + n.width));
    const maxY = Math.max(...previewNodes.map(n => n.y + n.height));
    return { minX, minY, maxX, maxY };
  }, [previewNodes]);

  return (
    <ProjectLayout>
      <div className="h-full flex bg-slate-50">
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-600" />
                版本列表
              </h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {sortedVersions.length} 个版本
              </span>
            </div>
            <Button size="sm" className={cn("w-full gap-1.5", isViewer && "opacity-50 cursor-not-allowed")} onClick={handleCreateVersion}>
              <Plus className="w-4 h-4" />
              {isViewer ? '仅查看' : '创建版本'}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="relative py-4 pl-6 pr-4">
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200" />
              
              {sortedVersions.map((version) => {
                const isCurrent = isCurrentVersion(version);
                const isSelected = selectedVersion?.id === version.id;
                const isCompare1 = compareVersion1?.id === version.id;
                const isCompare2 = compareVersion2?.id === version.id;
                
                return (
                  <div key={version.id} className="relative mb-4 last:mb-0">
                    <div className={cn(
                      "absolute -left-0.5 top-3 w-3 h-3 rounded-full border-2 border-white z-10",
                      isCurrent 
                        ? "bg-indigo-600 w-4 h-4 -left-1 top-2.5" 
                        : "bg-slate-300"
                    )}>
                      {isCurrent && (
                        <div className="absolute inset-0 rounded-full bg-indigo-600 animate-ping opacity-30" />
                      )}
                    </div>

                    <div
                      onClick={() => handleVersionClick(version)}
                      className={cn(
                        "ml-5 bg-white border rounded-xl p-3 cursor-pointer transition-all hover:shadow-md",
                        isSelected && viewMode === 'detail'
                          ? "border-indigo-300 ring-2 ring-indigo-100 shadow-md"
                          : "border-slate-200 hover:border-slate-300",
                        isCompare1 && "border-emerald-300 ring-2 ring-emerald-100",
                        isCompare2 && "border-amber-300 ring-2 ring-amber-100"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={cn(
                              "text-sm font-semibold",
                              isCurrent ? "text-indigo-600" : "text-slate-800"
                            )}>
                              {version.version}
                            </h3>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-white bg-indigo-600 rounded-full">
                                当前
                              </span>
                            )}
                          </div>
                          
                          <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">
                            {version.description}
                          </p>
                          
                          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatRelativeTime(version.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {version.author}
                            </span>
                          </div>
                        </div>
                        
                        <ChevronRight className={cn(
                          "w-5 h-5 flex-shrink-0 mt-1 transition-colors",
                          isSelected ? "text-indigo-500" : "text-slate-300"
                        )} />
                      </div>

                      <div className="mt-3 flex items-center gap-1 pt-2 border-t border-slate-100">
                        <button
                          onClick={(e) => handlePreview(version, e)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          预览
                        </button>
                        <button
                          onClick={(e) => handleCompare(version, e)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-md transition-colors",
                            (isCompare1 || isCompare2)
                              ? "text-indigo-600 bg-indigo-50"
                              : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          )}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          {isCompare1 ? '对比A' : isCompare2 ? '对比B' : '对比'}
                        </button>
                        <button
                          onClick={(e) => handleRestore(version, e)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-md transition-colors",
                            isCurrent
                              ? "text-slate-300 cursor-not-allowed"
                              : isViewer
                                ? "text-slate-400 opacity-60"
                                : "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                          )}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          恢复
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('detail')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                      viewMode === 'detail'
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <FileCode className="w-4 h-4" />
                    版本详情
                  </button>
                  <button
                    onClick={() => setViewMode('compare')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                      viewMode === 'compare'
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    版本对比
                  </button>
                </div>

                {viewMode === 'compare' && (compareVersion1 || compareVersion2) && (
                  <button
                    onClick={clearCompare}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    清除对比
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6">
            {viewMode === 'detail' ? (
              selectedVersion ? (
                <div className="max-w-3xl mx-auto">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-800">
                              {selectedVersion.version}
                            </h2>
                            {isCurrentVersion(selectedVersion) && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 rounded-full">
                                <Check className="w-3 h-3" />
                                当前版本
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            {selectedVersion.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isCurrentVersion(selectedVersion) && (
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => handleRestore(selectedVersion, { stopPropagation: () => {} } as React.MouseEvent)}
                              className={cn("gap-1.5", isViewer && "opacity-50 cursor-not-allowed")}
                            >
                              <RotateCcw className="w-4 h-4" />
                              恢复此版本
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>作者：{selectedVersion.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>创建时间：{formatDate(selectedVersion.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-5">
                      <h3 className="text-sm font-semibold text-slate-800 mb-4">版本快照</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-indigo-600">
                            {selectedVersion.snapshot.nodes.length}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">节点数量</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-emerald-600">
                            {selectedVersion.snapshot.edges.length}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">连线数量</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-amber-600">
                            {selectedVersion.snapshot.lanes.length}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">泳道数量</div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-5 border-t border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-800 mb-3">变更说明</h3>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {selectedVersion.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <GitBranch className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-base font-medium text-slate-600 mb-1">选择一个版本查看详情</h3>
                  <p className="text-sm text-slate-400">点击左侧列表中的版本项</p>
                </div>
              )
            ) : (
              compareVersion1 && compareVersion2 ? (
                <div className="h-full flex flex-col gap-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium text-emerald-700">
                        {compareVersion1.version}
                      </span>
                    </div>
                    <button
                      onClick={swapCompare}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="交换版本"
                    >
                      <ArrowLeftRight className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-sm font-medium text-amber-700">
                        {compareVersion2.version}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden">
                      <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-emerald-800">
                              {compareVersion1.version}
                            </h3>
                            <p className="text-xs text-emerald-600 mt-0.5">
                              {compareVersion1.author} · {formatDate(compareVersion1.createdAt)}
                            </p>
                          </div>
                          {isCurrentVersion(compareVersion1) && (
                            <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              当前
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-indigo-600">
                              {compareVersion1.snapshot.nodes.length}
                            </div>
                            <div className="text-xs text-slate-500">节点</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-emerald-600">
                              {compareVersion1.snapshot.edges.length}
                            </div>
                            <div className="text-xs text-slate-500">连线</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-amber-600">
                              {compareVersion1.snapshot.lanes.length}
                            </div>
                            <div className="text-xs text-slate-500">泳道</div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {compareVersion1.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                      <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-amber-800">
                              {compareVersion2.version}
                            </h3>
                            <p className="text-xs text-amber-600 mt-0.5">
                              {compareVersion2.author} · {formatDate(compareVersion2.createdAt)}
                            </p>
                          </div>
                          {isCurrentVersion(compareVersion2) && (
                            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              当前
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-indigo-600">
                              {compareVersion2.snapshot.nodes.length}
                            </div>
                            <div className="text-xs text-slate-500">节点</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-emerald-600">
                              {compareVersion2.snapshot.edges.length}
                            </div>
                            <div className="text-xs text-slate-500">连线</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-amber-600">
                              {compareVersion2.snapshot.lanes.length}
                            </div>
                            <div className="text-xs text-slate-500">泳道</div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {compareVersion2.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                        <div className="flex bg-white rounded-lg p-0.5 border border-slate-200 w-fit">
                          <button
                            onClick={() => { setChangeTab('nodes'); setHighlightNodeId(null); setHighlightEdgeId(null); }}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                              changeTab === 'nodes'
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-800"
                            )}
                          >
                            <Circle className="w-3.5 h-3.5" />
                            节点变更
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-full text-xs",
                              changeTab === 'nodes' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                            )}>
                              {nodeDiff.added.length + nodeDiff.removed.length + nodeDiff.modified.length}
                            </span>
                          </button>
                          <button
                            onClick={() => { setChangeTab('edges'); setHighlightNodeId(null); setHighlightEdgeId(null); }}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                              changeTab === 'edges'
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-800"
                            )}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            连线变更
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-full text-xs",
                              changeTab === 'edges' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                            )}>
                              {edgeDiff.added.length + edgeDiff.removed.length}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-auto p-3">
                        {changeTab === 'nodes' ? (
                          <div className="space-y-2">
                            {nodeDiff.added.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-emerald-700">
                                  <Plus className="w-3.5 h-3.5" />
                                  新增节点 ({nodeDiff.added.length})
                                </div>
                                <div className="space-y-1">
                                  {nodeDiff.added.map(node => (
                                    <div
                                      key={node.id}
                                      onClick={() => handleNodeChangeClick(node.id)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
                                        highlightNodeId === node.id
                                          ? "bg-emerald-100 border border-emerald-300"
                                          : "hover:bg-slate-50 border border-transparent"
                                      )}
                                    >
                                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-800 truncate">
                                          {node.label}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">
                                          {node.type}
                                        </div>
                                      </div>
                                      <div
                                        className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0"
                                        style={{ backgroundColor: node.color }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {nodeDiff.removed.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-rose-700">
                                  <Minus className="w-3.5 h-3.5" />
                                  删除节点 ({nodeDiff.removed.length})
                                </div>
                                <div className="space-y-1">
                                  {nodeDiff.removed.map(node => (
                                    <div
                                      key={node.id}
                                      onClick={() => handleNodeChangeClick(node.id)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
                                        highlightNodeId === node.id
                                          ? "bg-rose-100 border border-rose-300"
                                          : "hover:bg-slate-50 border border-transparent"
                                      )}
                                    >
                                      <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                                        <Minus className="w-3.5 h-3.5 text-rose-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-800 truncate line-through opacity-60">
                                          {node.label}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">
                                          {node.type}
                                        </div>
                                      </div>
                                      <div
                                        className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0 opacity-60"
                                        style={{ backgroundColor: node.color }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {nodeDiff.modified.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-blue-700">
                                  <Zap className="w-3.5 h-3.5" />
                                  修改节点 ({nodeDiff.modified.length})
                                </div>
                                <div className="space-y-1">
                                  {nodeDiff.modified.map(({ before: _before, after, changes }) => (
                                    <div
                                      key={after.id}
                                      onClick={() => handleNodeChangeClick(after.id)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
                                        highlightNodeId === after.id
                                          ? "bg-blue-100 border border-blue-300"
                                          : "hover:bg-slate-50 border border-transparent"
                                      )}
                                    >
                                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Zap className="w-3.5 h-3.5 text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-800 truncate">
                                          {after.label}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">
                                          {changes.map(c => {
                                            const map: Record<string, string> = {
                                              label: '名称',
                                              color: '颜色',
                                              position: '位置',
                                              size: '尺寸',
                                              type: '类型',
                                              lane: '泳道'
                                            };
                                            return map[c] || c;
                                          }).join('、')}
                                        </div>
                                      </div>
                                      <div
                                        className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0"
                                        style={{ backgroundColor: after.color }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {nodeDiff.added.length === 0 && nodeDiff.removed.length === 0 && nodeDiff.modified.length === 0 && (
                              <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                                  <Check className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-500">节点无变更</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {edgeDiff.added.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-emerald-700">
                                  <Plus className="w-3.5 h-3.5" />
                                  新增连线 ({edgeDiff.added.length})
                                </div>
                                <div className="space-y-1">
                                  {edgeDiff.added.map(edge => {
                                    const sourceNode = previewNodes.find(n => n.id === edge.source);
                                    const targetNode = previewNodes.find(n => n.id === edge.target);
                                    return (
                                      <div
                                        key={edge.id}
                                        onClick={() => handleEdgeChangeClick(edge.id)}
                                        className={cn(
                                          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
                                          highlightEdgeId === edge.id
                                            ? "bg-emerald-100 border border-emerald-300"
                                            : "hover:bg-slate-50 border border-transparent"
                                        )}
                                      >
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium text-slate-800 truncate">
                                            {sourceNode?.label || '?'} → {targetNode?.label || '?'}
                                          </div>
                                          <div className="text-xs text-slate-500 truncate">
                                            {edge.style}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {edgeDiff.removed.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-rose-700">
                                  <Minus className="w-3.5 h-3.5" />
                                  删除连线 ({edgeDiff.removed.length})
                                </div>
                                <div className="space-y-1">
                                  {edgeDiff.removed.map(edge => {
                                    const sourceNode = compareVersion1.snapshot.nodes.find(n => n.id === edge.source);
                                    const targetNode = compareVersion1.snapshot.nodes.find(n => n.id === edge.target);
                                    return (
                                      <div
                                        key={edge.id}
                                        onClick={() => handleEdgeChangeClick(edge.id)}
                                        className={cn(
                                          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
                                          highlightEdgeId === edge.id
                                            ? "bg-rose-100 border border-rose-300"
                                            : "hover:bg-slate-50 border border-transparent"
                                        )}
                                      >
                                        <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                                          <Minus className="w-3.5 h-3.5 text-rose-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium text-slate-800 truncate line-through opacity-60">
                                            {sourceNode?.label || '?'} → {targetNode?.label || '?'}
                                          </div>
                                          <div className="text-xs text-slate-500 truncate">
                                            {edge.style}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {edgeDiff.added.length === 0 && edgeDiff.removed.length === 0 && (
                              <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                                  <Check className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-500">连线无变更</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                        <h3 className="text-sm font-semibold text-slate-800">预览图（版本 B）</h3>
                      </div>
                      <div className="flex-1 flex items-center justify-center p-4 bg-slate-50">
                        <div className="w-full h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                          <svg
                            viewBox={`${previewBounds.minX - 20} ${previewBounds.minY - 20} ${previewBounds.maxX - previewBounds.minX + 40} ${previewBounds.maxY - previewBounds.minY + 40}`}
                            className="w-full h-full"
                            preserveAspectRatio="xMidYMid meet"
                          >
                            <defs>
                              <pattern id="preview-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                              </pattern>
                              <marker id="preview-arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                              </marker>
                            </defs>
                            <rect
                              x={previewBounds.minX - 20}
                              y={previewBounds.minY - 20}
                              width={previewBounds.maxX - previewBounds.minX + 40}
                              height={previewBounds.maxY - previewBounds.minY + 40}
                              fill="#f8fafc"
                            />
                            <rect
                              x={previewBounds.minX - 20}
                              y={previewBounds.minY - 20}
                              width={previewBounds.maxX - previewBounds.minX + 40}
                              height={previewBounds.maxY - previewBounds.minY + 40}
                              fill="url(#preview-grid)"
                            />

                            {previewEdges.map(edge => {
                              const sourceNode = previewNodes.find(n => n.id === edge.source);
                              const targetNode = previewNodes.find(n => n.id === edge.target);
                              if (!sourceNode || !targetNode) return null;

                              const x1 = sourceNode.x + sourceNode.width;
                              const y1 = sourceNode.y + sourceNode.height / 2;
                              const x2 = targetNode.x;
                              const y2 = targetNode.y + targetNode.height / 2;
                              const dx = x2 - x1;
                              const controlOffset = Math.min(Math.abs(dx) / 2, 80);
                              const path = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;

                              const isHighlighted = highlightEdgeId === edge.id;

                              return (
                                <path
                                  key={edge.id}
                                  d={path}
                                  fill="none"
                                  stroke={isHighlighted ? '#6366f1' : '#94a3b8'}
                                  strokeWidth={isHighlighted ? 3 : 1.5}
                                  strokeDasharray={edge.style === 'dashed' ? '6,3' : 'none'}
                                  markerEnd={edge.style === 'arrow' ? 'url(#preview-arrowhead)' : ''}
                                  className={cn(isHighlighted && 'drop-shadow-lg')}
                                />
                              );
                            })}

                            {previewNodes.map(node => {
                              const isHighlighted = highlightNodeId === node.id;
                              const { x, y, width, height, color, type, label } = node;

                              let shape = null;
                              switch (type) {
                                case 'circle':
                                  shape = (
                                    <ellipse
                                      cx={x + width / 2}
                                      cy={y + height / 2}
                                      rx={width / 2}
                                      ry={height / 2}
                                      fill={color}
                                      stroke={isHighlighted ? '#6366f1' : 'rgba(0,0,0,0.1)'}
                                      strokeWidth={isHighlighted ? 3 : 1.5}
                                    />
                                  );
                                  break;
                                case 'diamond': {
                                  const points = `${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`;
                                  shape = (
                                    <polygon
                                      points={points}
                                      fill={color}
                                      stroke={isHighlighted ? '#6366f1' : 'rgba(0,0,0,0.1)'}
                                      strokeWidth={isHighlighted ? 3 : 1.5}
                                    />
                                  );
                                  break;
                                }
                                default:
                                  shape = (
                                    <rect
                                      x={x}
                                      y={y}
                                      width={width}
                                      height={height}
                                      rx={6}
                                      fill={color}
                                      stroke={isHighlighted ? '#6366f1' : 'rgba(0,0,0,0.1)'}
                                      strokeWidth={isHighlighted ? 3 : 1.5}
                                    />
                                  );
                              }

                              const textColor = type === 'text' ? '#334155' : 'white';

                              return (
                                <g key={node.id} className={cn(isHighlighted && 'drop-shadow-lg')}>
                                  {shape}
                                  <text
                                    x={x + width / 2}
                                    y={y + height / 2}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={textColor}
                                    fontSize="10"
                                    fontWeight="500"
                                  >
                                    {label.length > 8 ? label.slice(0, 8) + '...' : label}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <ArrowLeftRight className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-base font-medium text-slate-600 mb-1">选择两个版本进行对比</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    点击左侧版本列表中的"对比"按钮选择两个版本
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span>版本 A</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span>版本 B</span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="创建新版本"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              版本说明
            </label>
            <textarea
              value={newVersionDescription}
              onChange={(e) => setNewVersionDescription(e.target.value)}
              placeholder="请输入此版本的变更说明..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
            />
          </div>
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              创建新版本会保存当前画布的完整快照，包括所有节点、连线和泳道配置。
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={confirmCreateVersion}
              disabled={!newVersionDescription.trim()}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              创建版本
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="恢复版本"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">
                确定要恢复到 {versionToRestore?.version} 吗？
              </p>
              <p className="text-xs text-amber-600">
                恢复后，当前画布内容将被替换为此版本的快照。将自动创建当前版本备份，您可以随时回退。
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-sky-50 border border-sky-200 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sky-600 text-xs font-bold">i</span>
            </div>
            <div>
              <p className="text-xs text-sky-600">
                系统会自动创建当前状态的备份版本，您可以随时回退到恢复前的状态。
              </p>
            </div>
          </div>
          
          {versionToRestore && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500 mb-2">版本信息</div>
              <div className="text-sm font-semibold text-slate-800 mb-1">
                {versionToRestore.version}
              </div>
              <p className="text-sm text-slate-600">{versionToRestore.description}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                <span>{versionToRestore.author}</span>
                <span>{formatDate(versionToRestore.createdAt)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsRestoreModalOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmRestore}
              className="gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              确认恢复
            </Button>
          </div>
        </div>
      </Modal>
    </ProjectLayout>
  );
}
