// サーバーとのデータのやりとり と サイト全体で共有する情報(state)

export const state = {
  settings: {},
  seasons: [],
  currentSeasonId: null,
  today: '',
  me: null,
  categories: { batting: [], pitching: [] },
  pointRules: [],
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(method, url, body, opts = {}) {
  const headers = { 'X-Requested-With': 'akaoni' };
  let payload = body;
  if (body !== undefined && !(body instanceof Blob)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(url, { method, headers, body: payload, credentials: 'same-origin', ...opts });
  let data = null;
  try { data = await res.json(); } catch { /* 空の返事 */ }
  if (!res.ok) throw new ApiError(res.status, data?.error || '通信エラーが起きました');
  return data;
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, body = {}) => request('POST', url, body),
  put: (url, body = {}) => request('PUT', url, body),
  del: (url) => request('DELETE', url),
  upload: (file, name) => request('POST', `/api/admin/upload?name=${encodeURIComponent(name || file.name)}`, file),
};

export async function loadBootstrap() {
  const data = await api.get('/api/bootstrap');
  Object.assign(state, data);
  return state;
}

export const isAdmin = () => state.me?.role === 'admin';
export const isMember = () => !!state.me;
