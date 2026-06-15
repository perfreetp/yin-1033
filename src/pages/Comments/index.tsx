import { useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Reply, CheckCircle2, Clock, AtSign, Send, Filter, X, Eye } from 'lucide-react';
import ProjectLayout from '@/components/Layout/ProjectLayout';
import Button from '@/components/common/Button';
import { mockComments, mockUsers } from '@/data/mockData';
import { useProjectStore } from '@/store/useProjectStore';
import { usePermissionLogStore } from '@/store/usePermissionLogStore';
import type { Comment } from '@/types';
import { cn, formatRelativeTime, generateId } from '@/utils/helpers';

type FilterType = 'all' | 'unresolved' | 'mentioned';

const currentUserId = 'user-001';

function CommentItem({
  comment,
  depth = 0,
  onReply,
  onResolve,
  isViewer = false,
}: {
  comment: Comment;
  depth?: number;
  onReply: (commentId: string) => void;
  onResolve: (commentId: string) => void;
  isViewer?: boolean;
}) {
  const [showReplies, setShowReplies] = useState(true);
  const user = mockUsers.find(u => u.id === comment.userId);
  const userIndex = mockUsers.findIndex(u => u.id === comment.userId);

  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@\S+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const userName = part.slice(1);
        const mentionedUser = mockUsers.find(u => u.name === userName);
        if (mentionedUser) {
          return (
            <span key={i} className="text-indigo-600 font-medium bg-indigo-50 px-1 rounded">
              {part}
            </span>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={cn(depth > 0 && "ml-10 pl-4 border-l-2 border-slate-200")}>
      <div className={cn(
        "bg-white border rounded-xl p-4 transition-all hover:shadow-sm",
        comment.resolved ? "border-slate-200 opacity-75" : "border-slate-200"
      )}>
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-medium"
            style={{
              background: `linear-gradient(135deg, hsl(${userIndex * 60}, 70%, 60%), hsl(${userIndex * 60 + 30}, 70%, 50%))`,
            }}
          >
            {comment.userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">{comment.userName}</span>
                {comment.resolved && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    已解决
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {renderContentWithMentions(comment.content)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id)}
                className={cn(
                  "h-7 px-2 text-xs",
                  isViewer && "opacity-60"
                )}
              >
                <Reply className="w-3.5 h-3.5" />
                回复
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResolve(comment.id)}
                className={cn(
                  "h-7 px-2 text-xs",
                  comment.resolved
                    ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    : "text-slate-500",
                  isViewer && "opacity-60"
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {comment.resolved ? '取消解决' : '标记解决'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {showReplies && comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onResolve={onResolve}
              isViewer={isViewer}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Comments() {
  const { id } = useParams<{ id: string }>();
  const projects = useProjectStore(state => state.projects);
  const currentProject = useMemo(() => projects.find(p => p.id === id), [projects, id]);
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

  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [filter, setFilter] = useState<FilterType>('all');
  const [inputValue, setInputValue] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionStartRef = useRef<number>(-1);

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [comments]);

  const filteredComments = useMemo(() => {
    switch (filter) {
      case 'unresolved':
        return sortedComments.filter(c => !c.resolved);
      case 'mentioned':
        return sortedComments.filter(c =>
          c.mentions.includes(currentUserId) ||
          c.replies.some(r => r.mentions.includes(currentUserId))
        );
      default:
        return sortedComments;
    }
  }, [sortedComments, filter]);

  const filteredUsers = useMemo(() => {
    if (!mentionSearch) return mockUsers;
    return mockUsers.filter(u =>
      u.name.toLowerCase().includes(mentionSearch.toLowerCase())
    );
  }, [mentionSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1 && lastAtIndex > mentionStartRef.current) {
      const searchText = textBeforeCursor.slice(lastAtIndex + 1);
      if (!searchText.includes(' ')) {
        mentionStartRef.current = lastAtIndex;
        setMentionSearch(searchText);
        setShowMentionList(true);
        return;
      }
    }

    if (lastAtIndex === -1 || textBeforeCursor.slice(lastAtIndex).includes(' ')) {
      setShowMentionList(false);
      mentionStartRef.current = -1;
    }
  };

  const handleUserSelect = (user: typeof mockUsers[0]) => {
    if (textareaRef.current && mentionStartRef.current !== -1) {
      const before = inputValue.slice(0, mentionStartRef.current);
      const after = inputValue.slice(textareaRef.current.selectionStart);
      const newValue = `${before}@${user.name} ${after}`;
      setInputValue(newValue);
      setShowMentionList(false);
      mentionStartRef.current = -1;

      setTimeout(() => {
        if (textareaRef.current) {
          const pos = before.length + user.name.length + 2;
          textareaRef.current.setSelectionRange(pos, pos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const extractMentions = (content: string): string[] => {
    const mentions: string[] = [];
    const regex = /@(\S+)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const user = mockUsers.find(u => u.name === match[1]);
      if (user && !mentions.includes(user.id)) {
        mentions.push(user.id);
      }
    }
    return mentions;
  };

  const addReplyToComment = (commentsList: Comment[], parentId: string, reply: Comment): Comment[] => {
    return commentsList.map(c => {
      if (c.id === parentId) {
        return { ...c, replies: [...c.replies, reply] };
      }
      if (c.replies.length > 0) {
        return { ...c, replies: addReplyToComment(c.replies, parentId, reply) };
      }
      return c;
    });
  };

  const resolveComment = (commentsList: Comment[], commentId: string): Comment[] => {
    return commentsList.map(c => {
      if (c.id === commentId) {
        return { ...c, resolved: !c.resolved };
      }
      if (c.replies.length > 0) {
        return { ...c, replies: resolveComment(c.replies, commentId) };
      }
      return c;
    });
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    const currentUser = mockUsers.find(u => u.id === currentUserId);
    if (!currentUser) return;

    const newComment: Comment = {
      id: generateId('comment'),
      content: inputValue.trim(),
      userId: currentUserId,
      userName: currentUser.name,
      avatar: currentUser.avatar,
      createdAt: new Date().toISOString(),
      mentions: extractMentions(inputValue),
      resolved: false,
      replies: [],
    };

    if (replyToId) {
      setComments(prev => addReplyToComment(prev, replyToId, newComment));
      setReplyToId(null);
    } else {
      setComments(prev => [newComment, ...prev]);
    }

    setInputValue('');
  };

  const handleReply = (commentId: string) => {
    if (isViewer) {
      handlePermissionDenied('尝试回复评论');
      return;
    }
    setReplyToId(commentId);
    textareaRef.current?.focus();
  };

  const handleResolve = (commentId: string) => {
    if (isViewer) {
      handlePermissionDenied('尝试解决评论');
      return;
    }
    setComments(prev => resolveComment(prev, commentId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setShowMentionList(false);
      if (replyToId) setReplyToId(null);
    }
  };

  const stats = useMemo(() => {
    const total = comments.length;
    const unresolved = comments.filter(c => !c.resolved).length;
    const mentioned = comments.filter(c =>
      c.mentions.includes(currentUserId) ||
      c.replies.some(r => r.mentions.includes(currentUserId))
    ).length;
    return { total, unresolved, mentioned };
  }, [comments]);

  const replyToComment = useMemo(() => {
    if (!replyToId) return null;
    const findComment = (list: Comment[]): Comment | null => {
      for (const c of list) {
        if (c.id === replyToId) return c;
        if (c.replies.length > 0) {
          const found = findComment(c.replies);
          if (found) return found;
        }
      }
      return null;
    };
    return findComment(comments);
  }, [replyToId, comments]);

  return (
    <ProjectLayout>
      <div className="h-full flex bg-slate-50">
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-800">评论讨论</h1>
                  <p className="text-sm text-slate-500">
                    共 {stats.total} 条评论，{stats.unresolved} 条未解决
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setFilter('all')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                    filter === 'all'
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Filter className="w-4 h-4" />
                  全部评论
                  <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded-full">
                    {stats.total}
                  </span>
                </button>
                <button
                  onClick={() => setFilter('unresolved')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                    filter === 'unresolved'
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Clock className="w-4 h-4" />
                  未解决
                  <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded-full">
                    {stats.unresolved}
                  </span>
                </button>
                <button
                  onClick={() => setFilter('mentioned')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                    filter === 'mentioned'
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <AtSign className="w-4 h-4" />
                  我提到的
                  <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded-full">
                    {stats.mentioned}
                  </span>
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {filteredComments.length > 0 ? (
                filteredComments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={handleReply}
                    onResolve={handleResolve}
                    isViewer={isViewer}
                  />
                ))
              ) : (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-600 mb-1">暂无评论</h3>
                  <p className="text-xs text-slate-400">
                    {filter === 'unresolved' ? '没有未解决的评论' :
                     filter === 'mentioned' ? '没有提到你的评论' :
                     '快来发表第一条评论吧'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="w-96 bg-white border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">发表评论</h2>
          </div>

          <div className="flex-1 p-4 flex flex-col">
            {isViewer ? (
              <div 
                className="flex-1 flex items-center justify-center cursor-pointer"
                onClick={() => handlePermissionDenied('尝试发表评论')}
              >
                <div className="text-center py-8 px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Eye className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">您是查看者，无法发表评论</p>
                  <p className="text-xs text-slate-400 mt-1">点击查看权限说明</p>
                </div>
              </div>
            ) : (
            <>
              {replyToComment && (
                <div className="mb-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-indigo-600">
                      <Reply className="w-3.5 h-3.5" />
                      回复 {replyToComment.userName}
                    </div>
                    <button
                      onClick={() => setReplyToId(null)}
                      className="text-indigo-400 hover:text-indigo-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-indigo-500/70 line-clamp-2">
                    {replyToComment.content}
                  </p>
                </div>
              )}

              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="输入评论内容，按 @ 提及成员..."
                  className="w-full h-40 p-3 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                />

                {showMentionList && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
                    {filteredUsers.map(user => {
                      const userIndex = mockUsers.findIndex(u => u.id === user.id);
                      return (
                        <button
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 text-left transition-colors"
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{
                              background: `linear-gradient(135deg, hsl(${userIndex * 60}, 70%, 60%), hsl(${userIndex * 60 + 30}, 70%, 50%))`,
                            }}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-700">{user.name}</div>
                            <div className="text-xs text-slate-400">{user.role}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  按 Enter 发送，Shift+Enter 换行
                </div>
                <Button onClick={handleSubmit} disabled={!inputValue.trim()} size="sm">
                  <Send className="w-4 h-4" />
                  发送
                </Button>
              </div>
            </>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                项目成员
              </h3>
              <div className="space-y-2">
                {mockUsers.map((user, i) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={{
                        background: `linear-gradient(135deg, hsl(${i * 60}, 70%, 60%), hsl(${i * 60 + 30}, 70%, 50%))`,
                      }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-slate-400 capitalize">
                        {user.role === 'admin' ? '管理员' : user.role === 'editor' ? '编辑者' : '查看者'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </ProjectLayout>
  );
}
