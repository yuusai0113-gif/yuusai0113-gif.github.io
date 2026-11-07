// チーム紹介
import { api, state } from '../api.js';
import { esc, nl2br, pageHero, placeholderPlayer, icons, empty } from '../ui.js';
import { igHandle } from './home.js';

export async function team() {
  const d = await api.get('/api/team');
  const s = state.settings;
  const history = String(s.history || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const i = l.indexOf('|');
    return i > 0 ? [l.slice(0, i), l.slice(i + 1)] : ['', l];
  });
  const html = `${pageHero('TEAM', 'チーム紹介', `${esc(s.team_name)}（${esc(s.team_name_en)}）は${esc(s.league_name)}に所属するソフトボールチームです。`, [[null, 'チーム紹介']])}
  <section class="section section--dark">
    <div class="container grid grid-2" style="gap:56px;align-items:start">
      <div>
        <div class="section-head"><div><div class="eyebrow">Our <em>Policy</em></div><h2>チーム方針</h2></div></div>
        <p style="font-size:clamp(22px,3vw,30px);font-weight:900;line-height:1.5;margin-bottom:20px" data-reveal>${esc(s.catchphrase)}</p>
        <p style="color:var(--text-d2)" data-reveal>${nl2br(s.policy)}</p>
        <div class="stat-tiles" style="margin-top:32px" data-reveal>
          <div class="tile"><div class="tile-label">創部</div><div class="tile-value">${esc(s.founded)}</div></div>
          <div class="tile"><div class="tile-label">在籍選手</div><div class="tile-value">${d.playerCount}<small style="font-size:14px">名</small></div></div>
          <div class="tile"><div class="tile-label">所属</div><div style="font-weight:900;margin-top:8px">${esc(s.league_name)}</div></div>
        </div>
      </div>
      <div>
        <div class="section-head"><div><div class="eyebrow">History</div><h2>チームの歴史</h2></div></div>
        ${history.length ? `<div class="timeline">${history.map(([y, t]) => `<div class="tl-item" data-reveal><div class="tl-year">${esc(y)}</div><div>${esc(t)}</div></div>`).join('')}</div>` : empty('未登録')}
      </div>
    </div>
  </section>

  <section class="section section--light">
    <div class="container">
      <div class="section-head"><div><div class="eyebrow">Staff</div><h2>監督・コーチ</h2></div></div>
      ${d.staff.length ? `<div class="grid grid-3">${d.staff.map((m) => `<div class="staff-card" data-reveal>
        <img src="${m.photo ? esc(m.photo) : placeholderPlayer({ number: '' })}" alt="">
        <div><div class="role">${esc(m.role)}</div><div class="nm">${esc(m.name)}</div><p class="muted" style="font-size:14px;margin:0">${nl2br(m.profile)}</p></div>
      </div>`).join('')}</div>` : empty('未登録')}
    </div>
  </section>

  <section class="section section--white">
    <div class="container grid grid-2" style="gap:40px">
      <div data-reveal>
        <div class="section-head"><div><div class="eyebrow">Field</div><h2>活動場所・活動日</h2></div></div>
        <div class="card">
          <h3>${esc(s.location_name)}</h3>
          <p class="muted">${esc(s.location_address)}</p>
          <p style="margin:0"><b>活動日：</b>${esc(s.practice_schedule)}</p>
          ${s.location_address ? `<a class="btn btn-ghost btn-sm" style="margin-top:16px" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.location_address)}">Googleマップで見る</a>` : ''}
        </div>
      </div>
      <div data-reveal>
        <div class="section-head"><div><div class="eyebrow">Contact</div><h2>お問い合わせ</h2></div></div>
        <div class="card">
          <p>${nl2br(s.contact)}</p>
          ${s.sns_instagram ? `<a class="btn btn-primary" href="${esc(s.sns_instagram)}" target="_blank" rel="noopener"><span style="width:18px;height:18px;display:inline-block">${icons.instagram}</span>@${esc(igHandle(s.sns_instagram))}</a>` : ''}
        </div>
      </div>
    </div>
  </section>

  ${s.recruit_open === '1' ? `<section class="section section--dark">
    <div class="container">
      <div class="recruit" data-reveal>
        <div class="en" style="letter-spacing:.3em;font-size:13px;opacity:.85">MEMBER WANTED</div>
        <h3>入団募集中</h3>
        <p style="max-width:620px;position:relative;z-index:1">${nl2br(s.recruit_text)}</p>
        ${s.sns_instagram ? `<a class="btn" style="background:#fff;color:var(--red);position:relative;z-index:1" href="${esc(s.sns_instagram)}" target="_blank" rel="noopener">Instagram のDMで問い合わせる</a>` : ''}
      </div>
    </div>
  </section>` : ''}`;
  return { title: 'チーム紹介', html };
}
