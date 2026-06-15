import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Palette, 
  BookOpen, 
  LayoutTemplate, 
  MessageSquare, 
  GitBranch, 
  Rocket,
  ChevronLeft,
  Search,
  Bell,
  User,
  Shield,
  Eye,
  Edit3
} from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import { useProjectCanvasStore } from '@/store/useProjectCanvasStore';
import { cn } from '@/utils/helpers';
import type { UserRole } from '@/types';

const projectNavItems = [
  { path: 'canvas', label: '画布', icon: Palette },
  { path: 'dictionary', label: '数据字典', icon: BookOpen },
  { path: 'comments', label: '评论', icon: MessageSquare },
  { path: 'versions', label: '版本', icon: GitBranch },
  { path: 'publish', label: '发布', icon: Rocket },
];

const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: '管理员', icon: Shield, color: 'text-indigo-600 bg-indigo-50' },
  editor: { label: '编辑者', icon: Edit3, color: 'text-emerald-600 bg-emerald-50' },
  viewer: { label: '查看者', icon: Eye, color: 'text-amber-600 bg-amber-50' },
};

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { projects, setCurrentProjectId } = useProjectStore();
  const { initProjectCanvas } = useProjectCanvasStore();
  
  const currentProject = projects.find(p => p.id === id);
  const userRole: UserRole = currentProject?.role || 'viewer';
  const roleInfo = roleConfig[userRole];
  const RoleIcon = roleInfo.icon;
  
  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  useEffect(() => {
    if (id) {
      setCurrentProjectId(id);
      initProjectCanvas(id);
    }
  }, [id, setCurrentProjectId, initProjectCanvas]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">返回项目列表</span>
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-sm font-medium",
              currentProject?.coverColor
            )}>
              {currentProject?.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-slate-800">{currentProject?.name}</h1>
                <span className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded",
                  roleInfo.color
                )}>
                  <RoleIcon className="w-3 h-3" />
                  {roleInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">{currentProject?.nodeCount} 个节点 · {currentProject?.versionCount} 个版本</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:shadow-md transition-shadow">
            <User className="w-4 h-4" />
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 bg-white border-r border-slate-200 py-4 flex flex-col">
          <nav className="flex-1 px-3 space-y-1">
            {projectNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={`/project/${id}/${item.path}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                    active 
                      ? "bg-indigo-50 text-indigo-600 font-medium shadow-sm" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="px-3 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-400 mb-2">项目成员</div>
            <div className="flex -space-x-2">
              {currentProject?.members.slice(0, 4).map((member, i) => (
                <div
                  key={member.userId}
                  className="w-8 h-8 rounded-full bg-gradient-to-br border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                  style={{ 
                    background: `linear-gradient(135deg, hsl(${i * 60}, 70%, 60%), hsl(${i * 60 + 30}, 70%, 50%))` 
                  }}
                >
                  {member.userName.charAt(0)}
                </div>
              ))}
              {currentProject && currentProject.members.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-500 text-xs font-medium">
                  +{currentProject.members.length - 4}
                </div>
              )}
            </div>
          </div>
        </aside>
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
