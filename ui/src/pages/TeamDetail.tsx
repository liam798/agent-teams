import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import TaskBoard from '../components/TaskBoard';
import MembersGallery from '../components/MembersGallery';
import { useTeamTasksSubscription } from '../hooks/useTeamTasksSubscription';

export default function TeamDetail() {
  const { name } = useParams<{ name: string }>();

  useTeamTasksSubscription(name ?? undefined);

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', name],
    queryFn: () => api.getTeam(name!),
    enabled: !!name,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', name],
    queryFn: () => api.getTasks(name!),
    enabled: !!name,
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

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-base leading-relaxed text-slate-600">团队不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="pb-2">
        <h1 className="text-3xl sm:text-4xl font-bold mb-1.5 leading-tight tracking-tight text-slate-900">
          {team.name}
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600">
          创建于 {new Date(team.createdAt).toLocaleDateString('zh-CN')}
        </p>
      </header>

      <section aria-label="团队成员">
        <MembersGallery teamName={name!} members={team.members} />
      </section>

      <section aria-label="任务看板" className="pt-6 sm:pt-8 border-t border-slate-200">
        <TaskBoard teamName={name!} tasks={tasks} />
      </section>
    </div>
  );
}
