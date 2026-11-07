// 全選手の打率一覧(メニューの「打率」)
import { api, state } from '../api.js';
import { esc, fmt, pageHero, seasonSelect } from '../ui.js';

export async function batting({ query, navigate }) {
  const d = await api.get(`/api/players?season=${query.season || ''}`);
  // 並びは選手名簿と同じ(監督 → キャプテン → 背番号の若い順)。順位は規定打席に届いた人の中で打率の高い順
  const rows = d.players;
  const ranked = rows.filter((p) => p.batting?.avg != null && p.batting.qualified).sort((a, b) => b.batting.avg - a.batting.avg);
  ranked.forEach((p, i) => { p.rank = i && p.batting.avg === ranked[i - 1].batting.avg ? ranked[i - 1].rank : i + 1; });
  const hasData = rows.some((p) => p.batting?.avg != null);

  const html = `${pageHero('AVERAGE', '打率', `${esc(d.season?.name || '')} の全選手の打率です。打率 = ヒットの数 ÷ 打数。試合の成績を入れると自動で計算されます。順位は打率の高い順です。`, [[null, '打率']])}
  <section class="section section--light">
    <div class="container">
      <div class="toolbar">
        ${seasonSelect(d.season?.id)}
        <span class="spacer"></span>
        <a class="link-more" href="/stats?tab=batting">くわしい打撃成績を見る</a>
      </div>
      ${hasData ? '' : `<p class="muted" style="font-size:13px;margin-bottom:16px">このシーズンはまだ試合の成績が入っていないので、打率は「.---」と表示しています。</p>`}
      <div class="table-wrap"><table class="tbl avg-table">
        <thead><tr><th class="c">順位</th><th class="c">背番号</th><th class="l">選手名</th><th>打率</th><th>試合</th><th>打数</th><th>安打</th><th>本塁打</th><th>打点</th><th>出塁率</th></tr></thead>
        <tbody>${rows.map((p) => {
          const b = p.batting;
          return `<tr>
          <td class="c">${p.rank ?? '-'}</td><td class="c">${esc(p.number || '-')}</td>
          <td class="name"><a href="/players/${p.id}">${esc(p.name)}</a>${b && !b.qualified ? ' <small class="unq-note">規定打席未満</small>' : ''}</td>
          <td class="avg">${b?.avg == null ? '.---' : fmt.avg(b.avg)}</td>
          <td>${b?.g ?? '-'}</td><td>${b?.ab ?? '-'}</td><td>${b?.h ?? '-'}</td><td>${b?.hr ?? '-'}</td><td>${b?.rbi ?? '-'}</td><td>${fmt.avg(b?.obp)}</td></tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>
  </section>`;

  return {
    title: '打率',
    html,
    mount: (root) => root.querySelector('#season-select')?.addEventListener('change', (e) => navigate(`/batting?season=${e.target.value}`, { keepScroll: true })),
  };
}
