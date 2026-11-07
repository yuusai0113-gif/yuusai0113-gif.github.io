// お知らせ
import { api } from '../api.js';
import { esc, nl2br, date, pageHero, empty } from '../ui.js';

export async function list() {
  const d = await api.get('/api/news');
  const html = `${pageHero('NEWS', 'お知らせ', '', [[null, 'お知らせ']])}
  <section class="section section--light"><div class="container" style="max-width:900px">
    ${d.items.length ? `<div class="news-list">${d.items.map((n) => `
      <a class="news-item" href="/news/${n.id}" data-reveal>
        <span class="news-date">${date.dot(n.published_at)}</span>
        <span class="news-cat c-${esc(n.category)}">${esc(n.category)}</span>
        <span class="news-title">${n.pinned ? '<span class="pin">PICK UP</span>' : ''}${esc(n.title)}</span>
      </a>`).join('')}</div>` : empty('お知らせはまだありません')}
  </div></section>`;
  return { title: 'お知らせ', html };
}

export async function detail({ params }) {
  const { item: n } = await api.get(`/api/news/${params.id}`);
  const html = `${pageHero('NEWS', n.title, `${date.full(n.published_at)}　<span class="tag" style="color:var(--gold-2);border-color:var(--gold)">${esc(n.category)}</span>`, [['/news', 'お知らせ'], [null, n.title]])}
  <section class="section section--white"><div class="container" style="max-width:820px">
    ${n.image ? `<img src="${esc(n.image)}" alt="" style="width:100%;margin-bottom:28px">` : ''}
    <div style="font-size:16px;line-height:2">${nl2br(n.body)}</div>
    <p style="margin-top:48px"><a class="link-more" href="/news">お知らせ一覧へ</a></p>
  </div></section>`;
  return { title: n.title, html };
}
