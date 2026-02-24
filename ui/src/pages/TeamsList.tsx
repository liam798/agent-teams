import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Users, CheckCircle2, Clock, Circle, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../api';
import CreateTeamModal from '../components/CreateTeamModal';
import { useTheme } from '../contexts/ThemeContext';

export default function TeamsList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { is3D } = useTheme();
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.getTeams(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${is3D ? 'border-purple-500' : 'border-blue-500'}`} aria-label="加载中" role="status"></div>
          <p className={`text-base leading-relaxed ${is3D ? 'text-purple-200' : 'text-slate-600'}`}>加载中...</p>
        </div>
      </div>
    );
  }

  const totalTasks = teams.reduce((sum: number, team: any) => sum + (team.taskStats?.total || 0), 0);
  const totalMembers = teams.reduce((sum: number, team: any) => sum + (team.memberCount || 0), 0);

  return (
    <div className="space-y-8">
      {/* 头部区域 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-4xl font-bold mb-2 leading-tight ${is3D ? 'text-white' : 'text-slate-900'}`}>团队列表</h1>
          <p className={`text-lg leading-relaxed ${is3D ? 'text-purple-200' : 'text-slate-600'}`}>管理和协调多个 AI Agent 团队协作</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer min-h-[44px]"
          aria-label="创建新团队"
        >
          <Plus size={20} aria-hidden="true" />
          <span>新建团队</span>
        </button>
      </div>

      {/* 统计卡片 */}
      {teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className={`
              backdrop-blur-sm rounded-xl p-6 shadow-md border transition-all duration-300
              ${is3D 
                ? 'card-3d bg-slate-800/80 border-purple-500/30 shadow-purple-500/20 hover:shadow-purple-500/40' 
                : 'bg-white/90 border-gray-200 hover:shadow-lg'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 font-medium ${is3D ? 'text-purple-300' : 'text-slate-600'}`}>总团队数</p>
                <p className={`text-3xl font-bold leading-none ${is3D ? 'text-white' : 'text-slate-900'}`}>{teams.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md" aria-hidden="true">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div 
            className={`
              backdrop-blur-sm rounded-xl p-6 shadow-md border transition-all duration-300
              ${is3D 
                ? 'card-3d bg-slate-800/80 border-purple-500/30 shadow-purple-500/20 hover:shadow-purple-500/40' 
                : 'bg-white/90 border-gray-200 hover:shadow-lg'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 font-medium ${is3D ? 'text-purple-300' : 'text-slate-600'}`}>总成员数</p>
                <p className={`text-3xl font-bold leading-none ${is3D ? 'text-white' : 'text-slate-900'}`}>{totalMembers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md" aria-hidden="true">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div 
            className={`
              backdrop-blur-sm rounded-xl p-6 shadow-md border transition-all duration-300
              ${is3D 
                ? 'card-3d bg-slate-800/80 border-purple-500/30 shadow-purple-500/20 hover:shadow-purple-500/40' 
                : 'bg-white/90 border-gray-200 hover:shadow-lg'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 font-medium ${is3D ? 'text-purple-300' : 'text-slate-600'}`}>总任务数</p>
                <p className={`text-3xl font-bold leading-none ${is3D ? 'text-white' : 'text-slate-900'}`}>{totalTasks}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md" aria-hidden="true">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 团队卡片 */}
      {teams.length === 0 ? (
        <div className={`backdrop-blur-sm rounded-2xl p-12 shadow-lg border text-center ${is3D ? 'bg-slate-800/80 border-purple-500/30 shadow-purple-500/20' : 'bg-white/90 border-gray-200'}`}>
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${is3D ? 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}`} aria-hidden="true">
            <Users className={`w-10 h-10 ${is3D ? 'text-purple-400' : 'text-blue-600'}`} />
          </div>
          <h3 className={`text-xl font-semibold mb-2 leading-tight ${is3D ? 'text-white' : 'text-slate-900'}`}>还没有团队</h3>
          <p className={`mb-6 text-base leading-relaxed ${is3D ? 'text-purple-200' : 'text-slate-600'}`}>创建一个新团队开始协作吧！</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer min-h-[44px]"
            aria-label="创建第一个团队"
          >
            <Plus size={20} aria-hidden="true" />
            <span>创建第一个团队</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team: any) => {
            const taskStats = team.taskStats || { pending: 0, inProgress: 0, completed: 0, total: 0 };
            const completionRate = taskStats.total > 0 
              ? Math.round((taskStats.completed / taskStats.total) * 100) 
              : 0;

            return (
              <Link
                key={team.name}
                to={`/teams/${team.name}`}
                className={`
                  group block backdrop-blur-sm rounded-xl shadow-md border overflow-hidden transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${is3D 
                    ? 'card-3d bg-slate-800/80 border-purple-500/30 shadow-purple-500/20 hover:shadow-purple-500/40 focus:ring-purple-500' 
                    : 'bg-white/90 border-gray-200 hover:shadow-xl transform hover:-translate-y-1 focus:ring-blue-500'
                  }
                `}
                aria-label={`查看团队 ${team.name} 的详情`}
              >
                {/* 卡片头部 */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className={`text-xl font-bold mb-1 transition-colors duration-200 leading-tight ${is3D ? 'text-white group-hover:text-purple-300' : 'text-slate-900 group-hover:text-blue-600'}`}>
                        {team.name}
                      </h2>
                      <p className={`text-xs leading-relaxed ${is3D ? 'text-purple-300/70' : 'text-slate-500'}`}>
                        创建于 {new Date(team.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200" aria-hidden="true">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* 成员信息 */}
                  <div className={`flex items-center gap-2 text-sm mb-4 ${is3D ? 'text-purple-200' : 'text-slate-600'}`}>
                    <Users size={16} className={is3D ? 'text-purple-400' : 'text-blue-500'} aria-hidden="true" />
                    <span className="font-medium leading-relaxed">{team.memberCount} 个成员</span>
                  </div>

                  {/* 任务统计 */}
                  {taskStats.total > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className={`font-medium ${is3D ? 'text-purple-300' : 'text-slate-600'}`}>任务进度</span>
                        <span className={`font-semibold ${is3D ? 'text-white' : 'text-slate-900'}`}>{completionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden" role="progressbar" aria-valuenow={completionRate} aria-valuemin={0} aria-valuemax={100}>
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between pt-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5" aria-label={`待处理任务 ${taskStats.pending} 个`}>
                            <Circle size={12} className="text-slate-400" aria-hidden="true" />
                            <span className="text-xs text-slate-600 leading-relaxed">{taskStats.pending}</span>
                          </div>
                          <div className="flex items-center gap-1.5" aria-label={`进行中任务 ${taskStats.inProgress} 个`}>
                            <Clock size={12} className="text-blue-500" aria-hidden="true" />
                            <span className="text-xs text-slate-600 leading-relaxed">{taskStats.inProgress}</span>
                          </div>
                          <div className="flex items-center gap-1.5" aria-label={`已完成任务 ${taskStats.completed} 个`}>
                            <CheckCircle2 size={12} className="text-green-500" aria-hidden="true" />
                            <span className="text-xs text-slate-600 leading-relaxed">{taskStats.completed}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {taskStats.total === 0 && (
                    <div className={`text-center py-4 text-sm leading-relaxed ${is3D ? 'text-purple-300/70' : 'text-slate-500'}`}>
                      暂无任务
                    </div>
                  )}
                </div>

                {/* 卡片底部 */}
                <div className={`px-6 py-4 border-t ${is3D ? 'bg-slate-700/50 border-purple-500/20' : 'bg-slate-50/80 border-gray-200'}`}>
                  <div className={`flex items-center justify-between text-xs ${is3D ? 'text-purple-200' : 'text-slate-600'}`}>
                    <span className="leading-relaxed">点击查看详情</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <CreateTeamModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
