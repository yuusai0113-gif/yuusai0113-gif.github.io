// 個人成績・チーム成績・ランキング
import { api, state } from '../api.js';
import { esc, fmt, pageHero, empty, seasonSelect, sortableTable, date, photoOf, form5 } from '../ui.js';
import { raceBlock, leaderCard, standingsTable } from './shared.js';

const TABS = [['titles', 'タイトル争い'], ['batting', '打撃成績'], ['pitching', '投手成績'], ['ranking', 'ランキング'], ['team', 'チーム成績・順位表'], ['mvp', '月間MVP']];

export async function stats({ query, navigate }) {
  const d = await api.get(`/api/stats?season=${query.season || ''}`);
  if (!d.season) return { title: '成績', html: `${pageHero('STATS', '成績・ランキング')}<section class="section section--light"><div class="container">${empty('シーズンが登録されていません')}</div></section>` };
  const tab = TABS.some(([k]) => k === query.tab) ? query.tab : 'titles';
  const q = d.qualification;
  const cats = state.categories;
  const showAll = query.all === '1';
  const qs = (patch) => { const p = new URLSearchParams({ ...query, ...patch }); for (const [k, v] of [...p]) if (!v) p.delete(k); return `/stats?${p}`; };

  let body = '';
  if (tab === 'titles') {
    body = `<div class="grid grid-3">
      ${cats.batting.filter((c) => c.key !== 'h').map((c) => raceBlock(c, d.rankings.batting[c.key], q)).join('')}
      ${cats.pitching.filter((c) => ['w', 'era'].includes(c.key)).map((c) => raceBlock(c, d.rankings.pitching[c.key], q)).join('')}
      ${mvpRace(d.monthly[0])}
    </div>`;
  } else if (tab === 'ranking') {
    body = `<h3 class="en" style="font-size:22px;margin-bottom:14px">BATTING</h3><div class="leaders" style="margin-bottom:40px">${cats.batting.map((c) => leaderCard(c, d.rankings.batting[c.key])).join('')}</div>
      <h3 class="en" style="font-size:22px;margin-bottom:14px">PITCHING</h3><div class="leaders">${cats.pitching.map((c) => leaderCard(c, d.rankings.pitching[c.key])).join('')}</div>`;
  } else if (tab === 'batting') {
    body = `<div class="toolbar"><a class="chip ${showAll ? '' : 'active'}" href="${qs({ all: '' })}">規定打席到達者</a><a class="chip ${showAll ? 'active' : ''}" href="${qs({ all: '1' })}">全選手</a><span class="muted" style="font-size:13px">見出しをクリックで並べ替え</span></div>
      <div class="table-wrap"><table class="tbl" id="bat-table"><thead><tr>
        <th class="c">#</th><th class="l">選手</th>${[['g', '試合'], ['pa', '打席'], ['ab', '打数'], ['h', '安打'], ['d2', '二塁打'], ['d3', '三塁打'], ['hr', '本塁打'], ['rbi', '打点'], ['r', '得点'], ['sb', '盗塁'], ['bb', '四球'], ['so', '三振', 'asc'], ['avg', '打率'], ['obp', '出塁率'], ['slg', '長打率'], ['ops', 'OPS']].map(([k, l, dir]) => `<th data-sort="${k}" ${dir ? `data-dir="${dir}"` : ''}>${l}</th>`).join('')}
      </tr></thead><tbody></tbody></table></div>`;
  } else if (tab === 'pitching') {
    body = `<div class="toolbar"><a class="chip ${showAll ? '' : 'active'}" href="${qs({ all: '' })}">規定投球回到達者</a><a class="chip ${showAll ? 'active' : ''}" href="${qs({ all: '1' })}">全選手</a><span class="muted" style="font-size:13px">見出しをクリックで並べ替え</span></div>
      <div class="table-wrap"><table class="tbl" id="pit-table"><thead><tr>
        <th class="c">#</th><th class="l">選手</th>${[['g', '登板'], ['w', '勝'], ['l', '敗', 'asc'], ['sv', 'S'], ['outs', '投球回'], ['h', '被安打', 'asc'], ['so', '奪三振'], ['bb', '与四球', 'asc'], ['r', '失点', 'asc'], ['er', '自責点', 'asc'], ['era', '防御率', 'asc'], ['whip', 'WHIP', 'asc'], ['k_rate', '奪三振率'], ['wpct', '勝率']].map(([k, l, dir]) => `<th data-sort="${k}" ${dir ? `data-dir="${dir}"` : ''}>${l}</th>`).join('')}
      </tr></thead><tbody></tbody></table></div>`;
  } else if (tab === 'team') {
    const r = d.record;
    body = `<div class="stat-tiles" style="margin-bottom:32px">
        ${[['試合', r.g], ['勝', r.w], ['敗', r.l], ['分', r.d], ['勝率', fmt.pct(r.pct)], ['得点', r.rs], ['失点', r.ra], ['得失点差', (r.rs - r.ra > 0 ? '+' : '') + (r.rs - r.ra)]].map(([l, v]) => `<div class="tile"><div class="tile-label">${l}</div><div class="tile-value">${v}</div></div>`).join('')}
      </div>
      <p class="muted" style="font-size:13px">直近5試合 ${form5(r.last5)}　※ 上の数字は練習試合を含む全試合。順位表は公式戦（${d.officialRecord.w}勝${d.officialRecord.l}敗${d.officialRecord.d}分）のみで計算しています。</p>
      <div class="section-head" style="margin-top:40px"><div><div class="eyebrow">Standings</div><h2>${esc(state.settings.league_name)} 順位表</h2></div></div>
      ${d.standings.hasLeague ? standingsTable(d.standings) : empty('順位表に載せる他チームが登録されていません（管理画面 → シーズン から登録できます）')}`;
  } else if (tab === 'mvp') {
    body = `<p class="muted" style="font-size:13px">試合ごとの成績から「活躍ポイント」を自動計算し、毎月いちばんポイントが高い選手が月間MVPになります。</p>
      <div class="grid grid-3" style="margin-top:20px">${d.monthly.map((m) => mvpRace(m)).join('') || empty('まだ記録がありません')}</div>
      <div class="grid grid-2" style="margin-top:40px">
        <div><h3 style="font-size:16px;font-weight:900;margin-bottom:12px">シーズン活躍ポイント TOP10</h3>
          <div class="table-wrap"><table class="tbl"><thead><tr><th class="c">順位</th><th class="l">選手</th><th>試合MVP</th><th>ポイント</th></tr></thead><tbody>
          ${d.activity.map((a, i) => `<tr><td class="c">${i + 1}</td><td class="name"><a href="/players/${a.player_id}">${esc(a.player.name)}</a></td><td>${a.mvp}</td><td class="${i === 0 ? 'hl' : ''}">${a.points}</td></tr>`).join('')}
          </tbody></table></div></div>
        <div><h3 style="font-size:16px;font-weight:900;margin-bottom:12px">活躍ポイントの計算方法</h3>
          <div class="table-wrap"><table class="tbl"><tbody>${state.pointRules.map((r) => `<tr><td class="l">${esc(r.label)}</td><td>${r.pts > 0 ? '+' : ''}${r.pts}</td></tr>`).join('')}</tbody></table></div></div>
      </div>`;
  }

  const html = `${pageHero('STATS', '成績・ランキング', '試合ごとの個人成績から、打率・防御率・順位まですべて自動で計算しています。', [[null, '成績・ランキング']])}
  <section class="section section--light">
    <div class="container">
      <div class="toolbar" style="margin-bottom:8px">
        <span class="muted" style="font-size:13px">チーム試合数 <b class="num">${q.games}</b> ／ 規定打席 <b class="num">${q.reqPA}</b> ／ 規定投球回 <b class="num">${q.reqIpText}</b></span>
        <span class="spacer"></span>${seasonSelect(d.season.id)}
      </div>
      ${q.games === 0 ? `<div class="alert alert-info" style="margin:12px 0 20px">${esc(d.season.name)}の試合はまだありません。最初の試合の成績を入力すると、ここに打率やランキングが自動で表示されます。${prevSeasonLink(d.season.id)}</div>` : ''}
      <div class="tabs">${TABS.map(([k, l]) => `<a class="tab ${tab === k ? 'active' : ''}" href="${qs({ tab: k, all: '' })}">${l}</a>`).join('')}</div>
      ${tab === 'titles' || tab === 'mvp' ? `<div class="dark" style="background:var(--ink);padding:clamp(14px,3vw,28px);border-radius:4px">${body}</div>` : body}
    </div>
  </section>`;

  return {
    title: '成績・ランキング',
    html,
    mount: (root) => {
      root.querySelector('#season-select')?.addEventListener('change', (e) => navigate(qs({ season: e.target.value }), { keepScroll: true }));
      const bt = root.querySelector('#bat-table');
      if (bt) {
        const rows = d.batting.filter((r) => showAll || r.qualified);
        sortableTable(bt, rows, (list) => list.length ? list.map((r) => `<tr class="${r.qualified ? '' : 'unq'}"><td class="c">${esc(r.player.number)}</td><td class="name"><a href="/players/${r.player_id}">${esc(r.player.name)}</a></td>
          <td>${r.g}</td><td>${r.pa}</td><td>${r.ab}</td><td>${r.h}</td><td>${r.d2}</td><td>${r.d3}</td><td>${r.hr}</td><td>${r.rbi}</td><td>${r.r}</td><td>${r.sb}</td><td>${r.bb}</td><td>${r.so}</td>
          <td><b>${fmt.avg(r.avg)}</b></td><td>${fmt.avg(r.obp)}</td><td>${fmt.avg(r.slg)}</td><td>${fmt.avg(r.ops)}</td></tr>`).join('') : '<tr><td colspan="18" class="c l" style="padding:32px">該当する選手がいません</td></tr>', { key: 'avg', dir: 'desc' });
      }
      const pt = root.querySelector('#pit-table');
      if (pt) {
        const rows = d.pitching.filter((r) => showAll || r.qualified);
        sortableTable(pt, rows, (list) => list.length ? list.map((r) => `<tr class="${r.qualified ? '' : 'unq'}"><td class="c">${esc(r.player.number)}</td><td class="name"><a href="/players/${r.player_id}">${esc(r.player.name)}</a></td>
          <td>${r.g}</td><td>${r.w}</td><td>${r.l}</td><td>${r.sv}</td><td>${r.ip_text}</td><td>${r.h}</td><td>${r.so}</td><td>${r.bb}</td><td>${r.r}</td><td>${r.er}</td>
          <td><b>${fmt.era(r.era)}</b></td><td>${fmt.dec2(r.whip)}</td><td>${fmt.dec2(r.k_rate)}</td><td>${fmt.pct(r.wpct)}</td></tr>`).join('') : '<tr><td colspan="16" class="c l" style="padding:32px">該当する選手がいません</td></tr>', { key: 'era', dir: 'asc' });
      }
    },
  };
}

// 1つ前のシーズンへのリンク(新シーズンが始まる前の空っぽ表示のとき用)
function prevSeasonLink(currentId) {
  const cur = state.seasons.find((x) => x.id === currentId);
  const prev = state.seasons.filter((x) => cur && x.year < cur.year).sort((a, b) => b.year - a.year)[0];
  return prev ? ` <a href="/stats?season=${prev.id}" style="font-weight:700;text-decoration:underline">${esc(prev.name)}を見る</a>` : '';
}

function mvpRace(m) {
  if (!m) return '';
  const best = m.ranking[0]?.points || 1;
  return `<div class="race" data-reveal>
    <div class="race-head"><div class="t">${date.month(m.month)} MVP<small>${m.month.replace('-', '.')} MONTHLY</small></div><span class="note">活躍ポイント</span></div>
    ${m.ranking.slice(0, 5).map((e, i) => `<div class="race-row ${i === 0 ? 'first' : ''}"><span class="rk">${i + 1}</span><a class="nm" href="/players/${e.player_id}">${esc(e.player.name)}</a><div class="bar"><i data-w="${Math.max(4, (e.points / best) * 100).toFixed(1)}"></i></div><span class="v">${e.points}</span></div>`).join('')}
  </div>`;
}
