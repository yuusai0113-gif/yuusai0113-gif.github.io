// 選手一覧・選手個別ページ
import { api, state } from '../api.js';
import { esc, fmt, date, pageHero, playerCard, abilityList, radarSvg, empty, seasonSelect, overall, grade, posGroup, nl2br, icons, handText } from '../ui.js';

const GROUPS = [['all', 'すべて'], ['pitcher', '投手'], ['catcher', '捕手'], ['infield', '内野手'], ['outfield', '外野手']];

export async function list({ query, navigate }) {
  const d = await api.get(`/api/players?season=${query.season || ''}${query.all ? '&all=1' : ''}`);
  const view = query.view === 'table' ? 'table' : 'card';
  const group = query.pos || 'all';
  const players = d.players.filter((p) => group === 'all' || posGroup(p.position) === group);
  const qs = (patch) => {
    const q = new URLSearchParams({ ...query, ...patch });
    for (const [k, v] of [...q]) if (!v || (k === 'view' && v === 'card') || (k === 'pos' && v === 'all')) q.delete(k);
    const s = q.toString();
    return `/players${s ? '?' + s : ''}`;
  };
  const table = `<div class="table-wrap"><table class="tbl">
    <thead><tr><th class="c">背番号</th><th class="l">選手名</th><th class="l">ポジション</th><th class="c">投打</th><th>年齢</th><th>打率</th><th>本塁打</th><th>打点</th><th>盗塁</th><th>防御率</th><th>総合</th></tr></thead>
    <tbody>${players.map((p) => `<tr>
      <td class="c">${esc(p.number || '-')}</td><td class="name"><a href="/players/${p.id}">${esc(p.name)}</a>${p.role ? ` <span class="tag" style="border-color:var(--gold);color:#8a6a1b">${esc(p.role)}</span>` : ''}${p.active ? '' : ' <span class="tag">退団</span>'}</td>
      <td class="l">${esc(p.position || '-')}</td><td class="c l">${esc(handText(p))}</td><td>${date.age(p.birthdate) ?? '-'}</td>
      <td>${fmt.avg(p.batting?.avg)}</td><td>${p.batting?.hr ?? '-'}</td><td>${p.batting?.rbi ?? '-'}</td><td>${p.batting?.sb ?? '-'}</td>
      <td>${p.pitching ? fmt.era(p.pitching.era) : '-'}</td><td><b class="g-${grade(overall(p))}" style="color:inherit">${overall(p)}</b></td></tr>`).join('')}</tbody>
  </table></div>`;

  const html = `${pageHero('PLAYERS', '選手紹介', `${esc(state.settings.team_name)} の選手たち。カードをクリックすると詳しいプロフィールと成績が見られます。`, [[null, '選手紹介']])}
  <section class="section section--light">
    <div class="container">
      <div class="toolbar">
        ${GROUPS.map(([k, l]) => `<a class="chip ${group === k ? 'active' : ''}" href="${qs({ pos: k })}">${l}</a>`).join('')}
        <span class="spacer"></span>
        ${seasonSelect(d.season?.id)}
        <a class="chip ${view === 'card' ? 'active' : ''}" href="${qs({ view: 'card' })}">カード</a>
        <a class="chip ${view === 'table' ? 'active' : ''}" href="${qs({ view: 'table' })}">一覧表</a>
      </div>
      <p class="muted" style="font-size:13px;margin-bottom:20px">カードの成績は ${esc(d.season?.name || '')} のものです。カード左上の大きい数字は背番号です。</p>
      ${players.length ? (view === 'table' ? table : `<div class="card-grid">${players.map((p) => playerCard(p)).join('')}</div>`) : empty('該当する選手がいません')}
      <p style="margin-top:28px;text-align:right"><a class="link-more" href="${qs({ all: query.all ? '' : '1' })}">${query.all ? '在籍選手のみ表示' : '退団した選手も表示'}</a></p>
    </div>
  </section>`;
  return {
    title: '選手紹介',
    html,
    mount: (root) => root.querySelector('#season-select')?.addEventListener('change', (e) => navigate(qs({ season: e.target.value }), { keepScroll: true })),
  };
}

