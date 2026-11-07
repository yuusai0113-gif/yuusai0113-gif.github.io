// サイト全体の骨組み: ページ切り替え・ヘッダー・フッター
import { state, loadBootstrap, isAdmin, ApiError } from './api.js';
import { esc, icons, logoSrc, initMotion, toast } from './ui.js';

// ページの一覧。ページを増やすときはここに1行足す
const ROUTES = [
  ['/', () => import('./pages/home.js'), 'home'],
  ['/news', () => import('./pages/news.js'), 'list'],
  ['/news/:id', () => import('./pages/news.js'), 'detail'],
  ['/players', () => import('./pages/players.js'), 'list'],
  ['/players/:id', () => import('./pages/players.js'), 'detail'],
  ['/batting', () => import('./pages/batting.js'), 'batting'],
  ['/games', () => import('./pages/games.js'), 'list'],
  ['/games/:id', () => import('./pages/games.js'), 'detail'],
  ['/schedule', () => import('./pages/schedule.js'), 'schedule'],
  ['/stats', () => import('./pages/stats.js'), 'stats'],
  ['/team', () => import('./pages/team.js'), 'team'],
  ['/events', () => import('./pages/activities.js'), 'list'],
  ['/events/:id', () => import('./pages/activities.js'), 'detail'],
  ['/gallery', () => import('./pages/gallery.js'), 'gallery'],
  ['/awards', () => import('./pages/awards.js'), 'awards'],
  ['/login', () => import('./pages/login.js'), 'login'],
  ['/mypage', () => import('./pages/mypage.js'), 'mypage', 'member'],
  ['/admin', () => import('./pages/admin.js'), 'admin', 'admin'],
  ['/admin/:section', () => import('./pages/admin.js'), 'admin', 'admin'],
  ['/admin/:section/:id', () => import('./pages/admin.js'), 'admin', 'admin'],
].map(([pattern, load, fn, auth]) => {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  return { pattern, re, keys, load, fn, auth };
});

const NAV = [
  ['/', 'ホーム', 'HOME'], ['/schedule', 'スケジュール', 'SCHEDULE'], ['/players', '選手', 'PLAYERS'], ['/batting', '打率', 'AVG'], ['/games', '試合', 'GAMES'], ['/stats', '成績', 'STATS'],
  ['/team', 'チーム', 'TEAM'], ['/events', 'イベント', 'EVENTS'], ['/gallery', 'ギャラリー', 'GALLERY'], ['/awards', '表彰', 'AWARDS'],
];

// スマホの画面の下に並ぶメニュー。ほかのページは「メニュー」の中から開く
const TABS = [['/', 'ホーム', 'home'], ['/schedule', '予定', 'calendar'], ['/players', '選手', 'user'], ['/stats', '成績', 'chart']];

const app = document.getElementById('app');
let renderToken = 0;

