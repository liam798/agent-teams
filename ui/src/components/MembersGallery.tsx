import { useState } from 'react';
import { Users, Play, Square } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Member3DAvatar from './Member3DAvatar';

interface Member {
  id: string;
  name: string;
  platform: string;
  /** 职责描述，来自 config.json */
  description?: string;
  isRunning?: boolean;
}

interface MembersGalleryProps {
  teamName: string;
  members: Member[];
}

// 平台图标映射
const platformIcons: Record<string, string> = {
  claude: '🤖',
  codex: '💻',
  gemini: '✨',
};

export default function MembersGallery({ teamName, members }: MembersGalleryProps) {
  const { is3D } = useTheme();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    members.length > 0 ? members[0].id : null
  );
  const queryClient = useQueryClient();

  const { data: membersWithStatus = members } = useQuery({
    queryKey: ['members', teamName],
    queryFn: () => api.getMembers(teamName),
    initialData: members,
  });

  const selectedMember = membersWithStatus.find((m: Member) => m.id === selectedMemberId) || membersWithStatus[0];

  const spawnMutation = useMutation({
    mutationFn: (memberId: string) => api.spawnMember(teamName, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', teamName] });
    },
  });

  const shutdownMutation = useMutation({
    mutationFn: (memberId: string) => api.shutdownMember(teamName, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', teamName] });
    },
  });

  if (membersWithStatus.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 rounded-xl bg-slate-800/50 border border-purple-500/30">
        <p className="text-purple-200">暂无成员</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 画廊布局：3D 视图 + 详情（缩小高度，留出空间给底部成员选择） */}
      <div className={`
        grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 sm:gap-6
        ${is3D ? 'bg-gradient-to-br from-slate-900/50 to-purple-900/50' : 'bg-white'}
        rounded-2xl p-4 sm:p-6 border ${is3D ? 'border-purple-500/30 shadow-lg shadow-purple-500/10' : 'border-gray-200 shadow-sm'}
      `}>
        {/* 左侧：选中成员的3D形象展示（进一步缩小，确保底部成员选择在首屏可见） */}
        <div className="min-w-0">
          <div className={`
            aspect-square max-h-[160px] sm:max-h-[200px] lg:max-h-[220px] rounded-xl overflow-hidden border-2
            ${is3D 
              ? 'border-cyan-400/50 bg-gradient-to-br from-slate-800 to-slate-900' 
              : 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100'
            }
            relative
          `}>
            {/* 3D模型展示 */}
            {is3D ? (
              <Member3DAvatar member={selectedMember || null} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-8xl">
                  {selectedMember ? platformIcons[selectedMember.platform.toLowerCase()] || '👤' : '👤'}
                </div>
              </div>
            )}
            
            {/* 运行状态指示器 */}
            {selectedMember?.isRunning && (
              <div className="absolute top-4 right-4 z-10">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              </div>
            )}

            {/* 平台标签 */}
            {selectedMember && (
              <div className={`
                absolute bottom-4 left-4 right-4 z-10
                px-4 py-2 rounded-lg backdrop-blur-sm
                ${is3D ? 'bg-black/60 text-cyan-300' : 'bg-white/90 text-gray-800'}
                border ${is3D ? 'border-cyan-400/30' : 'border-gray-200'}
              `}>
                <div className="text-sm font-semibold">{selectedMember.name}</div>
                <div className="text-xs opacity-75 mt-1">{selectedMember.platform.toUpperCase()}</div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：成员详细信息 */}
        <div className="flex flex-col min-w-0">
          <div className="flex-1 space-y-4">
            <div>
              <div className={`
                text-xs uppercase tracking-wider mb-2
                ${is3D ? 'text-cyan-400' : 'text-gray-500'}
                border-b ${is3D ? 'border-cyan-400/30' : 'border-gray-200'} pb-1
              `}>
                {selectedMember?.platform.toUpperCase() || 'AGENT'}
              </div>
              <h3 className={`
                text-2xl sm:text-3xl font-bold mb-2 leading-tight
                ${is3D ? 'text-white' : 'text-gray-900'}
              `}>
                {selectedMember?.name || '未选择'}
              </h3>
            </div>

            {/* 统计数据 */}
            <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm ${is3D ? 'text-cyan-300' : 'text-gray-600'}`}>状态</span>
                <span className={`text-sm font-semibold ${is3D ? 'text-white' : 'text-gray-900'}`}>
                  {selectedMember?.isRunning ? '运行中' : '已停止'}
                </span>
              </div>
              <div className={`
                h-2 rounded-full overflow-hidden
                ${is3D ? 'bg-slate-700' : 'bg-gray-200'}
              `}>
                <div 
                  className={`h-full transition-all ${
                    selectedMember?.isRunning ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                  style={{ width: selectedMember?.isRunning ? '100%' : '0%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm ${is3D ? 'text-cyan-300' : 'text-gray-600'}`}>平台</span>
                <span className={`text-sm font-semibold ${is3D ? 'text-white' : 'text-gray-900'}`}>
                  {selectedMember?.platform || 'N/A'}
                </span>
              </div>
              <div className={`
                h-2 rounded-full overflow-hidden
                ${is3D ? 'bg-slate-700' : 'bg-gray-200'}
              `}>
                <div 
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

            {/* 描述/信息 */}
            <div className={`
              pt-4 border-t ${is3D ? 'border-cyan-400/20' : 'border-gray-200'}
            `}>
              <div className={`
                text-xs uppercase tracking-wider mb-2
                ${is3D ? 'text-cyan-400' : 'text-gray-500'}
              `}>
                成员信息
              </div>
              <p className={`
                text-sm leading-relaxed
                ${is3D ? 'text-purple-200' : 'text-gray-600'}
              `}>
                {selectedMember?.description
                  ? selectedMember.description
                  : selectedMember?.isRunning
                    ? '该成员正在运行中，可以处理任务和接收消息。'
                    : '该成员当前已停止，点击启动按钮可以激活。'
                }
              </p>
            </div>
          </div>

          {/* 操作按钮 - 贴底 */}
          <div className="pt-4 mt-auto space-y-2">
            {selectedMember && (
              selectedMember.isRunning ? (
                <button
                  onClick={() => shutdownMutation.mutate(selectedMember.id)}
                  disabled={shutdownMutation.isPending}
                  className={`
                    w-full px-4 py-3 rounded-lg font-semibold
                    transition-all duration-200
                    ${is3D
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                  `}
                >
                  <Square size={18} />
                  <span>停止运行</span>
                </button>
              ) : (
                <button
                  onClick={() => spawnMutation.mutate(selectedMember.id)}
                  disabled={spawnMutation.isPending}
                  className={`
                    w-full px-4 py-3 rounded-lg font-semibold
                    transition-all duration-200
                    ${is3D
                      ? 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/50'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                  `}
                >
                  <Play size={18} />
                  <span>启动运行</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* 底部：成员选择（首屏可见） */}
      <div className={`
        rounded-2xl p-4 sm:p-5 border
        ${is3D ? 'bg-slate-800/40 border-purple-500/20' : 'bg-white border-gray-200 shadow-sm'}
      `}>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Users size={18} className={`flex-shrink-0 ${is3D ? 'text-cyan-400' : 'text-gray-600'}`} />
          <h3 className={`
            text-base sm:text-lg font-semibold
            ${is3D ? 'text-white' : 'text-gray-900'}
          `}>
            成员选择
          </h3>
        </div>
        
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent">
          {membersWithStatus.map((member: Member) => {
            const isSelected = member.id === selectedMemberId;
            
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className={`
                  flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl
                  transition-all duration-200
                  ${isSelected
                    ? is3D
                      ? 'border-2 border-cyan-400 shadow-lg shadow-cyan-400/50 scale-105'
                      : 'border-2 border-blue-500 shadow-lg scale-105'
                    : is3D
                      ? 'border border-purple-500/30 hover:border-purple-500/50'
                      : 'border border-gray-200 hover:border-gray-300'
                  }
                  ${is3D
                    ? isSelected ? 'bg-gradient-to-br from-cyan-900/50 to-purple-900/50' : 'bg-slate-800/50'
                    : isSelected ? 'bg-blue-50' : 'bg-gray-50'
                  }
                  flex flex-col items-center justify-center gap-2
                  relative
                `}
              >
                <div className="text-2xl sm:text-3xl">
                  {platformIcons[member.platform.toLowerCase()] || '👤'}
                </div>
                <div className={`
                  text-[11px] sm:text-xs font-medium text-center px-1.5 sm:px-2 truncate w-full
                  ${isSelected 
                    ? is3D ? 'text-cyan-300' : 'text-blue-700'
                    : is3D ? 'text-purple-200' : 'text-gray-600'
                  }
                `}>
                  {member.name}
                </div>
                {member.isRunning && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
                {isSelected && (
                  <div className={`
                    absolute -bottom-1 left-1/2 transform -translate-x-1/2
                    w-8 h-1 rounded-full
                    ${is3D ? 'bg-cyan-400' : 'bg-blue-500'}
                  `} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
