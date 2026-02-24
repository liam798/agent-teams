import { useState } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTeamModal({ isOpen, onClose }: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [members, setMembers] = useState<Array<{ name: string; platform: string }>>([
    { name: '', platform: 'claude' },
  ]);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; members: Array<{ name: string; platform: string }> }) =>
      api.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onClose();
      setTeamName('');
      setTeamDescription('');
      setMembers([{ name: '', platform: 'claude' }]);
    },
  });

  const addMember = () => {
    setMembers([...members, { name: '', platform: 'claude' }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: 'name' | 'platform', value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validMembers = members.filter(m => m.name.trim());
    if (!teamName.trim() || validMembers.length === 0) return;

    createMutation.mutate({
      name: teamName.trim(),
      ...(teamDescription.trim() ? { description: teamDescription.trim() } : {}),
      members: validMembers,
    });
  };

  return !isOpen ? null : (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h2 id="modal-title" className="text-xl font-bold text-slate-900">
            创建新团队
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="关闭对话框"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="team-name" className="block text-sm font-medium text-slate-900 mb-2">
              团队名称 <span className="text-red-500">*</span>
            </label>
            <input
              id="team-name"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="例如: frontend-team"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="team-desc" className="block text-sm font-medium text-slate-900 mb-2">
              团队职能描述 <span className="text-slate-400 font-normal">（选填，便于选队）</span>
            </label>
            <input
              id="team-desc"
              type="text"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="例如: PR 安全与性能审查、用户认证功能开发"
              aria-label="团队职能描述"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-900">
                团队成员 <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addMember}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 cursor-pointer"
                aria-label="添加成员"
              >
                <Plus size={16} aria-hidden="true" />
                添加成员
              </button>
            </div>

            <div className="space-y-3">
              {members.map((member, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateMember(index, 'name', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      placeholder="成员名称"
                      aria-label={`成员 ${index + 1} 名称`}
                    />
                  </div>
                  <div className="w-36 relative">
                    <select
                      value={member.platform}
                      onChange={(e) => updateMember(index, 'platform', e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white cursor-pointer appearance-none hover:border-gray-400 transition-colors duration-200"
                      aria-label={`成员 ${index + 1} 平台`}
                    >
                      <option value="claude">Claude</option>
                      <option value="codex">Codex</option>
                      <option value="gemini">Gemini</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                      <ChevronDown size={18} className="text-slate-500" aria-hidden="true" />
                    </div>
                  </div>
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={`删除成员 ${index + 1}`}
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-slate-700 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium cursor-pointer min-h-[44px]"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !teamName.trim() || members.every(m => !m.name.trim())}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? '创建中...' : '创建团队'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