export async function detail({ params, query, navigate }) {
  const d = await api.get(`/api/players/${params.id}?season=${query.season || ''}`);
  const p = d.player;
  const b = d.batting;
  const pt = d.pitching;
  const age = date.age(p.birthdate);
  const card = { ...p, batting: b, pitching: pt };

  const profile = [
    ...(p.role ? [['役職', p.role]] : []), ['ポジション', p.position || '未登録'], ['投打', handText(p)],
    ['生年月日', p.birthdate ? `${date.full(p.birthdate).replace(/\(.\)/, '')}${age != null ? `（${age}歳）` : ''}` : '-'],
    ['身長 / 体重', `${p.height ? p.height + 'cm' : '-'} / ${p.weight ? p.weight + 'kg' : '-'}`],
    ['出身', p.hometown || '-'], ['入団', p.joined_year ? `${p.joined_year}年` : '-'],
  ];

  const tiles = (items) => `<div class="stat-tiles">${items.map(([l, v, sub]) => `<div class="tile"><div class="tile-label">${l}</div><div class="tile-value">${v}</div>${sub ? `<div class="tile-sub">${sub}</div>` : ''}</div>`).join('')}</div>`;
  const q = d.qualification;
  const batTiles = b ? tiles([
    ['試合', b.g], ['打率', fmt.avg(b.avg), b.qualified ? '' : `規定打席未到達 (${b.pa}/${q.reqPA})`], ['本塁打', b.hr], ['打点', b.rbi], ['安打', b.h], ['盗塁', b.sb], ['出塁率', fmt.avg(b.obp)], ['OPS', fmt.avg(b.ops)],
  ]) : '';
  const pitTiles = pt ? tiles([
    ['登板', pt.g], ['防御率', fmt.era(pt.era), pt.qualified ? '' : `規定投球回未到達 (${pt.ip_text}/${q.reqIpText})`], ['勝利', pt.w], ['敗戦', pt.l], ['セーブ', pt.sv], ['投球回', pt.ip_text], ['奪三振', pt.so], ['WHIP', fmt.dec2(pt.whip)],
  ]) : '';

  const ranks = d.ranks.length ? `<div class="rank-chips">${d.ranks.map((r) => `<div class="rank-chip ${r.rank === 1 ? 'top' : ''}">
      <div class="lbl">${esc(r.label)}</div><div class="val">${fmt.by(r.format, r.value)}</div>
      ${r.rank ? `<div class="rk">${r.rank === 1 ? '★ ' : ''}チーム ${r.rank}位</div>` : `<div class="rk none">${r.unqualified ? '規定未到達' : '記録なし'}</div>`}
    </div>`).join('')}</div>` : empty('このシーズンの記録はまだありません');

  const batRow = (r, label) => `<tr class="${label === '通算' ? 'total' : ''}"><td class="l">${label}</td><td>${r.g}</td><td>${r.pa}</td><td>${r.ab}</td><td>${r.h}</td><td>${r.d2}</td><td>${r.d3}</td><td>${r.hr}</td><td>${r.rbi}</td><td>${r.r}</td><td>${r.sb}</td><td>${r.bb}</td><td>${r.so}</td><td>${fmt.avg(r.avg)}</td><td>${fmt.avg(r.obp)}</td><td>${fmt.avg(r.slg)}</td><td>${fmt.avg(r.ops)}</td></tr>`;
  const pitRow = (r, label) => `<tr class="${label === '通算' ? 'total' : ''}"><td class="l">${label}</td><td>${r.g}</td><td>${r.w}</td><td>${r.l}</td><td>${r.sv}</td><td>${r.ip_text}</td><td>${r.h}</td><td>${r.so}</td><td>${r.bb}</td><td>${r.r}</td><td>${r.er}</td><td>${fmt.era(r.era)}</td><td>${fmt.dec2(r.whip)}</td></tr>`;
  const batHead = '<tr><th class="l">年度</th><th>試合</th><th>打席</th><th>打数</th><th>安打</th><th>二塁打</th><th>三塁打</th><th>本塁打</th><th>打点</th><th>得点</th><th>盗塁</th><th>四球</th><th>三振</th><th>打率</th><th>出塁率</th><th>長打率</th><th>OPS</th></tr>';
  const pitHead = '<tr><th class="l">年度</th><th>登板</th><th>勝</th><th>敗</th><th>S</th><th>投球回</th><th>被安打</th><th>奪三振</th><th>与四球</th><th>失点</th><th>自責点</th><th>防御率</th><th>WHIP</th></tr>';
  const yearly = `
    ${d.yearly.batting.length ? `<h3 style="font-size:16px;font-weight:900;margin:0 0 12px">打撃成績</h3><div class="table-wrap" style="margin-bottom:28px"><table class="tbl"><thead>${batHead}</thead><tbody>
      ${d.yearly.batting.map((r) => batRow(r, esc(r.season.name))).join('')}${d.career.batting ? batRow(d.career.batting, '通算') : ''}</tbody></table></div>` : ''}
    ${d.yearly.pitching.length ? `<h3 style="font-size:16px;font-weight:900;margin:0 0 12px">投手成績</h3><div class="table-wrap"><table class="tbl"><thead>${pitHead}</thead><tbody>
      ${d.yearly.pitching.map((r) => pitRow(r, esc(r.season.name))).join('')}${d.career.pitching ? pitRow(d.career.pitching, '通算') : ''}</tbody></table></div>` : ''}
    ${!d.yearly.batting.length && !d.yearly.pitching.length ? empty('まだ成績がありません') : ''}`;

  const resMark = (r) => ({ win: '<span style="color:var(--red);font-weight:700">○</span>', loss: '●', draw: '△' }[r] || '');
  const gameLog = `
    ${d.gameLog.batting.length ? `<div class="table-wrap" style="margin-bottom:20px"><table class="tbl"><thead><tr><th class="l">日付</th><th class="l">対戦相手</th><th class="c">結果</th><th>打数</th><th>安打</th><th>本塁打</th><th>打点</th><th>得点</th><th>盗塁</th><th>四球</th><th>三振</th></tr></thead><tbody>
      ${d.gameLog.batting.map((r) => `<tr><td class="l">${date.dot(r.date)}</td><td class="l"><a href="/games/${r.game_id}">${esc(r.opponent)}</a></td><td class="c">${resMark(r.result)} ${r.our_score}-${r.opp_score}</td><td>${r.ab}</td><td class="${r.h >= 2 ? 'hl' : ''}">${r.h}</td><td class="${r.hr ? 'hl' : ''}">${r.hr}</td><td>${r.rbi}</td><td>${r.r}</td><td>${r.sb}</td><td>${r.bb}</td><td>${r.so}</td></tr>`).join('')}
    </tbody></table></div>` : ''}
    ${d.gameLog.pitching.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th class="l">日付</th><th class="l">対戦相手</th><th class="c">結果</th><th class="c">勝敗</th><th>投球回</th><th>被安打</th><th>奪三振</th><th>与四球</th><th>失点</th><th>自責点</th></tr></thead><tbody>
      ${d.gameLog.pitching.map((r) => `<tr><td class="l">${date.dot(r.date)}</td><td class="l"><a href="/games/${r.game_id}">${esc(r.opponent)}</a></td><td class="c">${resMark(r.result)} ${r.our_score}-${r.opp_score}</td><td class="c l">${r.win ? '<b style="color:var(--red)">勝</b>' : r.loss ? '敗' : r.save ? 'S' : ''}</td><td>${r.ip_text}</td><td>${r.h}</td><td>${r.so}</td><td>${r.bb}</td><td>${r.r}</td><td>${r.er}</td></tr>`).join('')}
    </tbody></table></div>` : ''}
    ${!d.gameLog.batting.length && !d.gameLog.pitching.length ? empty('このシーズンの出場記録はまだありません') : ''}`;

  const html = `
  <section class="player-hero">
    <div class="bg-num">${esc(p.number)}</div>
    <div class="container">
      <nav class="breadcrumb" style="padding-top:28px;margin:0"><a href="/">HOME</a><span><a href="/players">選手紹介</a></span><span>${esc(p.name)}</span></nav>
      <div class="ph-grid">
        ${playerCard(card, { link: false, reveal: false })}
        <div class="ph-info" data-reveal>
          <div class="no">${p.number ? `#${esc(p.number)}` : '#--'}</div>
          <div class="kana">${esc(p.name_kana)}</div>
          <h1>${esc(p.name)}</h1>
          <div class="en">${esc(p.name_en)}</div>
          ${p.active ? '' : '<span class="tag" style="margin-top:8px;color:var(--text-d2)">退団</span>'}
          <dl class="profile-table">${profile.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
          ${p.comment ? `<p style="margin-top:20px;font-size:17px;font-weight:700;border-left:3px solid var(--red);padding-left:14px">「${esc(p.comment)}」</p>` : ''}
          ${d.activity ? `<p class="muted" style="font-size:13px;margin:12px 0 0">今シーズン活躍ポイント <b class="num" style="color:var(--gold-2);font-size:18px">${d.activity.points}</b> pt（チーム${d.activity.rank}位）${d.mvpGames ? ` ／ 試合MVP ${d.mvpGames}回` : ''}</p>` : ''}
        </div>
      </div>
    </div>
  </section>

  <section class="section section--light">
    <div class="container">
      <div class="section-head" style="margin-bottom:24px"><div><div class="eyebrow">Season <em>Stats</em></div><h2>シーズン成績</h2></div>${seasonSelect(d.season?.id)}</div>
      ${b ? `<div data-reveal style="margin-bottom:16px">${batTiles}</div>` : ''}
      ${pt ? `<div data-reveal style="margin-bottom:16px">${pitTiles}</div>` : ''}
      ${!b && !pt ? empty('このシーズンの成績はまだありません') : ''}
      <h3 style="font-size:16px;font-weight:900;margin:36px 0 14px">チーム内ランキング（${esc(d.season?.name || '')}）</h3>
      ${ranks}
    </div>
  </section>

  <section class="section section--dark">
    <div class="container">
      <div class="section-head"><div><div class="eyebrow">Ability</div><h2>能力値</h2></div></div>
      <div class="radar-box" data-reveal>
        ${radarSvg(p)}
        <div>${abilityList(p)}
          <p class="muted" style="font-size:12px;margin-top:16px">S:90〜 A:80〜 B:70〜 C:60〜 D:50〜 E:40〜 F:20〜 G:〜19 ／ 総合 <b class="num" style="color:var(--gold-2);font-size:18px">${overall(p)}</b></p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--white">
    <div class="container">
      <div class="section-head"><div><div class="eyebrow">Career <em>Record</em></div><h2>年度別・通算成績</h2></div></div>
      ${yearly}
    </div>
  </section>

  <section class="section section--light">
    <div class="container">
      <div class="section-head"><div><div class="eyebrow">Game <em>Log</em></div><h2>試合別成績（${esc(d.season?.name || '')}）</h2></div></div>
      ${gameLog}
    </div>
  </section>

  <section class="section section--dark2">
    <div class="container grid grid-2">
      <div>
        <div class="section-head"><div><div class="eyebrow">Profile</div><h2>経歴</h2></div></div>
        <p style="color:var(--text-d2)">${nl2br(p.career) || '未登録'}</p>
      </div>
      <div>
        <div class="section-head"><div><div class="eyebrow">Awards</div><h2>受賞歴</h2></div></div>
        ${d.awards.length ? `<div class="award-grid" style="grid-template-columns:1fr">${d.awards.map((a) => `<div class="award"><div class="ttl">${icons.trophy}${esc(a.season_name)}</div><div class="who">${esc(a.title)}</div><div class="note">${esc(a.note)}</div></div>`).join('')}</div>` : '<p class="muted">まだありません</p>'}
      </div>
    </div>
  </section>`;

  return {
    title: p.name,
    html,
    mount: (root) => root.querySelector('#season-select')?.addEventListener('change', (e) => navigate(`/players/${p.id}?season=${e.target.value}`, { keepScroll: true })),
  };
}
