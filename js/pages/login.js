// ログイン
import { api, state, isAdmin } from '../api.js';
import { esc, logoSrc, toast } from '../ui.js';

export async function login({ query, navigate, reloadApp }) {
  if (state.me) {
    return { title: 'ログイン', html: '', mount: () => navigate(isAdmin() ? '/admin' : '/mypage', { replace: true }) };
  }
  const html = `<section class="auth-wrap dark">
    <form class="auth-card" id="login-form" autocomplete="on">
      <img src="${logoSrc()}" alt="" style="width:64px;height:64px;border-radius:50%;margin-bottom:18px">
      <div class="en" style="color:var(--gold-2);letter-spacing:.3em;font-size:12px">MEMBERS LOGIN</div>
      <h1>選手・管理者ログイン</h1>
      <p class="muted" style="font-size:13px;margin-bottom:24px">ログインIDとパスワードは管理者から受け取ってください。</p>
      <div id="login-error"></div>
      <div class="f-field"><label for="login_id">ログインID</label><input id="login_id" name="login_id" autocomplete="username" required></div>
      <div class="f-field"><label for="password">パスワード</label><input id="password" name="password" type="password" autocomplete="current-password" required></div>
      <button class="btn btn-primary btn-block" type="submit" style="margin-top:8px;padding:14px">ログイン</button>
      <p style="margin:20px 0 0;text-align:center"><a class="link-more" href="/">サイトに戻る</a></p>
    </form>
  </section>`;
  return {
    title: 'ログイン',
    html,
    mount: (root) => {
      const form = root.querySelector('#login-form');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type=submit]');
        btn.disabled = true;
        try {
          await api.post('/api/login', { login_id: form.login_id.value.trim(), password: form.password.value });
          await reloadApp();
          toast(`ようこそ、${state.me.display_name || state.me.login_id} さん`);
          const next = query.next && query.next.startsWith('/') && !query.next.startsWith('//') ? query.next : isAdmin() ? '/admin' : '/mypage';
          navigate(next, { replace: true });
        } catch (err) {
          root.querySelector('#login-error').innerHTML = `<div class="form-error">${esc(err.message)}</div>`;
          btn.disabled = false;
        }
      });
    },
  };
}
