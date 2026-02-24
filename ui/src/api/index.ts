const API_BASE = '/api';

export const api = {
  async getTeams() {
    const res = await fetch(`${API_BASE}/teams`);
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  },

  async getTeam(name: string) {
    const res = await fetch(`${API_BASE}/teams/${name}`);
    if (!res.ok) throw new Error('Failed to fetch team');
    return res.json();
  },

  async createTeam(data: { name: string; description?: string; members: Array<{ name: string; platform: string }> }) {
    const res = await fetch(`${API_BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create team');
    return res.json();
  },

  async deleteTeam(name: string) {
    const res = await fetch(`${API_BASE}/teams/${name}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete team');
    return res.json();
  },

  async getTasks(teamName: string) {
    const res = await fetch(`${API_BASE}/teams/${teamName}/tasks`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async createTask(teamName: string, data: { title: string; description?: string; dependencies?: string[] }) {
    const res = await fetch(`${API_BASE}/teams/${teamName}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateTask(teamName: string, taskId: string, data: any) {
    const res = await fetch(`${API_BASE}/teams/${teamName}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async claimTask(teamName: string, taskId: string, memberId: string) {
    const res = await fetch(`${API_BASE}/teams/${teamName}/tasks/${taskId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    });
    if (!res.ok) throw new Error('Failed to claim task');
    return res.json();
  },

  async completeTask(teamName: string, taskId: string, memberId: string) {
    const res = await fetch(`${API_BASE}/teams/${teamName}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    });
    if (!res.ok) throw new Error('Failed to complete task');
    return res.json();
  },

  async getMembers(teamName: string) {
    const res = await fetch(`${API_BASE}/teams/${teamName}/members`);
    if (!res.ok) throw new Error('Failed to fetch members');
    return res.json();
  },

  async spawnMember(teamName: string, memberId: string, cwd?: string) {
    const res = await fetch(`${API_BASE}/teams/${teamName}/members/${memberId}/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd }),
    });
    if (!res.ok) throw new Error('Failed to spawn member');
    return res.json();
  },

  async shutdownMember(teamName: string, memberId: string) {
    const res = await fetch(`${API_BASE}/teams/${teamName}/members/${memberId}/shutdown`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to shutdown member');
    return res.json();
  },
};
