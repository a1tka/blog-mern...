// Tiny API client: attaches the JWT from localStorage to every request.
const API = (() => {
  const getToken = () => localStorage.getItem('token');

  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    const res = await fetch('/api' + path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  return {
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
    getPosts: (search = '') => request('/posts' + (search ? '?search=' + encodeURIComponent(search) : '')),
    getMyPosts: () => request('/posts/mine'),
    getPost: (id) => request('/posts/' + id),
    createPost: (body) => request('/posts', { method: 'POST', body: JSON.stringify(body) }),
    updatePost: (id, body) => request('/posts/' + id, { method: 'PUT', body: JSON.stringify(body) }),
    deletePost: (id) => request('/posts/' + id, { method: 'DELETE' }),
  };
})();
