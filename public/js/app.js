const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/* ---------- helpers ---------- */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const excerpt = (text, n = 180) => (text.length > n ? text.slice(0, n).trim() + '…' : text);

function useHashRoute() {
  const [hash, setHash] = useState(location.hash.slice(1) || '/');
  useEffect(() => {
    const on = () => setHash(location.hash.slice(1) || '/');
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}
const go = (path) => { location.hash = path; };

/* ---------- components ---------- */
function Navbar({ user, onLogout }) {
  return html`
    <header class="nav">
      <div class="container nav-inner">
        <a class="brand" href="#/">Ink<span>well</span></a>
        <nav>
          <a href="#/">Read</a>
          ${user
            ? html`
                <a href="#/my-posts">My posts</a>
                <a class="btn btn-primary btn-sm" href="#/write">Write</a>
                <span class="who">Hi, ${user.name.split(' ')[0]}</span>
                <button class="btn btn-ghost btn-sm" onClick=${onLogout}>Log out</button>`
            : html`
                <a href="#/login">Log in</a>
                <a class="btn btn-primary btn-sm" href="#/register">Sign up</a>`}
        </nav>
      </div>
    </header>`;
}

function PostCard({ post }) {
  return html`
    <article class="card">
      <h2><a href=${'#/post/' + post._id}>${post.title}</a></h2>
      <p class="meta">by ${post.author?.name || 'Unknown'} · ${fmtDate(post.createdAt)}</p>
      <p class="excerpt">${excerpt(post.content)}</p>
      <a class="more" href=${'#/post/' + post._id}>Read more →</a>
    </article>`;
}

function Home() {
  const [posts, setPosts] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = useCallback((q) => {
    API.getPosts(q).then(setPosts).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(''); }, [load]);

  return html`
    <div class="container">
      <section class="hero">
        <h1>Stories worth reading.</h1>
        <p>Read what others are writing, or share your own.</p>
        <form class="search" onSubmit=${(e) => { e.preventDefault(); load(search); }}>
          <input placeholder="Search posts…" value=${search} onInput=${(e) => setSearch(e.target.value)} />
          <button class="btn btn-primary">Search</button>
        </form>
      </section>
      ${error && html`<p class="error">${error}</p>`}
      ${!posts && !error && html`<p class="muted">Loading…</p>`}
      ${posts && posts.length === 0 && html`<p class="muted">No posts found.</p>`}
      <div class="grid">${posts && posts.map((p) => html`<${PostCard} key=${p._id} post=${p} />`)}</div>
    </div>`;
}

function PostView({ id, user }) {
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    API.getPost(id).then(setPost).catch((e) => setError(e.message));
  }, [id]);

  const remove = async () => {
    if (!confirm('Delete this post permanently?')) return;
    try { await API.deletePost(id); go('/my-posts'); } catch (e) { setError(e.message); }
  };

  if (error) return html`<div class="container narrow"><p class="error">${error}</p></div>`;
  if (!post) return html`<div class="container narrow"><p class="muted">Loading…</p></div>`;

  const isOwner = user && post.author && post.author._id === user.id;
  return html`
    <div class="container narrow">
      <a class="back" href="#/">← All posts</a>
      <article class="post">
        <h1>${post.title}</h1>
        <p class="meta">
          by ${post.author?.name || 'Unknown'} · ${fmtDate(post.createdAt)}
          ${post.updatedAt !== post.createdAt && ' · edited ' + fmtDate(post.updatedAt)}
        </p>
        ${isOwner && html`
          <div class="actions">
            <a class="btn btn-sm" href=${'#/edit/' + post._id}>Edit</a>
            <button class="btn btn-danger btn-sm" onClick=${remove}>Delete</button>
          </div>`}
        <div class="body">${post.content}</div>
      </article>
    </div>`;
}

function Editor({ id }) {
  const editing = Boolean(id);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    API.getPost(id).then((p) => { setTitle(p.title); setContent(p.content); }).catch((e) => setError(e.message));
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const saved = editing ? await API.updatePost(id, { title, content }) : await API.createPost({ title, content });
      go('/post/' + saved._id);
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return html`
    <div class="container narrow">
      <h1>${editing ? 'Edit post' : 'Write a new post'}</h1>
      <form class="form" onSubmit=${submit}>
        <label>Title<input required maxlength="150" value=${title} onInput=${(e) => setTitle(e.target.value)} /></label>
        <label>Content<textarea required rows="16" value=${content} onInput=${(e) => setContent(e.target.value)}></textarea></label>
        ${error && html`<p class="error">${error}</p>`}
        <div class="row">
          <button class="btn btn-primary" disabled=${busy}>${busy ? 'Saving…' : editing ? 'Save changes' : 'Publish'}</button>
          <a class="btn btn-ghost" href=${editing ? '#/post/' + id : '#/'}>Cancel</a>
        </div>
      </form>
    </div>`;
}

