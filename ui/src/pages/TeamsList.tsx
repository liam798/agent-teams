import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Users, CheckCircle2, Clock, Circle, ArrowRight } from 'lucide-react';
import { api } from '../api';
import CreateTeamModal from '../components/CreateTeamModal';

export default function TeamsList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.getTeams(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin" aria-label="加载中" role="status" />
          <p className="text-base leading-relaxed text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 leading-tight text-slate-900">团队列表</h1>
          <p className="text-lg leading-relaxed text-slate-600">管理和协调多个 AI Agent 团队协作</p>
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

      {/* 团队卡片 */}
      {teams.length === 0 ? (
        <div className="backdrop-blur-sm rounded-2xl p-12 shadow-lg border text-center bg-white/90 border-gray-200">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100" aria-hidden="true">
            <Users className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2 leading-tight text-slate-900">还没有团队</h3>
          <p className="mb-6 text-base leading-relaxed text-slate-600">创建一个新团队开始协作吧！</p>
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
                className="group block backdrop-blur-sm rounded-xl shadow-md border overflow-hidden transition-all duration-300 cursor-pointer bg-white/90 border-gray-200 hover:shadow-xl transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label={`查看团队 ${team.name} 的详情`}
              >
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold mb-1 transition-colors duration-200 leading-tight text-slate-900 group-hover:text-blue-600">
                        {team.name}
                      </h2>
                      {team.description && (
                        <p className="text-sm leading-relaxed text-slate-600 mb-1 line-clamp-2">
                          {team.description}
                        </p>
                      )}
                      <p className="text-xs leading-relaxed text-slate-500">
                        创建于 {new Date(team.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200" aria-hidden="true">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm mb-4 text-slate-600">
                    <Users size={16} className="text-blue-500" aria-hidden="true" />
                    <span className="font-medium leading-relaxed">{team.memberCount} 个成员</span>
                  </div>

                  {/* 任务统计 */}
                  {taskStats.total > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-medium text-slate-600">任务进度</span>
                        <span className="font-semibold text-slate-900">{completionRate}%</span>
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
                    <div className="text-center py-4 text-sm leading-relaxed text-slate-500">
                      暂无任务
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t bg-slate-50/80 border-gray-200">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="leading-relaxed">点击查看详情</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <CreateTeamModal isOpen onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
