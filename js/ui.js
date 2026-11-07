// 画面の部品(選手カード・スコアボードなど)と、表示用の小さな道具
import { state } from './api.js';

// ---------- 文字・数字の整形 ----------
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const nl2br = (s) => esc(s).replace(/\n/g, '<br>');

export const fmt = {
  avg: (v) => (v == null ? '-' : v >= 1 ? v.toFixed(3) : v.toFixed(3).replace(/^0/, '')),
  era: (v) => (v == null ? '-' : v.toFixed(2)),
  dec2: (v) => (v == null ? '-' : v.toFixed(2)),
  pct: (v) => (v == null ? '-' : v >= 1 ? '1.000' : v.toFixed(3).replace(/^0/, '')),
  int: (v) => (v == null ? '-' : String(v)),
  by: (format, v) => (format === 'avg' ? fmt.avg(v) : format === 'era' ? fmt.era(v) : fmt.int(v)),
  gb: (v) => (v == null ? '-' : v === 0 ? '-' : v.toFixed(1)),
};

const DOW_JA = ['日', '月', '火', '水', '木', '金', '土'];
const DOW_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const parseDate = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
export const date = {
  md: (s) => { const d = parseDate(s); return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`; },
  dot: (s) => (s ? s.replace(/-/g, '.') : ''),
  dowJa: (s) => DOW_JA[parseDate(s).getDay()],
  dowEn: (s) => DOW_EN[parseDate(s).getDay()],
  full: (s) => { if (!s) return ''; const d = parseDate(s); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${DOW_JA[d.getDay()]})`; },
  month: (ym) => `${Number(ym.slice(5, 7))}月`,
  age: (s) => {
    if (!s) return null;
    const b = parseDate(s); const t = parseDate(state.today);
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  },
};

// ---------- 能力値 ----------
export const ABILITIES = [
  ['meet', 'ミート'], ['power', 'パワー'], ['speed', '走力'], ['fielding', '守備力'], ['arm', '肩力'],
];
export function grade(v) {
  return v >= 90 ? 'S' : v >= 80 ? 'A' : v >= 70 ? 'B' : v >= 60 ? 'C' : v >= 50 ? 'D' : v >= 40 ? 'E' : v >= 20 ? 'F' : 'G';
}
export const overall = (p) => Math.round(ABILITIES.reduce((s, [k]) => s + Number(p[k] || 0), 0) / ABILITIES.length);
export const tier = (ovr) => (ovr >= 75 ? 'gold' : ovr >= 65 ? 'red' : 'black');

const POS_SHORT = { 投手: '投', 捕手: '捕', 一塁手: '一', 二塁手: '二', 三塁手: '三', 遊撃手: '遊', 左翼手: '左', 中堅手: '中', 右翼手: '右', 内野手: '内', 外野手: '外' };
export const posShort = (pos) => POS_SHORT[pos] || (pos || '-').slice(0, 2);
export const POSITIONS = ['投手', '捕手', '一塁手', '二塁手', '三塁手', '遊撃手', '左翼手', '中堅手', '右翼手', '内野手', '外野手', 'DP', 'FP'];
export const posGroup = (pos) => (pos === '投手' ? 'pitcher' : pos === '捕手' ? 'catcher' : ['一塁手', '二塁手', '三塁手', '遊撃手', '内野手'].includes(pos) ? 'infield' : ['左翼手', '中堅手', '右翼手', '外野手'].includes(pos) ? 'outfield' : 'other');
export const isPitcher = (p) => p.position === '投手';
// 投げ・打ちの手。分からないときは「未登録」
export const handText = (p) => (p.throws || p.bats ? `${p.throws || '-'}投${p.bats || '-'}打` : '未登録');

