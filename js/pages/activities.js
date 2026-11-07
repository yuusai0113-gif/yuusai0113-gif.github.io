// イベント・オフの活動(海・BBQ・打ち上げなど)のブログと、Instagram欄
import { api, state } from '../api.js';
import { esc, nl2br, date, pageHero, empty, icons, videoInfo, sectionHead } from '../ui.js';

// Instagram欄の分類(タブの並び順)。ここにない分類の投稿があれば、その分のタブが後ろに増える
export const IG_CATEGORIES = ['イベント', '飲み会', 'ガレージ'];

function igCard(p) {
  return `<div class="ig-card" data-cat="${esc(p.category)}">
    <iframe src="${esc(videoInfo(p.url).embed)}" title="${esc(p.title || 'Instagramの投稿')}" loading="lazy" allowtransparency="true"></iframe>
    <div class="ig-meta">${p.category ? `<span class="ig-cat">${esc(p.category)}</span>` : ''}<b>${esc(p.title)}</b><small>${date.dot(p.date)}</small></div>
  </div>`;
}

// 写真がなく Instagram の投稿だけの記事は、タイトル入りのカードを表示する
const igThumb = (a) => `<div class="post-ig-thumb"><span class="ig-mark">${icons.instagram}</span><b>${esc(a.title.replace(/（タイトル仮）$/, ''))}</b></div>`;

export function activityCard(a) {
  return `<a class="post-card" href="/events/${a.id}" data-reveal>
    <div class="post-thumb">${a.cover ? `<img src="${esc(a.cover)}" alt="" loading="lazy">` : igThumb(a)}
      <span class="post-cat">${esc(a.category)}</span>${a.photo_count ? `<span class="post-count">${a.photo_count}枚</span>` : a.instagram_url ? '<span class="post-count">動画あり</span>' : ''}</div>
    <div class="post-body">
      <div class="post-date">${date.dot(a.date)}${a.place ? `<span>${esc(a.place)}</span>` : ''}</div>
      <h3>${esc(a.title)}</h3>
      <p>${esc(String(a.excerpt || '').replace(/\n/g, ' '))}…</p>
    </div>
  </a>`;
}

export async function list({ query }) {
  const { items, instagram } = await api.get('/api/activities');
  const s = state.settings;
  const cats = ['すべて', ...new Set(items.map((a) => a.category))];
  const cat = cats.includes(query.c) ? query.c : 'すべて';
  const shown = items.filter((a) => cat === 'すべて' || a.category === cat);
  const igCats = ['すべて', ...IG_CATEGORIES, ...new Set(instagram.map((p) => p.category).filter((c) => c && !IG_CATEGORIES.includes(c)))];
  const igCount = (c) => (c === 'すべて' ? instagram.length : instagram.filter((p) => p.category === c).length);
  const html = `${pageHero('EVENTS', 'イベント・オフの活動', `試合だけじゃない、${esc(s.team_name)}の休日。飲み会・鍋・BBQ・海…みんなでこんなことしてます！`, [[null, 'イベント']])}
  <section class="section section--light">
    <div class="container">
      ${sectionHead('Events', 'イベント')}
      ${cats.length > 2 ? `<div class="toolbar">${cats.map((c) => `<a class="chip ${c === cat ? 'active' : ''}" href="/events${c === 'すべて' ? '' : `?c=${encodeURIComponent(c)}`}">${esc(c)}</a>`).join('')}</div>` : ''}
      ${shown.length ? `<div class="post-grid">${shown.map(activityCard).join('')}</div>` : empty('イベントの記事は準備中です')}
    </div>
  </section>
  <section class="section section--white" id="instagram">
    <div class="container">
      ${sectionHead('Instagram', 'インスタグラム')}
      ${instagram.length ? `<div class="toolbar ig-tabs">${igCats.map((c) => `<button type="button" class="chip ${c === 'すべて' ? 'active' : ''}" data-igcat="${esc(c)}">${esc(c)}<span class="n">${igCount(c)}</span></button>`).join('')}</div>
        <div class="ig-grid">${instagram.map(igCard).join('')}</div>
        <div class="empty ig-none" hidden>この分類の投稿はまだありません</div>` : empty('まだ投稿がありません')}
      ${s.sns_instagram ? `<p style="margin-top:36px;text-align:center"><a class="btn btn-ghost" href="${esc(s.sns_instagram)}" target="_blank" rel="noopener"><span style="width:18px;height:18px;display:inline-block">${icons.instagram}</span>Instagram でもっと見る</a></p>` : ''}
    </div>
  </section>`;
  return {
    title: 'イベント',
    html,
    // 分類のタブは、ページを読み込み直さずにその場で切りかえる(埋め込みの読み込み直しを防ぐ)
    mount(root) {
      const cards = [...root.querySelectorAll('.ig-card')];
      root.querySelectorAll('[data-igcat]').forEach((b) => b.addEventListener('click', () => {
        root.querySelectorAll('[data-igcat]').forEach((x) => x.classList.toggle('active', x === b));
        const c = b.dataset.igcat;
        let shownCount = 0;
        for (const card of cards) {
          card.hidden = c !== 'すべて' && card.dataset.cat !== c;
          if (!card.hidden) shownCount++;
        }
        root.querySelector('.ig-none').hidden = shownCount > 0;
      }));
    },
  };
}

