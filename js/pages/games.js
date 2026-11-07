// 試合日程・結果、試合詳細ページ
import { api, state } from '../api.js';
import { esc, fmt, date, pageHero, gameRow, lineScore, empty, seasonSelect, photoOf, nl2br, resultBadge, form5 } from '../ui.js';

export async function list({ query, navigate }) {
  const d = await api.get(`/api/games?season=${query.season || ''}`);
  const tab = ['schedule', 'results', 'all'].includes(query.tab) ? query.tab : 'all';
  let games = d.games;
  if (tab === 'schedule') games = games.filter((g) => g.status === 'scheduled');
  if (tab === 'results') games = games.filter((g) => g.status !== 'scheduled').reverse();
  const byMonth = [];
  for (const g of games) {
    const m = g.date.slice(0, 7);
    if (!byMonth.length || byMonth[byMonth.length - 1][0] !== m) byMonth.push([m, []]);
    byMonth[byMonth.length - 1][1].push(g);
  }
  const r = d.record;
  const qs = (patch) => { const q = new URLSearchParams({ ...query, ...patch }); if (q.get('tab') === 'all') q.delete('tab'); const s = q.toString(); return `/games${s ? '?' + s : ''}`; };

  const html = `${pageHero('GAMES', '試合日程・結果', '今後の試合予定と、これまでの試合結果。試合をクリックするとスコアボードと個人成績が見られます。', [[null, '試合日程・結果']])}
  <section class="section section--light">
    <div class="container">
      ${r ? `<div class="stat-tiles" style="margin-bottom:32px" data-reveal>
        ${[['試合', r.g], ['勝', r.w], ['敗', r.l], ['分', r.d], ['勝率', fmt.pct(r.pct)], ['得点', r.rs], ['失点', r.ra]].map(([l, v]) => `<div class="tile"><div class="tile-label">${l}</div><div class="tile-value">${v}</div></div>`).join('')}
        <div class="tile"><div class="tile-label">直近5試合</div><div style="margin-top:8px">${form5(r.last5)}</div></div>
      </div>` : ''}
      <div class="toolbar">
        <div class="tabs" style="margin:0;border:0">
          ${[['all', 'すべて'], ['schedule', '今後の日程'], ['results', '試合結果']].map(([k, l]) => `<a class="tab ${tab === k ? 'active' : ''}" href="${qs({ tab: k })}">${l}</a>`).join('')}
        </div>
        <span class="spacer"></span>${seasonSelect(d.season?.id)}
      </div>
      ${byMonth.length ? byMonth.map(([m, list]) => `
        <div style="margin-top:28px" data-reveal>
          <h3 class="en" style="font-size:28px;font-weight:700;margin-bottom:12px;display:flex;align-items:baseline;gap:10px">${Number(m.slice(5))}<small style="font-size:13px;letter-spacing:.2em;color:var(--text-2)">${m.slice(0, 4)} / ${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][Number(m.slice(5)) - 1]}</small></h3>
          ${list.map(gameRow).join('')}
        </div>`).join('') : empty('該当する試合はありません')}
    </div>
  </section>`;
  return {
    title: '試合日程・結果',
    html,
    mount: (root) => root.querySelector('#season-select')?.addEventListener('change', (e) => navigate(qs({ season: e.target.value }), { keepScroll: true })),
  };
}