// ---------- 画像 ----------
export const logoSrc = () => state.settings.logo || '/img/logo.svg';
const svgUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// 写真がない選手用の仮画像(シルエット + 背番号)
export function placeholderPlayer(p = {}) {
  const num = esc(p.number ?? '');
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a31"/><stop offset="1" stop-color="#0c0c0f"/></linearGradient>
    <linearGradient id="sil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#55555f"/><stop offset="1" stop-color="#1a1a20"/></linearGradient>
    <radialGradient id="glow" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="#d6182d" stop-opacity=".5"/><stop offset="1" stop-color="#d6182d" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="300" height="300" fill="url(#bg)"/>
  <rect width="300" height="300" fill="url(#glow)"/>
  <text x="150" y="215" font-family="Oswald, Arial Black, sans-serif" font-weight="700" font-size="180" text-anchor="middle" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="2">${num}</text>
  <path d="M42 300 C44 228 92 196 150 196 C208 196 256 228 258 300 Z" fill="url(#sil)"/>
  <rect x="128" y="160" width="44" height="48" rx="12" fill="#3a3a43"/>
  <circle cx="150" cy="122" r="54" fill="url(#sil)"/>
  <path d="M94 114 Q96 54 150 52 Q204 54 206 114 Q150 94 94 114 Z" fill="#b5162a"/>
  <path d="M92 112 Q150 92 230 118 L234 127 Q150 103 90 122 Z" fill="#8e0d1c"/>
  <text x="150" y="93" font-family="serif" font-weight="800" font-size="24" text-anchor="middle" fill="#f4f2ec">鬼</text>
</svg>`);
}

export function placeholderPhoto(label = 'PHOTO') {
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#16161b"/><path d="M0 300 L160 120 L260 220 L320 160 L400 260 L400 300Z" fill="#26262e"/><circle cx="300" cy="80" r="30" fill="#d6182d" opacity=".6"/><text x="200" y="160" font-family="Oswald, sans-serif" font-size="22" letter-spacing="6" fill="#6d6d78" text-anchor="middle">${esc(label)}</text></svg>`);
}

export const photoOf = (p) => (p?.photo ? esc(p.photo) : placeholderPlayer(p));

// ---------- アイコン ----------
export const icons = {
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.3-8.3L2 3h6.3l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 21v-8M12 21V4M19 21v-12"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  trophy: '<svg class="trophy" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V18h3v3H8v-3h3v-3.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3zm0 4H6v1a2 2 0 0 0 1 1.7V7zm10 0v2.7A2 2 0 0 0 18 8V7h-1z"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="26" height="26" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
};

// ---------- 部品 ----------
export function sectionHead(en, jp, link) {
  const words = esc(en).split(' ');
  const enHtml = words.length > 1 ? `${words.slice(0, -1).join(' ')} <em>${words[words.length - 1]}</em>` : words[0];
  return `<div class="section-head" data-reveal>
    <div><div class="eyebrow">${enHtml}</div><h2>${esc(jp)}</h2></div>
    ${link ? `<a class="link-more" href="${link[0]}">${esc(link[1] || 'VIEW ALL')}</a>` : ''}
  </div>`;
}

export function pageHero(en, title, lead = '', crumbs = []) {
  const photo = state.settings?.page_image;
  return `<section class="page-hero ${photo ? 'has-photo' : ''}" ${photo ? `style="--page-photo:url('${esc(photo)}')"` : ''}>
    <div class="bg-word">${esc(en)}</div>
    <div class="container" style="position:relative">
      <nav class="breadcrumb"><a href="/">HOME</a>${crumbs.map(([h, t]) => `<span>${h ? `<a href="${h}">${esc(t)}</a>` : esc(t)}</span>`).join('')}</nav>
      <div class="kicker">${esc(en)}</div>
      <h1>${esc(title)}</h1>
      ${lead ? `<p class="lead">${lead}</p>` : ''}
    </div>
  </section>`;
}

export const empty = (msg) => `<div class="empty">${msg}</div>`;