export async function detail({ params }) {
  const { item: a, newer, older } = await api.get(`/api/activities/${params.id}`);
  const photos = a.photos || [];
  const s = state.settings;
  const ig = a.instagram_url ? videoInfo(a.instagram_url) : null;
  const heroImg = a.cover || photos[0] || '';
  const html = `
  <section class="post-hero">
    <div class="post-hero-img ${heroImg ? '' : 'no-img'}" style="${heroImg ? `background-image:url('${esc(heroImg)}')` : ''}"></div>
    <div class="container post-hero-inner">
      <nav class="breadcrumb"><a href="/">HOME</a><span><a href="/events">イベント</a></span><span>${esc(a.title)}</span></nav>
      <span class="post-cat static">${esc(a.category)}</span>
      <h1>${esc(a.title)}</h1>
      <div class="post-meta">${date.full(a.date)}${a.place ? `　／　${esc(a.place)}` : ''}</div>
    </div>
  </section>
  <section class="section section--white">
    <div class="container" style="max-width:860px">
      <div class="post-text" data-reveal>${String(a.body || '').split(/\n{2,}/).map((p) => `<p>${nl2br(p)}</p>`).join('')}</div>
      ${ig?.kind === 'instagram' ? `<div class="post-ig" data-reveal><iframe src="${esc(ig.embed)}" title="${esc(a.title)}（Instagram）" loading="lazy" allowtransparency="true"></iframe>
        <a class="link-more" href="${esc(a.instagram_url)}" target="_blank" rel="noopener">Instagram で開く</a></div>` : ''}
      ${photos.length ? `<div class="post-photos">${photos.map((u, i) => `<button class="post-photo" data-i="${i}" data-reveal><img src="${esc(u)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
      ${s.sns_instagram ? `<p style="margin-top:36px;text-align:center"><a class="btn btn-ghost" href="${esc(s.sns_instagram)}" target="_blank" rel="noopener"><span style="width:18px;height:18px;display:inline-block">${icons.instagram}</span>Instagram でもっと見る</a></p>` : ''}
      <nav class="post-nav">
        ${older ? `<a href="/events/${older.id}"><small>← 前の記事</small>${esc(older.title)}</a>` : '<span></span>'}
        ${newer ? `<a href="/events/${newer.id}" style="text-align:right"><small>次の記事 →</small>${esc(newer.title)}</a>` : '<span></span>'}
      </nav>
      <p style="text-align:center;margin-top:24px"><a class="link-more" href="/events">イベント一覧へ</a></p>
    </div>
  </section>`;
  return {
    title: a.title,
    html,
    mount: (root) => root.querySelectorAll('.post-photo').forEach((b) => b.addEventListener('click', () => openPhotos(photos, Number(b.dataset.i)))),
  };
}

// 写真を大きく表示(左右で切りかえ)
function openPhotos(photos, start) {
  let i = start;
  const wrap = document.createElement('div');
  wrap.className = 'lightbox';
  const draw = () => {
    wrap.innerHTML = `<button class="icon-btn lb-close" aria-label="閉じる">${icons.close}</button>
      <div class="lightbox-inner"><img src="${esc(photos[i])}" alt="">
        <div class="lb-cap">${i + 1} / ${photos.length}</div>
        ${photos.length > 1 ? `<div style="display:flex;justify-content:center;gap:12px;margin-top:12px"><button class="btn btn-ghost btn-sm" data-move="-1">← 前へ</button><button class="btn btn-ghost btn-sm" data-move="1">次へ →</button></div>` : ''}
      </div>`;
  };
  const move = (d) => { i = (i + d + photos.length) % photos.length; draw(); };
  const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') move(1); if (e.key === 'ArrowLeft') move(-1); };
  wrap.addEventListener('click', (e) => {
    const m = e.target.closest('[data-move]');
    if (m) { move(Number(m.dataset.move)); return; }
    if (e.target === wrap || e.target.closest('.lb-close')) close();
  });
  document.addEventListener('keydown', onKey);
  draw();
  document.body.appendChild(wrap);
}