export async function detail({ params }) {
  const d = await api.get(`/api/games/${params.id}`);
  const g = d.game;
  const team = state.settings.team_name;
  const final = g.status === 'final';
  const resultText = { win: 'WIN', loss: 'LOSE', draw: 'DRAW' }[g.result] || (g.status === 'canceled' ? 'CANCELED' : 'UPCOMING');
  const t = d.totals;

  const batting = d.batting.length ? `<div class="table-wrap"><table class="tbl">
    <thead><tr><th class="c">打順</th><th class="c">守備</th><th class="l">選手</th><th>打数</th><th>安打</th><th>二塁打</th><th>三塁打</th><th>本塁打</th><th>打点</th><th>得点</th><th>盗塁</th><th>四球</th><th>死球</th><th>犠打</th><th>犠飛</th><th>三振</th></tr></thead>
    <tbody>${d.batting.map((r) => `<tr><td class="c">${r.batting_order ?? ''}</td><td class="c l">${esc(r.position)}</td>
      <td class="name"><small>${esc(r.number)}</small><a href="/players/${r.player_id}">${esc(r.name)}</a></td>
      <td>${r.ab}</td><td class="${r.h >= 2 ? 'hl' : ''}">${r.h}</td><td>${r.d2}</td><td>${r.d3}</td><td class="${r.hr ? 'hl' : ''}">${r.hr}</td><td>${r.rbi}</td><td>${r.r}</td><td>${r.sb}</td><td>${r.bb}</td><td>${r.hbp}</td><td>${r.sac}</td><td>${r.sf}</td><td>${r.so}</td></tr>`).join('')}
      <tr class="total"><td></td><td></td><td class="l">合計</td>${['ab', 'h', 'd2', 'd3', 'hr', 'rbi', 'r', 'sb', 'bb', 'hbp', 'sac', 'sf', 'so'].map((k) => `<td>${t.batting[k]}</td>`).join('')}</tr>
    </tbody></table></div>` : empty('個人成績はまだ登録されていません');

  const pitching = d.pitching.length ? `<div class="table-wrap"><table class="tbl">
    <thead><tr><th class="l">投手</th><th class="c">勝敗</th><th>投球回</th><th>被安打</th><th>奪三振</th><th>与四球</th><th>失点</th><th>自責点</th></tr></thead>
    <tbody>${d.pitching.map((r) => `<tr><td class="name"><small>${esc(r.number)}</small><a href="/players/${r.player_id}">${esc(r.name)}</a></td>
      <td class="c l">${r.win ? '<b style="color:var(--red)">勝</b>' : r.loss ? '敗' : r.save ? 'S' : ''}</td><td>${r.ip_text}</td><td>${r.h}</td><td>${r.so}</td><td>${r.bb}</td><td>${r.r}</td><td>${r.er}</td></tr>`).join('')}
      <tr class="total"><td class="l">合計</td><td></td><td>${t.pitching.ip_text}</td><td>${t.pitching.h}</td><td>${t.pitching.so}</td><td>${t.pitching.bb}</td><td>${t.pitching.r}</td><td>${t.pitching.er}</td></tr>
    </tbody></table></div>` : '';

  const html = `
  <section class="page-hero" style="padding-bottom:40px">
    <div class="bg-word">${resultText}</div>
    <div class="container" style="position:relative">
      <nav class="breadcrumb"><a href="/">HOME</a><span><a href="/games">試合日程・結果</a></span><span>vs ${esc(g.opponent)}</span></nav>
      <div class="rh-head"><span>${date.full(g.date)} ${esc(g.time)}　${esc(g.venue || '会場未定')}</span><span class="tag" style="color:var(--gold-2);border-color:var(--gold)">${esc(g.game_type)}</span></div>
      <div class="rh-score" data-reveal>
        <div class="rh-team">${esc(team)}<div class="muted" style="font-size:13px;font-weight:500">${g.batting_first ? '先攻' : '後攻'}</div></div>
        ${final ? `<div class="rh-nums"><span class="${g.result === 'win' ? 'win' : ''}" data-count="${g.our_score}">0</span><span class="sep">-</span><span class="${g.result === 'loss' ? 'win' : ''}" data-count="${g.opp_score}">0</span></div>`
          : `<div style="text-align:center">${resultBadge(g)}<div class="num" style="font-size:40px;margin-top:6px">${esc(g.time || '--:--')}</div></div>`}
        <div class="rh-team right">${esc(g.opponent)}<div class="muted" style="font-size:13px;font-weight:500">${g.batting_first ? '後攻' : '先攻'}</div></div>
      </div>
      ${final ? `<div data-reveal>${lineScore(g, d.totals)}</div>` : ''}
    </div>
  </section>

  ${d.mvp ? `<section class="section section--dark2" style="padding:40px 0">
    <div class="container">
      <a href="/players/${d.mvp.id}" class="result-hero" style="display:grid;grid-template-columns:120px 1fr;gap:24px;align-items:center;border-color:var(--gold)" data-reveal>
        <img src="${photoOf(d.mvp)}" alt="" style="width:120px;height:150px;object-fit:cover;border:1px solid var(--gold);position:relative">
        <div style="position:relative">
          <div class="en" style="color:var(--gold-2);letter-spacing:.3em;font-size:13px">GAME MVP</div>
          <div style="font-size:30px;font-weight:900">${esc(d.mvp.name)}</div>
          <div class="muted">#${esc(d.mvp.number)} ${esc(d.mvp.position)}</div>
        </div>
      </a>
    </div>
  </section>` : ''}

  <section class="section section--light">
    <div class="container">
      ${g.summary ? `<div class="card" style="margin-bottom:36px" data-reveal><h3>試合レポート</h3><p style="margin:0">${nl2br(g.summary)}</p></div>` : ''}
      ${final ? `<div class="section-head"><div><div class="eyebrow">Box <em>Score</em></div><h2>打撃成績</h2></div></div>
      ${batting}
      ${pitching ? `<div class="section-head" style="margin-top:48px"><div><div class="eyebrow">Pitching</div><h2>投手成績</h2></div></div>${pitching}` : ''}`
      : `<div class="empty">試合終了後に結果と個人成績が掲載されます</div>`}
      ${d.photos.length ? `<div class="section-head" style="margin-top:48px"><div><div class="eyebrow">Photos</div><h2>この試合の写真</h2></div><a class="link-more" href="/gallery">GALLERY</a></div>
        <div class="grid grid-3">${d.photos.filter((p) => p.media_type === 'photo').map((p) => `<a href="/gallery"><img src="${esc(p.url)}" alt="${esc(p.title)}" style="width:100%;aspect-ratio:4/3;object-fit:cover"></a>`).join('')}</div>` : ''}
      <p style="margin-top:40px"><a class="link-more" href="/games">試合一覧へ戻る</a></p>
    </div>
  </section>`;
  return { title: `vs ${g.opponent}（${date.dot(g.date)}）`, html };
}
