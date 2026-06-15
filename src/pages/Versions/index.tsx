import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  AlertTriangle
} from 'lucide-react';
import ProjectLayout from '@/components/Layout/ProjectLayout';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { useProjectCanvasStore } from '@/store/useProjectCanvasStore';
import type { Version } from '@/types';
import { cn, formatDate, formatRelativeTime } from '@/utils/helpers';

type ViewMode = 'detail' | 'compare';

export default function Versions() {
  const { id } = useParams<{ id: string }>();
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
    setVersionToRestore(version);
    setIsRestoreModalOpen(true);
  };

  const confirmRestore = () => {
    if (versionToRestore) {
      restoreVersion(versionToRestore.id);
    }
    setIsRestoreModalOpen(false);
    setVersionToRestore(null);
  };

  const handleCreateVersion = () => {
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
  };

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
            <Button size="sm" className="w-full gap-1.5" onClick={handleCreateVersion}>
              <Plus className="w-4 h-4" />
              创建版本
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
                          disabled={isCurrent}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-md transition-colors",
                            isCurrent
                              ? "text-slate-300 cursor-not-allowed"
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
                              className="gap-1.5"
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
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-center gap-4 mb-4">
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

                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden flex flex-col">
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
                      <div className="flex-1 p-4 overflow-auto">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-600">节点数量</span>
                            <span className="text-sm font-semibold text-slate-800">
                              {compareVersion1.snapshot.nodes.length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-600">连线数量</span>
                            <span className="text-sm font-semibold text-slate-800">
                              {compareVersion1.snapshot.edges.length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-600">泳道数量</span>
                            <span className="text-sm font-semibold text-slate-800">
                              {compareVersion1.snapshot.lanes.length}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="text-xs font-medium text-slate-500 mb-2">变更说明</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {compareVersion1.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-amber-200 overflow-hidden flex flex-col">
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
                      <div className="flex-1 p-4 overflow-auto">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-600">节点数量</span>
                            <span className="text-sm font-semibold text-slate-800">
                              {compareVersion2.snapshot.nodes.length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-600">连线数量</span>
                            <span className="text-sm font-semibold text-slate-800">
                              {compareVersion2.snapshot.edges.length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-600">泳道数量</span>
                            <span className="text-sm font-semibold text-slate-800">
                              {compareVersion2.snapshot.lanes.length}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="text-xs font-medium text-slate-500 mb-2">变更说明</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {compareVersion2.description}
                          </p>
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
                恢复后，当前画布内容将被替换为此版本的快照。此操作不可撤销，建议先创建当前版本的备份。
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