function matchRoute(pathname) {
  for (const r of ROUTES) {
    const m = r.re.exec(pathname);
    if (m) return { route: r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

export function navigate(url, { replace = false, keepScroll = false } = {}) {
  if (replace) history.replaceState({}, '', url);
  else history.pushState({}, '', url);
  render({ keepScroll });
}

async function render({ keepScroll = false } = {}) {
  const token = ++renderToken;
  const url = new URL(location.href);
  const found = matchRoute(url.pathname);
  closeDrawer();
  if (found?.route.auth && !state.me) {
    navigate(`/login?next=${encodeURIComponent(url.pathname + url.search)}`, { replace: true });
    return;
  }
  app.classList.add('leaving');
  let view;
  try {
    if (!found) throw new ApiError(404, 'ページが見つかりませんでした');
    if (found.route.auth === 'admin' && !isAdmin()) throw new ApiError(403, 'このページは管理者だけが見られます');
    const mod = await found.route.load();
    view = await mod[found.route.fn]({
      params: found.params,
      query: Object.fromEntries(url.searchParams),
      navigate,
      rerender: () => render({ keepScroll: true }),
      reloadApp,
    });
  } catch (err) {
    console.error(err);
    view = errorView(err);
  }
  if (token !== renderToken) return;
  const team = state.settings.team_name || '赤鬼';
  document.title = view.title ? `${view.title} | ${team} 公式サイト` : `${team} 公式サイト`;
  app.innerHTML = view.html;
  app.classList.remove('leaving', 'entering');
  void app.offsetWidth;
  app.classList.add('entering');
  if (!keepScroll) window.scrollTo({ top: 0, behavior: 'instant' });
  try { await view.mount?.(app); } catch (err) { console.error(err); toast(err.message || 'エラーが起きました', true); }
  initMotion(app);
  updateActiveNav(url.pathname);
}

function errorView(err) {
  const status = err.status || 500;
  return {
    title: 'エラー',
    html: `<section class="auth-wrap"><div class="auth-card" style="text-align:center">
      <div class="en" style="font-size:64px;font-weight:700;color:var(--red);line-height:1">${status}</div>
      <h1 style="margin:10px 0 16px">${esc(err.message || 'エラーが起きました')}</h1>
      <a class="btn btn-gold" href="/">ホームへ戻る</a></div></section>`,
  };
}

function updateActiveNav(pathname) {
  const active = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', active(a.getAttribute('href'))));
  document.body.classList.toggle('is-sub', !TABS.some(([h]) => h === pathname));
}

function memberLinks() {
  if (!state.me) return [['/login', 'ログイン', 'LOGIN']];
  const links = [];
  if (state.me.player_id || state.me.role === 'player') links.push(['/mypage', 'マイページ', 'MY PAGE']);
  if (isAdmin()) links.push(['/admin', '管理画面', 'ADMIN']);
  return links;
}

function renderChrome() {
  const s = state.settings;
  const ig = s.sns_instagram ? `<a class="icon-btn" href="${esc(s.sns_instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${icons.instagram}</a>` : '';
  const mainLink = memberLinks()[memberLinks().length - 1];
  document.getElementById('site-header').innerHTML = `<div class="container header-inner">
    <button class="icon-btn app-back" id="app-back" aria-label="戻る">${icons.back}</button>
    <a class="brand" href="/" aria-label="ホーム">
      <span class="brand-logo"><img src="${logoSrc()}" alt=""></span>
      <span><span class="brand-name">${esc(s.team_name)}</span><span class="brand-sub" style="display:block">${esc(s.team_name_en)} ${esc(s.club_label)}</span></span>
    </a>
    <nav class="nav" aria-label="メインメニュー">${NAV.map(([h, t, en]) => `<a href="${h}" data-nav>${t}<span>${en}</span></a>`).join('')}</nav>
    <div class="header-actions">
      ${ig}
      <a class="btn btn-gold btn-sm" href="${mainLink[0]}">${mainLink[1]}</a>
      <button class="icon-btn burger" id="burger" aria-label="メニューを開く">${icons.menu}</button>
    </div>
  </div>`;
  document.getElementById('drawer').innerHTML = `<div class="drawer-panel" role="dialog" aria-label="メニュー">
    <button class="icon-btn drawer-close" id="drawer-close" aria-label="閉じる">${icons.close}</button>
    ${NAV.map(([h, t, en]) => `<a class="dl" href="${h}" data-nav>${t}<span>${en}</span></a>`).join('')}
    <a class="dl" href="/news" data-nav>お知らせ<span>NEWS</span></a>
    ${memberLinks().map(([h, t, en]) => `<a class="dl" href="${h}" data-nav>${t}<span>${en}</span></a>`).join('')}
    ${s.sns_instagram ? `<a class="dl" href="${esc(s.sns_instagram)}" target="_blank" rel="noopener">Instagram<span>FOLLOW</span></a>` : ''}
    ${state.me ? '<button class="btn btn-ghost" style="margin-top:20px" data-logout>ログアウト</button>' : ''}
  </div>`;
  document.getElementById('site-footer').innerHTML = `<div class="container">
    <div class="footer-grid">
      <div>
        <a class="brand" href="/"><span class="brand-logo"><img src="${logoSrc()}" alt=""></span>
          <span><span class="brand-name" style="color:#fff">${esc(s.team_name)}</span><span class="brand-sub" style="display:block">${esc(s.team_name_en)} ${esc(s.club_label)}</span></span></a>
        <p style="margin-top:16px;font-size:14px">${esc(s.catchphrase)}<br>${esc(s.league_name)} 所属</p>
        ${s.sns_instagram ? `<a class="btn btn-ghost btn-sm" href="${esc(s.sns_instagram)}" target="_blank" rel="noopener"><span style="width:16px;height:16px;display:inline-block">${icons.instagram}</span>Instagram をフォロー</a>` : ''}
      </div>
      <div><h4>MENU</h4><ul>${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}<li><a href="/news">お知らせ</a></li></ul></div>
      <div><h4>MEMBERS</h4><ul>${memberLinks().map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}
        ${state.me ? '<li><a href="#" data-logout>ログアウト</a></li>' : ''}</ul></div>
    </div>
    <div class="footer-bottom"><span>© ${new Date().getFullYear()} ${esc(s.team_name)} ${esc(s.team_name_en)} ${esc(s.club_label)}</span><span>Since ${esc(s.founded)}</span></div>
  </div>`;
  document.getElementById('tabbar').innerHTML = `${TABS.map(([h, t, ic]) => `<a href="${h}" data-nav>${icons[ic]}<span>${t}</span></a>`).join('')}
    <button type="button" id="tab-menu">${icons.menu}<span>メニュー</span></button>`;
  document.getElementById('burger').addEventListener('click', openDrawer);
  document.getElementById('tab-menu').addEventListener('click', openDrawer);
  document.getElementById('app-back').addEventListener('click', goBack);
  document.getElementById('drawer-close').addEventListener('click', closeDrawer);
  document.querySelectorAll('[data-logout]').forEach((b) => b.addEventListener('click', logout));
  const fav = document.querySelector('link[rel=icon]');
  if (fav) fav.href = logoSrc();
  updateActiveNav(location.pathname);
}

// ホーム画面から開くとブラウザの戻るボタンがないので、画面の左上に用意している
function goBack() {
  if (history.length > 1) history.back();
  else navigate('/');
}

function openDrawer() {
  const d = document.getElementById('drawer');
  d.classList.add('open');
  d.setAttribute('aria-hidden', 'false');
}
function closeDrawer() {
  const d = document.getElementById('drawer');
  d.classList.remove('open');
  d.setAttribute('aria-hidden', 'true');
}

async function logout(e) {
  e.preventDefault();
  const { api } = await import('./api.js');
  await api.post('/api/logout');
  await reloadApp();
  toast('ログアウトしました');
  navigate('/');
}

export async function reloadApp() {
  await loadBootstrap();
  renderChrome();
}

// サイト内リンクはページを読み直さずに切り替える
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[href]');
  if (!a || a.target || a.hasAttribute('download')) return;
  const href = a.getAttribute('href');
  if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/api/') || href.startsWith('/uploads/')) return;
  e.preventDefault();
  if (href === location.pathname + location.search) { closeDrawer(); return; }
  navigate(href);
});
document.getElementById('drawer').addEventListener('click', (e) => { if (e.target.id === 'drawer') closeDrawer(); });
window.addEventListener('popstate', () => render({ keepScroll: false }));

(async function boot() {
  try {
    await loadBootstrap();
  } catch (err) {
    app.innerHTML = `<div class="loading"><p>サーバーに接続できませんでした。時間をおいて再読み込みしてください。</p></div>`;
    return;
  }
  renderChrome();
  render();
})();