export function seasonSelect(currentId, id = 'season-select') {
  return `<select class="select" id="${id}" aria-label="シーズン">
    ${state.seasons.map((s) => `<option value="${s.id}" ${s.id === currentId ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
  </select>`;
}

export function playerCard(p, opts = {}) {
  const ovr = overall(p);
  const t = tier(ovr);
  const pitcher = isPitcher(p);
  let stats;
  if (pitcher) {
    const s = p.pitching || {};
    stats = [['防御率', fmt.era(s.era)], ['勝利', fmt.int(s.w ?? 0)], ['奪三振', fmt.int(s.so ?? 0)]];
  } else {
    const s = p.batting || {};
    stats = [['打率', fmt.avg(s.avg)], ['本塁打', fmt.int(s.hr ?? 0)], ['打点', fmt.int(s.rbi ?? 0)]];
  }
  const tag = opts.link === false ? 'div' : 'a';
  return `<div class="pcard-wrap" ${opts.reveal !== false ? 'data-reveal' : ''}>
    <${tag} class="pcard tier-${t}" ${tag === 'a' ? `href="/players/${p.id}"` : ''} data-tilt aria-label="${esc(p.name)} 選手カード">
      <div class="pc-stripes"></div>
      <div class="pc-num">${esc(p.number)}</div>
      <div class="pc-photo"><img src="${photoOf(p)}" alt="" loading="lazy"></div>
      <div class="pc-top">
        <div class="pc-ovr"><small>#</small>${esc(p.number || '--')}</div>
        <div class="pc-avg"><b>${p.batting?.avg == null ? '.---' : fmt.avg(p.batting.avg)}</b><span>打率</span></div>
        ${p.position ? `<div class="pc-pos">${esc(posShort(p.position))}</div>` : ''}
      </div>
      <div class="pc-emblem"><img src="${logoSrc()}" alt=""></div>
      ${p.role ? `<div class="pc-role">${esc(p.role)}</div>` : ''}
      <div class="pc-body">
        <div class="pc-nameplate">
          <div class="pc-name">${esc(p.name)}</div>
          <div class="pc-en">${esc(p.name_en || '')}</div>
        </div>
        <div class="pc-abil">
          ${ABILITIES.map(([k, l]) => `<div><span>${l}</span><span><b>${p[k]}</b><span class="g g-${grade(p[k])}">${grade(p[k])}</span></span></div>`).join('')}
          <div><span>投/打</span><span><b style="font-family:var(--font-jp);font-size:4.4cqw">${esc(handText(p))}</b></span></div>
        </div>
        <div class="pc-stats">${stats.map(([l, v]) => `<div><span>${l}</span><b>${v}</b></div>`).join('')}</div>
      </div>
    </${tag}>
  </div>`;
}

export function abilityList(p) {
  return `<div class="abil-list">${ABILITIES.map(([k, l]) => `
    <div class="abil-row"><span class="lbl">${l}</span>
      <div class="abil-bar"><i data-w="${p[k]}"></i></div>
      <span class="val">${p[k]}<span class="g g-${grade(p[k])}">${grade(p[k])}</span></span>
    </div>`).join('')}</div>`;
}

export function radarSvg(p, dark = true) {
  const cx = 150, cy = 150, R = 110;
  const pt = (i, r) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const ring = (f) => ABILITIES.map((_, i) => pt(i, R * f).join(',')).join(' ');
  const shape = ABILITIES.map(([k], i) => pt(i, (R * Number(p[k] || 0)) / 100).join(',')).join(' ');
  const line = dark ? 'rgba(255,255,255,.12)' : '#e2dfd6';
  const txt = dark ? '#f4f2ec' : '#15151a';
  return `<svg viewBox="0 0 300 300" role="img" aria-label="能力値チャート">
    ${[1, 0.75, 0.5, 0.25].map((f) => `<polygon points="${ring(f)}" fill="none" stroke="${line}"/>`).join('')}
    ${ABILITIES.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${pt(i, R)[0]}" y2="${pt(i, R)[1]}" stroke="${line}"/>`).join('')}
    <polygon class="radar-shape" points="${shape}" fill="rgba(214,24,45,.35)" stroke="#d6182d" stroke-width="2.5" style="transform-origin:150px 150px"/>
    ${ABILITIES.map(([k, l], i) => { const [x, y] = pt(i, R + 26); return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="700" fill="${txt}">${l}</text><text x="${x}" y="${y + 16}" text-anchor="middle" font-size="12" font-family="Oswald" fill="#c9a24d">${p[k]}</text>`; }).join('')}
  </svg>`;
}

export function resultBadge(g) {
  if (g.status === 'canceled') return '<span class="badge badge-canceled">中止</span>';
  if (g.status !== 'final') return '<span class="badge badge-sched">予定</span>';
  return { win: '<span class="badge badge-win">勝</span>', loss: '<span class="badge badge-loss">敗</span>', draw: '<span class="badge badge-draw">分</span>' }[g.result] || '';
}

export function gameRow(g) {
  const typeTag = `<span class="tag ${g.game_type === '公式戦' ? 'tag-official' : ''}">${esc(g.game_type)}</span>`;
  const score = g.status === 'final' ? `<span class="score">${g.our_score} - ${g.opp_score}</span>` : g.time ? `<span class="num" style="font-size:18px">${esc(g.time)}</span>` : '';
  return `<a class="game-row ${g.result ? 'res-' + g.result : ''}" href="/games/${g.id}">
    <div class="gr-date"><b>${date.md(g.date)}</b><span>${date.dowEn(g.date)}</span></div>
    <div class="gr-main">
      <div class="opp">vs ${esc(g.opponent)}</div>
      <div class="meta">${typeTag}<span>${esc(g.venue || '会場未定')}</span><span>${g.batting_first ? '先攻' : '後攻'}</span>${g.mvp_name ? `<span>MVP: ${esc(g.mvp_name)}</span>` : ''}</div>
    </div>
    <div class="gr-score">${score}${resultBadge(g)}</div>
  </a>`;
}

export function lineScore(g, totals, light = false) {
  const n = g.innings || 7;
  const cols = Array.from({ length: n }, (_, i) => i + 1);
  const cell = (line, i) => { const v = line[i]; return v === undefined || v === null ? '' : esc(v); };
  const team = state.settings.team_name;
  const ours = { name: team, line: g.our_line, r: g.our_score, h: totals?.our_hits, e: g.our_errors, self: true };
  const opp = { name: g.opponent, line: g.opp_line, r: g.opp_score, h: totals?.opp_hits, e: g.opp_errors };
  const rows = g.batting_first ? [ours, opp] : [opp, ours];
  return `<div class="linescore-wrap ${light ? 'light' : ''}"><table class="linescore">
    <thead><tr><th></th>${cols.map((c) => `<th>${c}</th>`).join('')}<th>R</th><th>H</th><th>E</th></tr></thead>
    <tbody>${rows.map((r) => `<tr class="${r.self ? 'self' : ''}"><td class="team">${esc(r.name)}</td>${cols.map((_, i) => `<td>${cell(r.line, i)}</td>`).join('')}
      <td class="rhe r">${r.r ?? '-'}</td><td class="rhe">${r.h ?? '-'}</td><td class="rhe">${r.e ?? '-'}</td></tr>`).join('')}</tbody>
  </table></div>`;
}

export function form5(list = []) {
  const ch = { win: '勝', loss: '敗', draw: '分' };
  return `<span class="form5">${list.map((r) => `<i class="${r}">${ch[r]}</i>`).join('')}</span>`;
}

// 動画のURLから埋め込み方法を決める(YouTube / Instagram / アップロードした動画)
export function videoInfo(url) {
  const u = String(url || '');
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return { kind: 'youtube', id: m[1], embed: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1`, thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` };
  m = u.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/);
  if (m) return { kind: 'instagram', embed: `https://www.instagram.com/${m[1]}/${m[2]}/embed`, thumb: null };
  return { kind: 'file', src: u, thumb: null };
}

// ---------- 通知・ダイアログ ----------
export function toast(msg, isErr = false) {
  const el = document.createElement('div');
  el.className = `toast ${isErr ? 'err' : ''}`;
  el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, isErr ? 5000 : 2600);
}

export function openModal({ title, body, foot = '', wide = false, onClose }) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-head"><h2>${esc(title)}</h2><button class="x-btn" data-close aria-label="閉じる">×</button></div>
    <div class="modal-body">${body}</div>
    ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
  </div>`;
  const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); onClose?.(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
  wrap.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
  document.addEventListener('keydown', onKey);
  document.body.appendChild(wrap);
  return { el: wrap.querySelector('.modal'), close };
}

export function confirmDialog(message, okLabel = 'OK', danger = true) {
  return new Promise((resolve) => {
    let answered = false;
    const m = openModal({
      title: '確認',
      body: `<p style="margin:0">${nl2br(message)}</p>`,
      foot: `<button class="btn btn-ghost" data-close>やめる</button><button class="btn ${danger ? 'btn-primary' : 'btn-gold'}" data-ok>${esc(okLabel)}</button>`,
      onClose: () => { if (!answered) resolve(false); },
    });
    m.el.querySelector('[data-ok]').addEventListener('click', () => { answered = true; resolve(true); m.close(); });
  });
}

// ---------- 動き ----------
let revealObserver;
export function initMotion(root) {
  revealObserver ??= new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      e.target.querySelectorAll('[data-w]').forEach((b) => { b.style.width = `${b.dataset.w}%`; });
      e.target.querySelectorAll('[data-count]').forEach(countUp);
      revealObserver.unobserve(e.target);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  root.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));
  // data-reveal の外にあるバーもアニメーション
  requestAnimationFrame(() => {
    root.querySelectorAll('[data-w]').forEach((b) => { if (!b.closest('[data-reveal]')) b.style.width = `${b.dataset.w}%`; });
    root.querySelectorAll('[data-count]').forEach((el) => { if (!el.closest('[data-reveal]')) countUp(el); });
  });
  root.querySelectorAll('[data-tilt]').forEach(bindTilt);
}

function countUp(el) {
  const target = Number(el.dataset.count);
  const decimals = Number(el.dataset.decimals || 0);
  if (!Number.isFinite(target)) return;
  const start = performance.now();
  const dur = 1000;
  const step = (t) => {
    const k = Math.min(1, (t - start) / dur);
    const v = target * (1 - Math.pow(1 - k, 3));
    el.textContent = decimals ? v.toFixed(decimals) : Math.round(v);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function bindTilt(card) {
  if (matchMedia('(hover: none)').matches) return;
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    card.style.setProperty('--mx', `${x * 100}%`);
    card.style.setProperty('--my', `${y * 100}%`);
    card.style.setProperty('--ry', `${(x - 0.5) * 14}deg`);
    card.style.setProperty('--rx', `${(0.5 - y) * 14}deg`);
  });
  card.addEventListener('mouseleave', () => {
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  });
}

// テーブルの見出しをクリックして並べ替え
export function sortableTable(table, rows, renderRows, initial) {
  let sortKey = initial?.key;
  let dir = initial?.dir || 'desc';
  const apply = () => {
    const sorted = rows.slice();
    if (sortKey) {
      sorted.sort((a, b) => {
        const va = a[sortKey], vb = b[sortKey];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        return dir === 'asc' ? va - vb : vb - va;
      });
    }
    table.querySelector('tbody').innerHTML = renderRows(sorted);
    table.querySelectorAll('th[data-sort]').forEach((th) => th.classList.toggle('sorted', th.dataset.sort === sortKey));
  };
  table.querySelectorAll('th[data-sort]').forEach((th) => {
    th.classList.add('sortable');
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (sortKey === k) dir = dir === 'desc' ? 'asc' : 'desc';
      else { sortKey = k; dir = th.dataset.dir || 'desc'; }
      apply();
    });
  });
  apply();
}
