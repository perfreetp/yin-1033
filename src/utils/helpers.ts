import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { CanvasNode, CanvasEdge, Lane } from '@/types';

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
}

export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  downloadFile('\uFEFF' + csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportToJSON(data: unknown, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function getNodeColors(): string[] {
  return [
    '#6366f1',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#0ea5e9',
    '#ec4899',
    '#14b8a6',
  ];
}

export function getRandomColor(): string {
  const colors = getNodeColors();
  return colors[Math.floor(Math.random() * colors.length)];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  } as T;
}

export function exportPNG(svgElement: SVGSVGElement, filename: string): void {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const rect = svgElement.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(pngUrl);
        }
      }, 'image/png');
    }

    URL.revokeObjectURL(url);
  };

  img.src = url;
}

function generateNodeSVG(node: CanvasNode): string {
  const { x, y, width, height, color, type, label } = node;
  
  let shape = '';
  switch (type) {
    case 'circle':
      shape = `<ellipse cx="${x + width / 2}" cy="${y + height / 2}" rx="${width / 2}" ry="${height / 2}" fill="${color}" stroke="rgba(0,0,0,0.1)" stroke-width="2" />`;
      break;
    case 'diamond': {
      const points = `${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`;
      shape = `<polygon points="${points}" fill="${color}" stroke="rgba(0,0,0,0.1)" stroke-width="2" />`;
      break;
    }
    case 'data':
      shape = `
        <rect x="${x}" y="${y + 10}" width="${width}" height="${height - 20}" fill="${color}" stroke="rgba(0,0,0,0.1)" stroke-width="2" />
        <ellipse cx="${x + width / 2}" cy="${y + 10}" rx="${width / 2}" ry="10" fill="${color}" stroke="rgba(0,0,0,0.1)" stroke-width="2" />
        <ellipse cx="${x + width / 2}" cy="${y + height - 10}" rx="${width / 2}" ry="10" fill="${color}" stroke="rgba(0,0,0,0.1)" stroke-width="2" />
      `;
      break;
    case 'metric':
      shape = `
        <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${color}" stroke="rgba(0,0,0,0.1)" stroke-width="2" />
        <rect x="${x + 8}" y="${y + 8}" width="${width - 16}" height="2" fill="rgba(255,255,255,0.3)" rx="1" />
      `;
      break;
    case 'text':
      shape = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="transparent" stroke="transparent" stroke-width="0" />`;
      break;
    default:
      shape = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${color}" stroke="rgba(0,0,0,0.1)" stroke-width="2" />`;
  }

  const textColor = type === 'text' ? '#334155' : 'white';
  const fontSize = type === 'metric' ? 14 : 13;
  
  const textLines = label.split('\n');
  const textElements = textLines.map((line, i) => 
    `<tspan x="${x + width / 2}" dy="${i === 0 ? 0 : '1.2em'}">${line}</tspan>`
  ).join('');

  return `
    <g>
      ${shape}
      <text x="${x + width / 2}" y="${y + height / 2}" text-anchor="middle" dominant-baseline="middle" fill="${textColor}" font-size="${fontSize}" font-weight="500" style="white-space: pre-line;">
        ${textElements}
      </text>
    </g>
  `;
}

function generateEdgeSVG(edge: CanvasEdge, nodes: CanvasNode[]): string {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  if (!sourceNode || !targetNode) return '';

  const x1 = sourceNode.x + sourceNode.width;
  const y1 = sourceNode.y + sourceNode.height / 2;
  const x2 = targetNode.x;
  const y2 = targetNode.y + targetNode.height / 2;
  
  const dx = x2 - x1;
  const controlOffset = Math.min(Math.abs(dx) / 2, 80);
  
  const path = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;

  let label = '';
  if (edge.label) {
    label = `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 8}" text-anchor="middle" fill="#64748b" font-size="11">${edge.label}</text>`;
  }

  return `
    <g>
      <path d="${path}" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="${edge.style === 'dashed' ? '8,4' : 'none'}" marker-end="${edge.style === 'arrow' ? 'url(#arrowhead)' : ''}" />
      ${label}
    </g>
  `;
}

function generateLaneSVG(lane: Lane, index: number): string {
  const bgColor = index % 2 === 0 ? 'rgba(99, 102, 241, 0.03)' : 'rgba(148, 163, 184, 0.05)';
  
  return `
    <g>
      <rect x="0" y="${lane.position}" width="2000" height="${lane.size}" fill="${bgColor}" stroke="rgba(148, 163, 184, 0.2)" stroke-width="1" />
      <rect x="0" y="${lane.position}" width="120" height="${lane.size}" fill="rgba(255,255,255,0.8)" stroke="rgba(148, 163, 184, 0.3)" stroke-width="1" />
      <text x="60" y="${lane.position + lane.size / 2}" text-anchor="middle" dominant-baseline="middle" fill="#475569" font-size="13" font-weight="600">${lane.title}</text>
    </g>
  `;
}

function generateCanvasSVG(nodes: CanvasNode[], edges: CanvasEdge[], lanes: Lane[]): string {
  const defs = `
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
      </marker>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="0.5" />
      </pattern>
      <pattern id="grid-large" width="100" height="100" patternUnits="userSpaceOnUse">
        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#cbd5e1" stroke-width="1" />
      </pattern>
    </defs>
  `;

  const lanesSVG = lanes.map((lane, i) => generateLaneSVG(lane, i)).join('');
  const edgesSVG = edges.map(edge => generateEdgeSVG(edge, nodes)).join('');
  const nodesSVG = nodes.map(node => generateNodeSVG(node)).join('');

  let minX = 0, minY = 0, maxX = 1000, maxY = 800;
  if (nodes.length > 0) {
    minX = Math.min(...nodes.map(n => n.x)) - 100;
    minY = Math.min(...nodes.map(n => n.y)) - 100;
    maxX = Math.max(...nodes.map(n => n.x + n.width)) + 100;
    maxY = Math.max(...nodes.map(n => n.y + n.height)) + 100;
  }
  if (lanes.length > 0) {
    minY = Math.min(minY, Math.min(...lanes.map(l => l.position)) - 50);
    maxY = Math.max(maxY, Math.max(...lanes.map(l => l.position + l.size)) + 50);
    maxX = Math.max(maxX, 1200);
  }

  const width = maxX - minX;
  const height = maxY - minY;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">
      ${defs}
      <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#f8fafc" />
      <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="url(#grid)" />
      <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="url(#grid-large)" />
      ${lanesSVG}
      ${edgesSVG}
      ${nodesSVG}
    </svg>
  `;
}

export async function exportCanvasToPNG(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  lanes: Lane[],
  filename: string
): Promise<void> {
  const svgString = generateCanvasSVG(nodes, edges, lanes);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load SVG'));
      img.src = url;
    });

    const scale = 2;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);

    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}
