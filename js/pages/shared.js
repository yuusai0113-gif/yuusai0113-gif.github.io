// 複数のページで使う成績まわりの部品
import { state } from '../api.js';
import { esc, fmt, photoOf, date } from '../ui.js';

export function leaderCard(cat, list) {
  const top = list[0];
  const en = { avg: 'BATTING AVG', hr: 'HOME RUNS', rbi: 'RBI', sb: 'STOLEN BASES', h: 'HITS', era: 'ERA', w: 'WINS', so: 'STRIKEOUTS', sv: 'SAVES' }[cat.key] || '';
  return `<div class="leader-card" data-reveal>
    <div class="lc-head"><span class="t">${esc(cat.title)}</span><span class="en">${en}</span></div>
    ${top ? `<a class="lc-top" href="/players/${top.player_id}">
        <img src="${photoOf(top.player)}" alt="">
        <div class="who"><div class="no">#${esc(top.player.number)} ${esc(top.player.position)}</div><div class="nm">${esc(top.player.name)}</div></div>
        <div class="val">${fmt.by(cat.format, top.value)}</div>
      </a>
      <ol class="lc-list">${list.slice(1, 5).map((e) => `<li><span class="rk">${e.rank}</span><a href="/players/${e.player_id}">${esc(e.player.name)}</a><span class="v">${fmt.by(cat.format, e.value)}</span></li>`).join('')}</ol>`
      : `<div class="lc-empty">${cat.rate ? '規定に到達した選手がまだいません' : 'まだ記録がありません'}</div>`}
  </div>`;
}

// タイトル争い(1位との差をバーで見せる)
export function raceBlock(cat, list, qual) {
  const rows = list.slice(0, 5);
  if (!rows.length) {
    return `<div class="race" data-reveal><div class="race-head"><div class="t">${esc(cat.title)}争い<small>${esc(cat.label)}</small></div></div>
      <p class="muted" style="margin:0;font-size:13px">${cat.rate ? '規定に到達した選手がまだいません' : 'まだ記録がありません'}</p></div>`;
  }
  const best = rows[0].value;
  const width = (v) => {
    if (cat.order === 'asc') return v > 0 ? Math.max(8, Math.min(100, (best / v) * 100)) : 100;
    return best > 0 ? Math.max(4, (v / best) * 100) : 0;
  };
  const second = list.find((e) => e.rank > 1);
  let gap = '';
  if (second) {
    const d = Math.abs(second.value - best);
    const dv = cat.format === 'avg' ? fmt.avg(d).replace(/^\./, '0.') : cat.format === 'era' ? d.toFixed(2) : d;
    gap = `2位 ${esc(second.player.name)} との差: <b>${dv}</b>`;
  } else if (rows.length > 1) gap = '首位タイで並んでいます';
  const note = cat.rate ? (cat.format === 'era' ? `規定投球回 ${qual.reqIpText}` : `規定打席 ${qual.reqPA}`) : '';
  return `<div class="race" data-reveal>
    <div class="race-head"><div class="t">${esc(cat.title)}争い<small>${esc(cat.label).toUpperCase()}</small></div><span class="note">${note}</span></div>
    ${rows.map((e) => `<div class="race-row ${e.rank === 1 ? 'first' : ''}">
      <span class="rk">${e.rank}</span><a class="nm" href="/players/${e.player_id}">${esc(e.player.name)}</a>
      <div class="bar"><i data-w="${width(e.value).toFixed(1)}"></i></div><span class="v">${fmt.by(cat.format, e.value)}</span></div>`).join('')}
    ${gap ? `<div class="race-gap">${gap}</div>` : ''}
  </div>`;
}

export function standingsTable(st) {
  return `<div class="table-wrap"><table class="tbl standings">
    <thead><tr><th class="c">順位</th><th class="l">チーム</th><th>試合</th><th>勝</th><th>敗</th><th>分</th><th>勝率</th><th>差</th></tr></thead>
    <tbody>${st.rows.map((r) => `<tr class="${r.self ? 'self' : ''}">
      <td class="rank">${r.rank}</td><td class="team">${esc(r.name)}${r.self ? ' <span class="tag" style="border-color:var(--red);color:var(--red)">自チーム</span>' : ''}</td>
      <td>${r.g}</td><td>${r.w}</td><td>${r.l}</td><td>${r.d}</td><td class="${r.rank === 1 ? 'hl' : ''}">${fmt.pct(r.pct)}</td><td>${fmt.gb(r.gb)}</td></tr>`).join('')}</tbody>
  </table></div>`;
}

export function monthlyMvpBlock(m) {
  if (!m || !m.ranking.length) return '<div class="empty">まだ記録がありません</div>';
  const [top, ...rest] = m.ranking;
  return `<div class="card-dark" style="padding:0;overflow:hidden" data-reveal>
    <a href="/players/${top.player_id}" style="display:grid;grid-template-columns:110px 1fr;gap:18px;align-items:center;padding:20px;background:linear-gradient(120deg,#2b2210,#120e05)">
      <img src="${photoOf(top.player)}" alt="" style="width:110px;height:136px;object-fit:cover;border:1px solid var(--gold)">
      <div>
        <div class="en" style="color:var(--gold-2);letter-spacing:.24em;font-size:12px">${m.month.slice(0, 4)} ${date.month(m.month)} MVP</div>
        <div style="font-size:26px;font-weight:900;line-height:1.3">${esc(top.player.name)}</div>
        <div class="muted" style="font-size:13px">#${esc(top.player.number)} ${esc(top.player.position)}</div>
        <div class="num" style="font-size:30px;color:var(--gold-2);margin-top:6px">${top.points}<small style="font-size:13px;color:var(--text-d2)"> pt</small></div>
      </div>
    </a>
    <ol class="lc-list" style="padding:10px 20px 16px">${rest.map((e, i) => `<li><span class="rk">${i + 2}</span><a href="/players/${e.player_id}">${esc(e.player.name)}</a><span class="v">${e.points} pt</span></li>`).join('')}</ol>
  </div>`;
}

export const seasonName = (id) => state.seasons.find((s) => s.id === id)?.name || '';
