// 年間表彰(過去シーズンも含めて表示)
import { api, state } from '../api.js';
import { esc, pageHero, empty, icons } from '../ui.js';

export async function awards({ query }) {
  const d = await api.get('/api/awards');
  const withAwards = d.seasons.filter((s) => s.awards.length);
  const sel = d.seasons.find((s) => String(s.id) === query.season) || withAwards[0] || d.seasons[0];
  const list = sel?.awards || [];
  const main = list.filter((a) => a.title !== 'ベストナイン');
  const bestNine = list.filter((a) => a.title === 'ベストナイン');
  const who = (a) => a.player_id ? `<a href="/players/${a.player_id}">${esc(a.player_name)}</a>` : esc(a.recipient_name);

  const html = `${pageHero('AWARDS', '年間表彰', 'シーズンの頂点に立った選手たち。過去のシーズンの表彰もここで見られます。', [[null, '年間表彰']])}
  <section class="section section--dark">
    <div class="container">
      <div class="toolbar">${d.seasons.map((s) => `<a class="chip ${s.id === sel?.id ? 'active' : ''}" href="/awards?season=${s.id}">${esc(s.name)}</a>`).join('')}</div>
      ${list.length ? `
        <div class="award-grid">${main.map((a) => `<div class="award ${a.title === 'MVP' ? 'mvp' : ''}" data-reveal>
          <div class="ttl">${icons.trophy}${esc(a.title)}</div><div class="who">${who(a)}</div><div class="note">${esc(a.note)}</div></div>`).join('')}</div>
        ${bestNine.length ? `<div class="section-head" style="margin-top:56px"><div><div class="eyebrow">Best <em>Nine</em></div><h2>ベストナイン</h2></div></div>
          <div class="award-grid">${bestNine.map((a) => `<div class="award" data-reveal><div class="ttl">${esc(a.note)}</div><div class="who">${who(a)}</div></div>`).join('')}</div>` : ''}`
        : empty(sel?.is_current ? `${esc(sel.name)}の表彰はシーズン終了後に発表されます。<br><a class="link-more" href="/stats" style="margin-top:12px">現在のタイトル争いを見る</a>` : '表彰はまだ登録されていません')}
    </div>
  </section>`;
  return { title: '年間表彰', html };
}
