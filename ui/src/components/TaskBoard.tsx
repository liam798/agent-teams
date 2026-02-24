import { Circle, Clock, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignee?: string;
  dependencies: string[];
}

interface TaskBoardProps {
  teamName: string;
  tasks: Task[];
}

export default function TaskBoard({ tasks }: TaskBoardProps) {
  const { is3D } = useTheme();

  const columns = [
    { id: 'pending', title: '待处理', icon: Circle, color: 'gray' },
    { id: 'in_progress', title: '进行中', icon: Clock, color: 'blue' },
    { id: 'completed', title: '已完成', icon: CheckCircle2, color: 'green' },
  ];

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const colorClasses: Record<string, string> = {
    gray: 'text-slate-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
  };

  return (
    <div>
      <h2 className={`text-xl font-semibold mb-4 sm:mb-6 leading-tight ${is3D ? 'text-white' : 'text-slate-900'}`}>
        任务看板
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const Icon = column.icon;

          return (
            <div
              key={column.id}
              className={`
                backdrop-blur-sm rounded-2xl shadow-md border p-4 sm:p-5 min-h-[320px] sm:min-h-[380px] transition-all duration-300
                ${is3D 
                  ? 'card-3d bg-slate-800/80 border-purple-500/30 shadow-purple-500/20' 
                  : 'bg-white/90 border-gray-200'
                }
              `}
              role="region"
              aria-label={`${column.title}任务列`}
            >
              <div className={`flex items-center gap-3 mb-5 pb-4 border-b ${is3D ? 'border-purple-500/20' : 'border-gray-200'}`}>
                <div className={`p-2 rounded-lg ${
                  column.color === 'gray' ? (is3D ? 'bg-slate-700/50' : 'bg-slate-100') :
                  column.color === 'blue' ? (is3D ? 'bg-purple-500/20' : 'bg-blue-100') :
                  (is3D ? 'bg-green-500/20' : 'bg-green-100')
                }`}>
                  <Icon
                    size={18}
                    className={is3D ? (column.color === 'gray' ? 'text-purple-300' : column.color === 'blue' ? 'text-purple-400' : 'text-green-400') : colorClasses[column.color]}
                    aria-hidden="true"
                  />
                </div>
                <h3 className={`font-semibold leading-tight flex-1 text-base ${is3D ? 'text-white' : 'text-slate-900'}`}>
                  {column.title}
                </h3>
                <span className={`text-sm font-bold px-2.5 py-1 rounded-full min-w-[28px] text-center ${is3D ? 'text-purple-200 bg-purple-500/20' : 'text-slate-700 bg-slate-100'}`}>
                  {columnTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <div className={`text-center py-8 text-sm leading-relaxed ${is3D ? 'text-purple-300/70' : 'text-slate-400'}`}>
                    暂无任务
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`
                        p-4 rounded-lg border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1
                        ${is3D 
                          ? 'card-3d bg-slate-700/50 border-purple-500/30 hover:border-purple-400 hover:shadow-purple-500/20 focus:ring-purple-500' 
                          : 'bg-slate-50 border-gray-200 hover:border-blue-300 hover:shadow-sm focus:ring-blue-500'
                        }
                      `}
                      tabIndex={0}
                      role="button"
                      aria-label={`任务: ${task.title}${task.assignee ? `，负责人: ${task.assignee}` : ''}`}
                    >
                      <h4 className={`font-medium text-sm leading-relaxed mb-1 ${is3D ? 'text-white' : 'text-slate-900'}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className={`text-xs mt-2 leading-relaxed line-clamp-2 ${is3D ? 'text-purple-200' : 'text-slate-600'}`}>
                          {task.description}
                        </p>
                      )}
                      {task.assignee && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className={`text-xs ${is3D ? 'text-purple-300/70' : 'text-slate-500'}`}>负责人:</span>
                          <span className={`text-xs font-medium ${is3D ? 'text-purple-200' : 'text-slate-700'}`}>{task.assignee}</span>
                        </div>
                      )}
                      {task.dependencies.length > 0 && (
                        <div className={`mt-2 text-xs ${is3D ? 'text-purple-300/60' : 'text-slate-400'}`}>
                          依赖 {task.dependencies.length} 个任务
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
