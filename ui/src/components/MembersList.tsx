import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Users } from 'lucide-react';
import { api } from '../api';
import MembersGallery from './MembersGallery';

interface Member {
  id: string;
  name: string;
  platform: string;
  isRunning?: boolean;
}

interface MembersListProps {
  teamName: string;
  members: Member[];
}

export default function MembersList({ teamName, members }: MembersListProps) {
  const queryClient = useQueryClient();

  const { data: membersWithStatus = members } = useQuery({
    queryKey: ['members', teamName],
    queryFn: () => api.getMembers(teamName),
    initialData: members,
  });

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

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Users size={20} className="text-slate-600" aria-hidden="true" />
        <h2 className="text-xl font-semibold leading-tight text-slate-900">团队成员</h2>
      </div>

      <MembersGallery teamName={teamName} members={membersWithStatus} />

      <div className="backdrop-blur-sm rounded-xl shadow-md border border-gray-200 p-4 transition-all duration-300 bg-white/90">
        <div className="space-y-3">
          {membersWithStatus.length === 0 ? (
            <div className="text-center py-8 text-sm leading-relaxed text-slate-400">
              暂无成员
            </div>
          ) : (
            membersWithStatus.map((member: Member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-slate-50 hover:border-blue-300 transition-colors duration-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium leading-tight mb-1 text-slate-900">
                    {member.name}
                  </div>
                  <div className="text-sm leading-relaxed text-slate-600">
                    {member.platform}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {member.isRunning ? (
                    <>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap">
                        运行中
                      </span>
                      <button
                        onClick={() => shutdownMutation.mutate(member.id)}
                        disabled={shutdownMutation.isPending}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`停止 ${member.name}`}
                        title="停止"
                      >
                        <Square size={18} aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => spawnMutation.mutate(member.id)}
                      disabled={spawnMutation.isPending}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`启动 ${member.name}`}
                      title="启动"
                    >
                      {spawnMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" aria-label="启动中" />
                      ) : (
                        <Play size={18} aria-hidden="true" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
