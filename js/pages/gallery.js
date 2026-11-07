// ギャラリー(写真・動画)
import { api, state } from '../api.js';
import { esc, pageHero, empty, videoInfo, icons, date, placeholderPhoto } from '../ui.js';
import { igHandle } from './home.js';

export async function gallery() {
  const d = await api.get('/api/gallery');
  const { items } = d;
  const s = state.settings;

  const thumb = (it) => {
    if (it.media_type === 'photo') return `<img src="${esc(it.url)}" alt="${esc(it.title)}" loading="lazy">`;
    const v = videoInfo(it.url);
    return v.thumb ? `<img src="${esc(v.thumb)}" alt="${esc(it.title)}" loading="lazy">` : `<div class="vthumb"><img src="${placeholderPhoto(v.kind === 'instagram' ? 'INSTAGRAM' : 'VIDEO')}" alt=""></div>`;
  };

  const html = `${pageHero('GALLERY', 'ギャラリー', '', [[null, 'ギャラリー']])}
  <section class="section section--dark">
    <div class="container">
      ${items.length ? `<div class="masonry">${items.map((it, i) => `
        <button class="m-item" data-idx="${i}" data-reveal>
          ${thumb(it)}
          ${it.media_type === 'video' ? `<span class="play">${icons.play}</span>` : ''}
          <span class="cap"><b>${esc(it.title)}</b>${esc(it.category)}${it.taken_at ? ` ・ ${date.dot(it.taken_at)}` : ''}</span>
        </button>`).join('')}</div>`
        : empty('まだ写真がありません')}
      ${s.sns_instagram ? `<p style="margin-top:32px;text-align:center"><a class="btn btn-gold" href="${esc(s.sns_instagram)}" target="_blank" rel="noopener"><span style="width:18px;height:18px;display:inline-block">${icons.instagram}</span>もっと見る @${esc(igHandle(s.sns_instagram))}</a></p>` : ''}
    </div>
  </section>`;

  return {
    title: 'ギャラリー',
    html,
    mount: (root) => root.querySelectorAll('.m-item').forEach((b) => b.addEventListener('click', () => openLightbox(d.items[Number(b.dataset.idx)]))),
  };
}

function openLightbox(it) {
  const wrap = document.createElement('div');
  wrap.className = 'lightbox';
  let media;
  if (it.media_type === 'photo') media = `<img src="${esc(it.url)}" alt="${esc(it.title)}">`;
  else {
    const v = videoInfo(it.url);
    if (v.kind === 'youtube') media = `<div class="embed"><iframe src="${v.embed}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="${esc(it.title)}"></iframe></div>`;
    else if (v.kind === 'instagram') media = `<div class="embed ig"><iframe src="${v.embed}" title="${esc(it.title)}" loading="lazy"></iframe></div>`;
    else media = `<div class="embed"><video src="${esc(v.src)}" controls autoplay playsinline></video></div>`;
  }
  wrap.innerHTML = `<button class="icon-btn lb-close" aria-label="閉じる">${icons.close}</button>
    <div class="lightbox-inner">${media}<div class="lb-cap"><b>${esc(it.title)}</b>${it.caption ? `<br><span style="color:#aaa;font-size:14px">${esc(it.caption)}</span>` : ''}
    ${it.game_id ? `<br><a class="link-more" href="/games/${it.game_id}" data-close-lb>この試合を見る</a>` : ''}</div></div>`;
  const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('.lb-close') || e.target.closest('[data-close-lb]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(wrap);
}
