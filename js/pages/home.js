// トップページ
import { api, state } from '../api.js';
import { esc, fmt, date, sectionHead, gameRow, lineScore, playerCard, icons, empty, parseDate, photoOf, form5 } from '../ui.js';
import { leaderCard, standingsTable, monthlyMvpBlock } from './shared.js';
import { activityCard } from './activities.js';

export async function home() {
  const d = await api.get('/api/home');
  const s = state.settings;
  const next = d.nextGames[0];
  const last = d.lastResults[0];
  const rec = d.record;
  const ownStanding = d.standings?.hasLeague ? d.standings.rows.find((r) => r.self) : null;
  const titleChars = [...(s.team_name || '')];

  const heroBg = s.hero_image
    ? `<div class="hero-bg has-photo" style="background-image:url('${esc(s.hero_image)}')"></div>`
    : `<div class="hero-bg"></div><div class="hero-lines"></div><div class="hero-slash"></div>`;

  const nextBox = next ? `<div class="next-box" data-reveal data-reveal-delay="2">
      <div class="label">NEXT GAME</div>
      <div class="date">${date.md(next.date)}<small>${date.dowEn(next.date)} ${esc(next.time)}</small></div>
      <div class="vs">vs ${esc(next.opponent)}</div>
      <div class="meta">${esc(next.game_type)} / ${esc(next.venue || '会場未定')}</div>
      <div class="countdown" id="countdown" data-at="${next.date}T${next.time || '09:00'}:00"></div>
      <a class="link-more" style="margin-top:14px" href="/games/${next.id}">MATCH INFO</a>
    </div>` : '';

  const heroRecord = rec ? `<div class="hero-record" data-reveal data-reveal-delay="3">
      <div class="item red"><b data-count="${rec.w}">0</b><span>勝</span></div>
      <div class="item"><b data-count="${rec.l}">0</b><span>敗</span></div>
      <div class="item"><b data-count="${rec.d}">0</b><span>分</span></div>
      <div class="item"><b>${fmt.pct(rec.pct)}</b><span>勝率</span></div>
      ${ownStanding ? `<div class="item"><b>${ownStanding.rank}<small style="font-size:18px">位</small></b><span>${esc(s.league_name)}</span></div>` : ''}
    </div>` : '';

  const ticker = d.lastResults.length ? `<div class="ticker"><div class="ticker-inner">
      <div class="ticker-label">RESULTS</div>
      <div style="overflow:hidden;flex:1"><div class="ticker-track">${[0, 1].map(() => d.lastResults.map((g) => `<a href="/games/${g.id}">${date.dot(g.date)}　${esc(s.team_name)} <span class="num">${g.our_score} - ${g.opp_score}</span> ${esc(g.opponent)}　${{ win: '○', loss: '●', draw: '△' }[g.result] || ''}</a>`).join('')).join('')}</div></div>
    </div></div>` : '';

  const rk = d.rankings;
  const cats = state.categories;
  const leaderCats = [
    ...cats.batting.filter((c) => ['avg', 'hr', 'rbi', 'sb'].includes(c.key)).map((c) => [c, rk?.batting[c.key] || []]),
    ...cats.pitching.filter((c) => ['era', 'w', 'so'].includes(c.key)).map((c) => [c, rk?.pitching[c.key] || []]),
  ];

  const html = `
  <section class="hero">
    ${heroBg}
    ${s.hero_image && s.hero_pin ? `<img class="hero-pin" src="${esc(s.hero_pin)}" alt="">` : ''}
    <div class="hero-word">${esc(s.team_name_en)}</div>
    <div class="container hero-content">
      <div class="hero-kicker" data-reveal>${esc(s.league_name)} ／ SINCE ${esc(s.founded)}</div>
      <h1 class="hero-title" data-reveal data-reveal-delay="1">${titleChars.map((c, i) => `<span class="${i === 0 ? 'red' : ''}">${esc(c)}</span>`).join('')}</h1>
      <div class="hero-en" data-reveal data-reveal-delay="1">${esc(s.team_name_en)} ${esc(s.club_label)}</div>
      <p class="hero-catch" data-reveal data-reveal-delay="2">${esc(s.catchphrase)}</p>
      <p class="hero-sub" data-reveal data-reveal-delay="2">${esc(s.sub_catch)}</p>
      <div class="hero-cta" data-reveal data-reveal-delay="3">
        <a class="btn btn-primary" href="/games">試合日程・結果</a>
        <a class="btn btn-ghost" href="/players">選手を見る</a>
      </div>
      ${heroRecord}
      <div class="hero-side">${nextBox}</div>
    </div>
  </section>
  ${ticker}

  <section class="section section--light">
    <div class="container grid grid-main">
      <div>
        ${sectionHead('Latest News', '最新のお知らせ', ['/news', 'ALL NEWS'])}
        ${d.news.length ? `<div class="news-list" data-reveal>${d.news.map((n) => `
          <a class="news-item" href="/news/${n.id}">
            <span class="news-date">${date.dot(n.published_at)}</span>
            <span class="news-cat c-${esc(n.category)}">${esc(n.category)}</span>
            <span class="news-title">${n.pinned ? '<span class="pin">PICK UP</span>' : ''}${esc(n.title)}</span>
          </a>`).join('')}</div>` : empty('お知らせはまだありません')}
      </div>
      <div>
        ${sectionHead('Schedule', '直近の試合予定', ['/games', 'ALL GAMES'])}
        <div data-reveal>${d.nextGames.length ? d.nextGames.map(gameRow).join('') : empty('予定されている試合はありません')}</div>
      </div>
    </div>
  </section>

  ${last ? `<section class="section section--dark">
    <div class="container">
      ${sectionHead('Latest Result', '最新の試合結果', ['/games?tab=results', 'ALL RESULTS'])}
      <div class="result-hero" data-reveal>
        <div class="rh-head"><span>${date.full(last.date)} ${esc(last.time)}　${esc(last.venue)}</span><span class="tag" style="color:var(--gold-2);border-color:var(--gold)">${esc(last.game_type)}</span></div>
        <div class="rh-score">
          <div class="rh-team">${esc(s.team_name)}</div>
          <div class="rh-nums"><span class="${last.result === 'win' ? 'win' : ''}" data-count="${last.our_score}">0</span><span class="sep">-</span><span class="${last.result === 'loss' ? 'win' : ''}" data-count="${last.opp_score}">0</span></div>
          <div class="rh-team right">${esc(last.opponent)}</div>
        </div>
        ${lineScore(last, null)}
        <div class="rh-mvp" style="margin-top:20px">
          ${last.mvp_name ? `<span class="lbl">GAME MVP</span><strong>#${esc(last.mvp_number)} ${esc(last.mvp_name)}</strong>` : '<span class="lbl">RESULT</span>'}
          <a class="link-more" style="margin-left:auto" href="/games/${last.id}">BOX SCORE</a>
        </div>
      </div>
      ${rec ? `<div style="display:flex;gap:16px;align-items:center;margin-top:20px;flex-wrap:wrap" data-reveal><span class="muted" style="font-size:13px">直近5試合</span>${form5(rec.last5)}${rec.streak && rec.streak.count >= 2 ? `<span class="muted" style="font-size:13px">${rec.streak.count}${{ win: '連勝中', loss: '連敗中', draw: '試合連続引き分け' }[rec.streak.type]}</span>` : ''}</div>` : ''}
    </div>
  </section>` : ''}

  <section class="section section--dark2">
    <div class="container">
      ${sectionHead('Featured Players', '注目選手', ['/players', 'ALL PLAYERS'])}
      ${d.featured.length ? `<div class="card-grid">${d.featured.map((p) => playerCard(p)).join('')}</div>` : empty('選手が登録されていません')}
    </div>
  </section>

  <section class="section section--light">
    <div class="container">
      ${sectionHead('Stats Leaders', `注目の個人成績 ${d.season ? `（${esc(d.season.name)}）` : ''}`, ['/stats', 'ALL STATS'])}
      ${d.qualification && d.qualification.games === 0 ? `<p class="muted" style="margin:-16px 0 24px" data-reveal>${esc(d.season.name)}の個人成績は、最初の試合のあとから表示されます。</p>` : ''}
      <div class="leaders">${leaderCats.map(([c, list]) => leaderCard(c, list)).join('')}</div>
    </div>
  </section>

  <section class="section section--white">
    <div class="container grid grid-main">
      <div>
        ${sectionHead('Standings', `最新ランキング・順位表`, ['/stats?tab=team', 'TEAM STATS'])}
        <div data-reveal>${d.standings?.hasLeague ? standingsTable(d.standings) : empty('順位表のデータがまだありません')}</div>
      </div>
      <div>
        ${sectionHead('Monthly MVP', '月間MVP', ['/stats?tab=mvp', 'MORE'])}
        ${monthlyMvpBlock(d.monthlyMvp)}
      </div>
    </div>
  </section>

  ${d.activities.length ? `<section class="section section--dark2">
    <div class="container">
      ${sectionHead('Off The Field', 'イベント・オフの活動', ['/events', 'ALL EVENTS'])}
      <p class="muted" style="margin:-16px 0 28px" data-reveal>試合だけじゃない。飲み会・鍋・BBQ・海…休みの日もみんなで全力で楽しんでいます。</p>
      <div class="post-grid">${d.activities.map(activityCard).join('')}</div>
    </div>
  </section>` : ''}

  ${s.sns_instagram ? `<section class="section section--dark" style="padding:56px 0">
    <div class="container">
      <a class="ig-banner" href="${esc(s.sns_instagram)}" target="_blank" rel="noopener" data-reveal>
        <span class="ig-icon">${icons.instagram}</span>
        <span><span class="t" style="display:block">Instagram でも発信中</span><span class="h">@${esc(igHandle(s.sns_instagram))}</span></span>
        <span class="btn btn-gold go">フォローする</span>
      </a>
    </div>
  </section>` : ''}`;

  return { title: '', html, mount: () => startCountdown() };
}

export function igHandle(url) {
  const m = String(url).match(/instagram\.com\/([\w.]+)/);
  return m ? m[1] : url;
}

let countdownTimer;
function startCountdown() {
  clearInterval(countdownTimer);
  const el = document.getElementById('countdown');
  if (!el) return;
  const [d, t] = el.dataset.at.split('T');
  const target = parseDate(d);
  const [hh, mm] = t.split(':').map(Number);
  target.setHours(hh, mm, 0, 0);
  const tick = () => {
    if (!document.body.contains(el)) { clearInterval(countdownTimer); return; }
    let diff = Math.max(0, target - Date.now());
    const days = Math.floor(diff / 86400000); diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
    const mins = Math.floor(diff / 60000);
    el.innerHTML = [[days, 'DAYS'], [hours, 'HOURS'], [mins, 'MIN']].map(([v, l]) => `<div><b>${String(v).padStart(2, '0')}</b><span>${l}</span></div>`).join('');
  };
  tick();
  countdownTimer = setInterval(tick, 30000);
}
