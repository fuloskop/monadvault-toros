const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error || 'An error occurred',
      data.code
    );
  }

  return data;
}

// Auth API
export const authApi = {
  getNonce: (walletAddress: string) =>
    fetchApi<{ nonce: string }>('/api/auth/nonce', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    }),

  verify: (walletAddress: string, signature: string) =>
    fetchApi<{ token: string; user: any }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature }),
    }),

  refresh: (token: string) =>
    fetchApi<{ token: string }>('/api/auth/refresh', {
      method: 'POST',
      token,
    }),
};

// User API
export const userApi = {
  getMe: (token: string) =>
    fetchApi<any>('/api/user/me', { token }),

  updateProfile: (token: string, data: { username?: string; avatar?: string }) =>
    fetchApi<any>('/api/user/me', {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  getBalance: (token: string) =>
    fetchApi<Record<string, number>>('/api/user/balance', { token }),

  getTransactions: (token: string, limit?: number, offset?: number) =>
    fetchApi<any[]>(`/api/user/transactions?limit=${limit || 50}&offset=${offset || 0}`, { token }),

  getStats: (token: string) =>
    fetchApi<any>('/api/user/stats', { token }),

  getSeed: (token: string) =>
    fetchApi<{ clientSeed: string; serverSeedHash: string; nonce: number }>('/api/user/seed', { token }),

  rotateSeed: (token: string, newClientSeed?: string) =>
    fetchApi<any>('/api/user/seed/rotate', {
      method: 'POST',
      token,
      body: JSON.stringify({ newClientSeed }),
    }),
};

// Cases API
export const casesApi = {
  getAll: () =>
    fetchApi<any[]>('/api/cases'),

  getBySlug: (slug: string) =>
    fetchApi<any>(`/api/cases/${slug}`),

  open: (token: string, slug: string, count: number = 1) =>
    fetchApi<any[]>(`/api/cases/${slug}/open`, {
      method: 'POST',
      token,
      body: JSON.stringify({ count }),
    }),

  getHistory: (token: string, limit?: number) =>
    fetchApi<any[]>(`/api/cases/history/me?limit=${limit || 50}`, { token }),

  getRecent: (limit?: number) =>
    fetchApi<any[]>(`/api/cases/recent/all?limit=${limit || 20}`),
};

// Battles API
export const battlesApi = {
  getActive: () =>
    fetchApi<any[]>('/api/battles'),

  getById: (id: string) =>
    fetchApi<any>(`/api/battles/${id}`),

  create: (token: string, mode: string, cases: string[], cursedMode?: boolean, isPrivate?: boolean) =>
    fetchApi<any>('/api/battles/create', {
      method: 'POST',
      token,
      body: JSON.stringify({ mode, cases, cursedMode, isPrivate }),
    }),

  join: (token: string, battleId: string, slot: number) =>
    fetchApi<any>(`/api/battles/${battleId}/join`, {
      method: 'POST',
      token,
      body: JSON.stringify({ slot }),
    }),

  addBot: (token: string, battleId: string, slot: number) =>
    fetchApi<any>(`/api/battles/${battleId}/bot`, {
      method: 'POST',
      token,
      body: JSON.stringify({ slot }),
    }),
};

// Games API
export const gamesApi = {
  // Crash
  getCrashCurrent: () =>
    fetchApi<any>('/api/games/crash/current'),

  getCrashHistory: (limit?: number) =>
    fetchApi<any[]>(`/api/games/crash/history?limit=${limit || 20}`),

  // Wheel
  getWheelSegments: () =>
    fetchApi<any[]>('/api/games/wheel/segments'),

  spinWheel: (token: string, betAmount: number, currency?: string) =>
    fetchApi<any>('/api/games/wheel/spin', {
      method: 'POST',
      token,
      body: JSON.stringify({ betAmount, currency }),
    }),

  // Mines
  startMines: (token: string, betAmount: number, mineCount: number, currency?: string) =>
    fetchApi<any>('/api/games/mines/start', {
      method: 'POST',
      token,
      body: JSON.stringify({ betAmount, mineCount, currency }),
    }),

  revealTile: (token: string, position: number) =>
    fetchApi<any>('/api/games/mines/reveal', {
      method: 'POST',
      token,
      body: JSON.stringify({ position }),
    }),

  cashoutMines: (token: string) =>
    fetchApi<any>('/api/games/mines/cashout', {
      method: 'POST',
      token,
    }),

  getMinesGame: (token: string) =>
    fetchApi<any>('/api/games/mines/current', { token }),

  // Upgrader
  getUpgraderConfig: () =>
    fetchApi<any>('/api/games/upgrader/config'),

  playUpgrader: (token: string, betAmount: number, targetMultiplier: number, currency?: string) =>
    fetchApi<any>('/api/games/upgrader/play', {
      method: 'POST',
      token,
      body: JSON.stringify({ betAmount, targetMultiplier, currency }),
    }),
};

// Chat API
export const chatApi = {
  getMessages: (room: string, limit?: number) =>
    fetchApi<any[]>(`/api/chat/${room}?limit=${limit || 50}`),

  sendMessage: (token: string, room: string, content: string) =>
    fetchApi<any>(`/api/chat/${room}`, {
      method: 'POST',
      token,
      body: JSON.stringify({ content }),
    }),

  getRain: () =>
    fetchApi<any>('/api/chat/rain/current'),

  claimRain: (token: string) =>
    fetchApi<any>('/api/chat/rain/claim', {
      method: 'POST',
      token,
    }),
};

export { ApiError };