function MyPosts() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { API.getMyPosts().then(setPosts).catch((e) => setError(e.message)); }, []);

  const remove = async (id) => {
    if (!confirm('Delete this post permanently?')) return;
    try { await API.deletePost(id); setPosts(posts.filter((p) => p._id !== id)); } catch (e) { setError(e.message); }
  };

  return html`
    <div class="container narrow">
      <h1>My posts</h1>
      ${error && html`<p class="error">${error}</p>`}
      ${!posts && !error && html`<p class="muted">Loading…</p>`}
      ${posts && posts.length === 0 && html`<p class="muted">You haven't written anything yet. <a href="#/write">Write your first post</a>.</p>`}
      <ul class="list">
        ${posts && posts.map((p) => html`
          <li key=${p._id}>
            <div>
              <a href=${'#/post/' + p._id}><strong>${p.title}</strong></a>
              <p class="meta">${fmtDate(p.createdAt)}</p>
            </div>
            <div class="row">
              <a class="btn btn-sm" href=${'#/edit/' + p._id}>Edit</a>
              <button class="btn btn-danger btn-sm" onClick=${() => remove(p._id)}>Delete</button>
            </div>
          </li>`)}
      </ul>
    </div>`;
}

function AuthForm({ mode, onAuth }) {
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const data = isRegister ? await API.register(form) : await API.login({ email: form.email, password: form.password });
      onAuth(data);
      go('/');
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return html`
    <div class="container tiny">
      <h1>${isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <form class="form" onSubmit=${submit}>
        ${isRegister && html`<label>Name<input required value=${form.name} onInput=${set('name')} /></label>`}
        <label>Email<input type="email" required value=${form.email} onInput=${set('email')} /></label>
        <label>Password<input type="password" required minlength="6" value=${form.password} onInput=${set('password')} /></label>
        ${error && html`<p class="error">${error}</p>`}
        <button class="btn btn-primary" disabled=${busy}>${busy ? 'Please wait…' : isRegister ? 'Sign up' : 'Log in'}</button>
      </form>
      <p class="muted center">
        ${isRegister
          ? html`Already have an account? <a href="#/login">Log in</a>`
          : html`New here? <a href="#/register">Create an account</a>`}
      </p>
    </div>`;
}

/* ---------- app ---------- */
function App() {
  const route = useHashRoute();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Restore session from stored JWT
  useEffect(() => {
    if (!localStorage.getItem('token')) return setReady(true);
    API.me()
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setReady(true));
  }, []);

  const onAuth = ({ token, user }) => { localStorage.setItem('token', token); setUser(user); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); go('/'); };

  if (!ready) return html`<p class="muted center">Loading…</p>`;

  // Route guard
  const protectedRoute = route === '/write' || route === '/my-posts' || route.startsWith('/edit/');
  let page;
  if (protectedRoute && !user) page = html`<${AuthForm} mode="login" onAuth=${onAuth} />`;
  else if (route === '/') page = html`<${Home} />`;
  else if (route === '/login') page = html`<${AuthForm} mode="login" onAuth=${onAuth} />`;
  else if (route === '/register') page = html`<${AuthForm} mode="register" onAuth=${onAuth} />`;
  else if (route === '/write') page = html`<${Editor} key="new" />`;
  else if (route === '/my-posts') page = html`<${MyPosts} />`;
  else if (route.startsWith('/edit/')) page = html`<${Editor} key=${route} id=${route.split('/')[2]} />`;
  else if (route.startsWith('/post/')) page = html`<${PostView} key=${route} id=${route.split('/')[2]} user=${user} />`;
  else page = html`<div class="container"><h1>Page not found</h1></div>`;

  return html`<${Navbar} user=${user} onLogout=${logout} />
    <main>${page}</main>
    <footer class="footer">© ${new Date().getFullYear()} Inkwell</footer>`;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
