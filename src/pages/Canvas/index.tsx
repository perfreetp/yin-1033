import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Square,
  Circle,
  Diamond,
  Layers,
  Database,
  BarChart3,
  Type,
  ArrowRight,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Download,
  Plus
} from 'lucide-react';
import ProjectLayout from '@/components/Layout/ProjectLayout';
import { useProjectCanvasStore } from '@/store/useProjectCanvasStore';
import { useProjectStore } from '@/store/useProjectStore';
import { usePermissionLogStore } from '@/store/usePermissionLogStore';
import { cn, getNodeColors, exportPNG } from '@/utils/helpers';
import type { NodeType, UserRole } from '@/types';

const toolbarItems: { type: NodeType; icon: typeof Square; label: string }[] = [
  { type: 'rectangle', icon: Square, label: '矩形' },
  { type: 'circle', icon: Circle, label: '圆形' },
  { type: 'diamond', icon: Diamond, label: '菱形' },
  { type: 'process', icon: ArrowRight, label: '流程' },
  { type: 'data', icon: Database, label: '数据' },
  { type: 'metric', icon: BarChart3, label: '指标' },
  { type: 'text', icon: Type, label: '文本' },
];

const colors = getNodeColors();

export default function CanvasPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [draggedItem, setDraggedItem] = useState<NodeType | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  const {
    initProjectCanvas,
    getNodes,
    getEdges,
    getLanes,
    getHistoryIndex,
    getHistoryLength,
    selectedNodeId,
    selectedEdgeId,
    zoom,
    panX,
    panY,
    isConnecting,
    connectingFrom,
    selectNode,
    selectEdge,
    setZoom,
    setPan,
    addNode,
    updateNode,
    deleteNode,
    moveNode,
    startConnecting,
    endConnecting,
    finishConnecting,
    undo,
    redo,
    pushHistory,
  } = useProjectCanvasStore();

  const { projects } = useProjectStore();

  const currentProject = projects.find(p => p.id === projectId);
  const userRole: UserRole = currentProject?.role || 'viewer';
  const isViewer = userRole === 'viewer';
  const addPermissionLog = usePermissionLogStore(state => state.addLog);

  const handlePermissionDenied = (action: string) => {
    if (projectId && currentProject) {
      addPermissionLog(projectId, {
        userId: currentProject.ownerId,
        userName: currentProject.ownerName,
        userRole: currentProject.role,
        action,
      });
    }
    alert('您是查看者，没有权限执行此操作。如需编辑，请联系管理员。');
  };

  const nodes = useMemo(() => getNodes(), [getNodes, projectId, zoom, panX, panY, selectedNodeId]);
  const edges = useMemo(() => getEdges(), [getEdges, projectId, zoom, panX, panY, selectedEdgeId]);
  const lanes = useMemo(() => getLanes(), [getLanes, projectId]);
  const historyIndex = useMemo(() => getHistoryIndex(), [getHistoryIndex, projectId]);
  const historyLength = useMemo(() => getHistoryLength(), [getHistoryLength, projectId]);

  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => a.layer - b.layer);
  }, [nodes]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  useEffect(() => {
    if (projectId) {
      initProjectCanvas(projectId);
    }
  }, [projectId, initProjectCanvas]);

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panX) / zoom,
      y: (clientY - rect.top - panY) / zoom,
    };
  }, [panX, panY, zoom]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(zoom * delta);
  }, [zoom, setZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      setStartPan({ x: e.clientX - panX, y: e.clientY - panY });
      return;
    }
    
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === 'rect' && (e.target as SVGElement).getAttribute('class')?.includes('grid-bg')) {
      selectNode(null);
      selectEdge(null);
    }
  }, [panX, panY, selectNode, selectEdge]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan(e.clientX - startPan.x, e.clientY - startPan.y);
      return;
    }
    
    if (isDraggingNode && selectedNodeId && !isViewer) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      moveNode(selectedNodeId, Math.round((pos.x - dragOffset.x) / 10) * 10, Math.round((pos.y - dragOffset.y) / 10) * 10);
    }
  }, [isPanning, startPan, setPan, isDraggingNode, selectedNodeId, screenToCanvas, dragOffset, moveNode, isViewer]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (isDraggingNode) {
      setIsDraggingNode(false);
      pushHistory();
    }
    if (isConnecting) {
      endConnecting();
    }
  }, [isPanning, isDraggingNode, isConnecting, endConnecting, pushHistory]);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (isViewer) return;
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    selectNode(nodeId);
    
    const pos = screenToCanvas(e.clientX, e.clientY);
    setDragOffset({ x: pos.x - node.x, y: pos.y - node.y });
    setIsDraggingNode(true);
  }, [nodes, selectNode, screenToCanvas, isViewer]);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    if (isViewer) return;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newLabel = prompt('编辑节点文本:', node.label);
    if (newLabel !== null) {
      updateNode(nodeId, { label: newLabel });
      pushHistory();
    }
  }, [nodes, updateNode, pushHistory, isViewer]);

  const handleConnectorMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (isViewer) return;
    e.stopPropagation();
    startConnecting(nodeId);
  }, [startConnecting, isViewer]);

  const handleConnectorMouseUp = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (isViewer) return;
    e.stopPropagation();
    if (isConnecting) {
      finishConnecting(nodeId);
    }
  }, [isConnecting, finishConnecting, isViewer]);

  const handleDragStart = useCallback((e: React.DragEvent, type: NodeType) => {
    if (isViewer) return;
    setDraggedItem(type);
    e.dataTransfer.effectAllowed = 'copy';
  }, [isViewer]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem || isViewer) return;
    
    const pos = screenToCanvas(e.clientX, e.clientY);
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const sizes: Record<NodeType, { width: number; height: number }> = {
      rectangle: { width: 140, height: 60 },
      circle: { width: 100, height: 100 },
      diamond: { width: 120, height: 100 },
      process: { width: 140, height: 60 },
      data: { width: 160, height: 70 },
      metric: { width: 140, height: 80 },
      text: { width: 120, height: 50 },
    };
    
    const size = sizes[draggedItem];
    
    addNode({
      type: draggedItem,
      label: draggedItem === 'metric' ? '新指标\n0' : '新节点',
      x: Math.round((pos.x - size.width / 2) / 10) * 10,
      y: Math.round((pos.y - size.height / 2) / 10) * 10,
      width: size.width,
      height: size.height,
      color,
      layer: 1,
    });
    
    setDraggedItem(null);
  }, [draggedItem, screenToCanvas, addNode, colors, isViewer]);

  const handleDelete = useCallback(() => {
    if (selectedNodeId && !isViewer) {
      deleteNode(selectedNodeId);
    }
  }, [selectedNodeId, deleteNode, isViewer]);

  const handleZoomIn = () => setZoom(zoom * 1.2);
  const handleZoomOut = () => setZoom(zoom * 0.8);
  const handleFit = () => {
    setZoom(1);
    setPan(0, 0);
  };

  const handleExportPNG = useCallback(() => {
    if (svgRef.current) {
      exportPNG(svgRef.current, 'canvas.png');
    }
  }, []);

  const handleLayerUp = useCallback(() => {
    if (selectedNode && !isViewer) {
      updateNode(selectedNode.id, { layer: selectedNode.layer + 1 });
      pushHistory();
    }
  }, [selectedNode, updateNode, pushHistory, isViewer]);

  const handleLayerDown = useCallback(() => {
    if (selectedNode && !isViewer) {
      updateNode(selectedNode.id, { layer: Math.max(1, selectedNode.layer - 1) });
      pushHistory();
    }
  }, [selectedNode, updateNode, pushHistory, isViewer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId && !isViewer && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          deleteNode(selectedNodeId);
        }
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, deleteNode, undo, redo, isViewer]);

  const renderNode = (node: typeof nodes[0]) => {
    const isSelected = node.id === selectedNodeId;
    const Icon = toolbarItems.find(t => t.type === node.type)?.icon || Square;
    
    const commonProps = {
      className: cn(
        "transition-all duration-150",
        isSelected && "filter drop-shadow-lg",
        !isViewer && "cursor-move"
      ),
      fill: node.color,
      stroke: isSelected ? '#4f46e5' : 'rgba(0,0,0,0.1)',
      strokeWidth: isSelected ? 3 : 2,
      onMouseDown: (e: React.MouseEvent) => handleNodeMouseDown(e, node.id),
      onDoubleClick: () => handleNodeDoubleClick(node.id),
      onMouseUp: (e: React.MouseEvent) => handleConnectorMouseUp(e, node.id),
    };

    let shape;
    switch (node.type) {
      case 'circle':
        shape = (
          <ellipse
            cx={node.x + node.width / 2}
            cy={node.y + node.height / 2}
            rx={node.width / 2}
            ry={node.height / 2}
            {...commonProps}
          />
        );
        break;
      case 'diamond':
        shape = (
          <polygon
            points={`${node.x + node.width / 2},${node.y} ${node.x + node.width},${node.y + node.height / 2} ${node.x + node.width / 2},${node.y + node.height} ${node.x},${node.y + node.height / 2}`}
            {...commonProps}
          />
        );
        break;
      case 'data':
        shape = (
          <g>
            <rect
              x={node.x}
              y={node.y + 10}
              width={node.width}
              height={node.height - 20}
              {...commonProps}
            />
            <ellipse
              cx={node.x + node.width / 2}
              cy={node.y + 10}
              rx={node.width / 2}
              ry={10}
              fill={node.color}
              stroke={isSelected ? '#4f46e5' : 'rgba(0,0,0,0.1)'}
              strokeWidth={isSelected ? 3 : 2}
              className={cn(!isViewer && "cursor-move")}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onDoubleClick={() => handleNodeDoubleClick(node.id)}
            />
            <ellipse
              cx={node.x + node.width / 2}
              cy={node.y + node.height - 10}
              rx={node.width / 2}
              ry={10}
              fill={node.color}
              stroke={isSelected ? '#4f46e5' : 'rgba(0,0,0,0.1)'}
              strokeWidth={isSelected ? 3 : 2}
              className={cn(!isViewer && "cursor-move")}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onDoubleClick={() => handleNodeDoubleClick(node.id)}
            />
          </g>
        );
        break;
      case 'metric':
        shape = (
          <g>
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx={8}
              {...commonProps}
            />
            <rect
              x={node.x + 8}
              y={node.y + 8}
              width={node.width - 16}
              height={2}
              fill="rgba(255,255,255,0.3)"
              rx={1}
            />
          </g>
        );
        break;
      case 'text':
        shape = (
          <rect
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            fill="transparent"
            stroke={isSelected ? '#4f46e5' : 'transparent'}
            strokeWidth={isSelected ? 2 : 0}
            strokeDasharray="5,5"
            className={cn(!isViewer && "cursor-move")}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onDoubleClick={() => handleNodeDoubleClick(node.id)}
          />
        );
        break;
      default:
        shape = (
          <rect
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            rx={8}
            {...commonProps}
          />
        );
    }

    return (
      <g key={node.id}>
        {shape}
        <text
          x={node.x + node.width / 2}
          y={node.y + node.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={node.type === 'text' ? '#334155' : 'white'}
          fontSize={node.type === 'metric' ? 14 : 13}
          fontWeight="500"
          className="pointer-events-none select-none"
          style={{ whiteSpace: 'pre-line' }}
        >
          {node.label.split('\n').map((line, i) => (
            <tspan
              key={i}
              x={node.x + node.width / 2}
              dy={i === 0 ? 0 : '1.2em'}
            >
              {line}
            </tspan>
          ))}
        </text>
        {isSelected && !isViewer && (
          <>
            <circle
              cx={node.x + node.width}
              cy={node.y + node.height / 2}
              r={6}
              fill="#4f46e5"
              stroke="white"
              strokeWidth={2}
              className="cursor-crosshair"
              onMouseDown={(e) => handleConnectorMouseDown(e, node.id)}
            />
            <circle
              cx={node.x}
              cy={node.y + node.height / 2}
              r={6}
              fill="#4f46e5"
              stroke="white"
              strokeWidth={2}
              className="cursor-crosshair"
              onMouseDown={(e) => handleConnectorMouseDown(e, node.id)}
            />
            <circle
              cx={node.x + node.width / 2}
              cy={node.y}
              r={6}
              fill="#4f46e5"
              stroke="white"
              strokeWidth={2}
              className="cursor-crosshair"
              onMouseDown={(e) => handleConnectorMouseDown(e, node.id)}
            />
            <circle
              cx={node.x + node.width / 2}
              cy={node.y + node.height}
              r={6}
              fill="#4f46e5"
              stroke="white"
              strokeWidth={2}
              className="cursor-crosshair"
              onMouseDown={(e) => handleConnectorMouseDown(e, node.id)}
            />
          </>
        )}
      </g>
    );
  };

  const renderEdge = (edge: typeof edges[0]) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return null;

    const x1 = sourceNode.x + sourceNode.width;
    const y1 = sourceNode.y + sourceNode.height / 2;
    const x2 = targetNode.x;
    const y2 = targetNode.y + targetNode.height / 2;
    
    const dx = x2 - x1;
    const controlOffset = Math.min(Math.abs(dx) / 2, 80);
    
    const path = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;

    const isSelected = edge.id === selectedEdgeId;

    return (
      <g key={edge.id}>
        <path
          d={path}
          fill="none"
          stroke={isSelected ? '#4f46e5' : '#94a3b8'}
          strokeWidth={isSelected ? 3 : 2}
          strokeDasharray={edge.style === 'dashed' ? '8,4' : 'none'}
          markerEnd={edge.style === 'arrow' ? 'url(#arrowhead)' : ''}
          className={cn(!isViewer && "cursor-pointer transition-all")}
          onClick={(e) => {
            if (isViewer) return;
            e.stopPropagation();
            selectEdge(edge.id);
            selectNode(null);
          }}
        />
        {edge.label && (
          <text
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2 - 8}
            textAnchor="middle"
            fill="#64748b"
            fontSize={11}
            className="pointer-events-none select-none"
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  };

  const renderLanes = () => {
    return lanes.map((lane, index) => (
      <g key={lane.id}>
        <rect
          x={0}
          y={lane.position}
          width={2000}
          height={lane.size}
          fill={index % 2 === 0 ? 'rgba(99, 102, 241, 0.03)' : 'rgba(148, 163, 184, 0.05)'}
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth={1}
        />
        <rect
          x={0}
          y={lane.position}
          width={120}
          height={lane.size}
          fill="rgba(255,255,255,0.8)"
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth={1}
        />
        <text
          x={60}
          y={lane.position + lane.size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#475569"
          fontSize={13}
          fontWeight={600}
          className="select-none"
        >
          {lane.title}
        </text>
      </g>
    ));
  };

  return (
    <ProjectLayout>
      <div className="h-full flex flex-col bg-slate-100">
        <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (isViewer) {
                  handlePermissionDenied('尝试撤销操作');
                } else {
                  undo();
                }
              }}
              disabled={historyIndex <= 0 && !isViewer}
              className={cn(
                "p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors",
                (historyIndex <= 0 && !isViewer) && "opacity-40 cursor-not-allowed",
                isViewer && "opacity-60"
              )}
              title="撤销 (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (isViewer) {
                  handlePermissionDenied('尝试重做操作');
                } else {
                  redo();
                }
              }}
              disabled={historyIndex >= historyLength - 1 && !isViewer}
              className={cn(
                "p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors",
                (historyIndex >= historyLength - 1 && !isViewer) && "opacity-40 cursor-not-allowed",
                isViewer && "opacity-60"
              )}
              title="重做 (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <button
              onClick={handleZoomOut}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-600 w-12 text-center font-medium">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleFit}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1"
              title="适应视图"
            >
              <Maximize className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showGrid ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              )}
              title="网格"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedNodeId && (
              <button
                onClick={() => {
                  if (isViewer) {
                    handlePermissionDenied('尝试删除节点');
                  } else {
                    handleDelete();
                  }
                }}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isViewer 
                    ? "text-slate-400 opacity-60" 
                    : "text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                )}
                title="删除 (Delete)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={handleExportPNG}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="导出PNG"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-3 gap-1">
            {toolbarItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.type}
                  draggable={!isViewer}
                  onDragStart={(e) => handleDragStart(e, item.type)}
                  onDragEnd={() => setDraggedItem(null)}
                  onClick={() => {
                    if (isViewer) {
                      handlePermissionDenied(`尝试添加${item.label}节点`);
                    }
                  }}
                  className={cn(
                    "w-12 h-12 flex flex-col items-center justify-center rounded-lg text-slate-600 transition-colors group",
                    !isViewer 
                      ? "cursor-grab active:cursor-grabbing hover:bg-slate-50 hover:text-indigo-600"
                      : "cursor-pointer opacity-60 hover:opacity-80"
                  )}
                  title={isViewer ? item.label : `${item.label}（拖拽到画布）`}
                >
                  <Icon className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px]">{item.label}</span>
                </div>
              );
            })}
            
            <div className="w-8 h-px bg-slate-200 my-2" />
            
            <div className="w-12 flex flex-wrap justify-center gap-1.5">
              {colors.map((color) => (
                <div
                  key={color}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 border-white shadow-sm",
                    !isViewer && "cursor-pointer hover:scale-110 transition-transform"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div
            ref={containerRef}
            className="flex-1 overflow-hidden bg-slate-50"
            onWheel={handleWheel}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{ cursor: isPanning ? 'grabbing' : isConnecting ? 'crosshair' : 'default' }}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onContextMenu={(e) => e.preventDefault()}
              className="select-none"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                </pattern>
                <pattern id="grid-large" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                </pattern>
              </defs>
              
              <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
                {showGrid && (
                  <>
                    <rect width="3000" height="2000" fill="url(#grid)" className="grid-bg" />
                    <rect width="3000" height="2000" fill="url(#grid-large)" className="grid-bg" />
                  </>
                )}
                
                {renderLanes()}
                {edges.map(renderEdge)}
                {sortedNodes.map(renderNode)}
                
                {isConnecting && connectingFrom && (
                  <circle
                    cx={0}
                    cy={0}
                    r={0}
                    fill="none"
                  />
                )}
              </g>
            </svg>
          </div>

          <div className="w-64 bg-white border-l border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                属性面板
                {isViewer && (
                  <span className="text-xs text-slate-400 font-normal ml-auto">只读</span>
                )}
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1.5 block">节点名称</label>
                    <input
                      type="text"
                      value={selectedNode.label}
                      onChange={(e) => !isViewer && updateNode(selectedNode.id, { label: e.target.value })}
                      onBlur={() => pushHistory()}
                      disabled={isViewer}
                      className={cn(
                        "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                        isViewer 
                          ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed" 
                          : "border-slate-300"
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1.5 block">节点类型</label>
                    <div className="px-3 py-2 text-sm bg-slate-50 rounded-lg text-slate-600 capitalize">
                      {selectedNode.type}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1.5 block">颜色</label>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            if (!isViewer) {
                              updateNode(selectedNode.id, { color });
                              pushHistory();
                            }
                          }}
                          disabled={isViewer}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 transition-all",
                            selectedNode.color === color ? "border-indigo-500 ring-2 ring-indigo-200" : "border-white shadow-sm",
                            !isViewer && "hover:scale-110",
                            isViewer && "cursor-not-allowed opacity-60"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1.5 block">X 坐标</label>
                      <input
                        type="number"
                        value={Math.round(selectedNode.x)}
                        onChange={(e) => !isViewer && updateNode(selectedNode.id, { x: Number(e.target.value) })}
                        onBlur={() => pushHistory()}
                        disabled={isViewer}
                        className={cn(
                          "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                          isViewer 
                            ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed" 
                            : "border-slate-300"
                        )}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1.5 block">Y 坐标</label>
                      <input
                        type="number"
                        value={Math.round(selectedNode.y)}
                        onChange={(e) => !isViewer && updateNode(selectedNode.id, { y: Number(e.target.value) })}
                        onBlur={() => pushHistory()}
                        disabled={isViewer}
                        className={cn(
                          "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                          isViewer 
                            ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed" 
                            : "border-slate-300"
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1.5 block">宽度</label>
                      <input
                        type="number"
                        value={Math.round(selectedNode.width)}
                        onChange={(e) => !isViewer && updateNode(selectedNode.id, { width: Number(e.target.value) })}
                        onBlur={() => pushHistory()}
                        disabled={isViewer}
                        className={cn(
                          "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                          isViewer 
                            ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed" 
                            : "border-slate-300"
                        )}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1.5 block">高度</label>
                      <input
                        type="number"
                        value={Math.round(selectedNode.height)}
                        onChange={(e) => !isViewer && updateNode(selectedNode.id, { height: Number(e.target.value) })}
                        onBlur={() => pushHistory()}
                        disabled={isViewer}
                        className={cn(
                          "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                          isViewer 
                            ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed" 
                            : "border-slate-300"
                        )}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1.5 block">图层 (layer: {selectedNode.layer})</label>
                    <div className="flex gap-2">
                      <button
                        onClick={handleLayerUp}
                        disabled={isViewer}
                        className={cn(
                          "flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors",
                          isViewer 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                            : "text-slate-600 bg-slate-100 hover:bg-slate-200"
                        )}
                      >
                        上移
                      </button>
                      <button
                        onClick={handleLayerDown}
                        disabled={isViewer || selectedNode.layer <= 1}
                        className={cn(
                          "flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors",
                          isViewer || selectedNode.layer <= 1
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                            : "text-slate-600 bg-slate-100 hover:bg-slate-200"
                        )}
                      >
                        下移
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (isViewer) {
                        handlePermissionDenied('尝试删除节点');
                      } else {
                        handleDelete();
                      }
                    }}
                    className={cn(
                      "w-full py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2",
                      isViewer
                        ? "text-slate-400 bg-slate-50 opacity-60"
                        : "text-rose-600 bg-rose-50 hover:bg-rose-100"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                    删除节点
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">选择一个节点</p>
                  <p className="text-xs text-slate-400 mt-1">查看和编辑属性</p>
                </div>
              )}
            </div>
            
            <div className="border-t border-slate-200 p-4">
              <div className="text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>节点数</span>
                  <span className="text-slate-600 font-medium">{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>连线数</span>
                  <span className="text-slate-600 font-medium">{edges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>泳道数</span>
                  <span className="text-slate-600 font-medium">{lanes.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProjectLayout>
  );
}
