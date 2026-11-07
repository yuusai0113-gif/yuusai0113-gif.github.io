// スケジュール(月ごとのカレンダー): 試合・練習・その他の予定・イベント記事
// 管理者でログインしているときは、ここから予定の追加・編集・削除もできる
import { api, state, isAdmin } from '../api.js';
import { esc, nl2br, pageHero, parseDate, date, openModal, confirmDialog, toast } from '../ui.js';

const KIND = { game: '試合', practice: '練習', other: '予定', act: 'イベント' };
const RESULT = { win: '勝', loss: '敗', draw: '分' };

const ym = (y, m) => { const d = new Date(y, m - 1, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 予定をカレンダーとリストで同じ形に揃える
function toItems(d) {
  const items = [];
  for (const g of d.games) {
    const done = g.status === 'final';
    const canceled = g.status === 'canceled';
    items.push({
      kind: 'game', date: g.date, time: g.time, href: `/games/${g.id}`, place: g.venue,
      cls: done ? 'done' : canceled ? 'canceled' : '',
      label: canceled ? `中止 vs ${g.opponent}` : done ? `${RESULT[g.result] || ''} ${g.our_score}-${g.opp_score} ${g.opponent}` : `vs ${g.opponent}`,
      sub: g.game_type,
    });
  }
  for (const e of d.events) items.push({ kind: e.kind, date: e.date, time: e.time, label: e.title, place: e.place, event: e });
  for (const a of d.activities) items.push({ kind: 'act', date: a.date, time: '', href: `/events/${a.id}`, label: a.title, place: a.place, sub: a.category });
  return items.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '99').localeCompare(b.time || '99'));
}

function itemTag(it, i, cls, inner) {
  const attrs = `class="${cls} k-${it.kind} ${it.cls || ''}" title="${esc(`${it.time ? it.time + ' ' : ''}${it.label}`)}"`;
  return it.href ? `<a ${attrs} href="${it.href}">${inner}</a>` : `<button type="button" ${attrs} data-item="${i}">${inner}</button>`;
}

// 予定の追加・編集(管理者だけ)。入力欄は管理画面の「スケジュール・出欠」と同じものを使う
async function openEventForm(event, day, rerender) {
  const [{ EVENT_FIELDS, eventDefaults }, { formModal }] = await Promise.all([import('./admin.js'), import('./admin-forms.js')]);
  formModal({
    title: event ? '予定を編集' : '予定を追加',
    fields: EVENT_FIELDS,
    values: event || eventDefaults(day),
    extra: '<p class="muted" style="font-size:12px;margin-top:14px">試合の結果や個人成績も残したいときは、管理画面の「試合・成績入力」から登録してください（カレンダーにも自動で出ます）。</p>',
    onSubmit: async (data) => {
      if (event) await api.put(`/api/admin/r/events/${event.id}`, data);
      else await api.post('/api/admin/r/events', data);
      toast('保存しました');
      rerender();
    },
  });
}

export async function schedule({ query, navigate, rerender }) {
  const d = await api.get(`/api/schedule?month=${encodeURIComponent(query.m || '')}`);
  const admin = isAdmin();
  const [y, m] = d.month.split('-').map(Number);
  const items = toItems(d);
  const byDate = {};
  items.forEach((it, i) => (byDate[it.date] ??= []).push([it, i]));
  const thisMonth = d.today.slice(0, 7);
  const home = thisMonth < d.start ? d.start : thisMonth;

  // 日曜はじまりで、前後の月の日もうめて週ごとに並べる
  const first = new Date(y, m - 1, 1);
  const start = new Date(y, m - 1, 1 - first.getDay());
  const last = new Date(y, m, 0);
  const end = new Date(y, m - 1, last.getDate() + (6 - last.getDay()));
  const cells = [];
  for (let c = new Date(start); c <= end; c.setDate(c.getDate() + 1)) {
    const key = iso(c);
    const list = byDate[key] || [];
    const dow = c.getDay();
    const inMonth = c.getMonth() === m - 1;
    cells.push(`<div class="cal-day ${inMonth ? '' : 'out'} ${dow === 0 ? 'sun' : dow === 6 ? 'sat' : ''} ${key === d.today ? 'today' : ''}" ${list.length ? `data-date="${key}"` : ''}>
      <span class="cal-num">${c.getDate()}</span>
      ${admin && inMonth ? `<button type="button" class="cal-add" data-add="${key}" title="この日に予定を追加" aria-label="${c.getDate()}日に予定を追加">＋</button>` : ''}
      ${list.map(([it, i]) => itemTag(it, i, 'cal-item', `${it.time && it.kind !== 'act' ? `<small>${esc(it.time)}</small>` : ''}${esc(it.label)}`)).join('')}
      ${list.length ? `<span class="cal-dots">${list.map(([it]) => `<i class="k-${it.kind}"></i>`).join('')}</span>` : ''}
    </div>`);
  }

  const listHtml = Object.keys(byDate).length
    ? Object.entries(byDate).map(([day, list]) => `<div class="cl-day" id="d-${day}">
        <div class="cl-date ${parseDate(day).getDay() === 0 ? 'sun' : parseDate(day).getDay() === 6 ? 'sat' : ''}"><b>${date.md(day)}</b><span>${date.dowJa(day)}</span></div>
        <div class="cl-items">${list.map(([it, i]) => itemTag(it, i, 'cl-item', `
          <span class="cl-kind k-${it.kind}">${KIND[it.kind]}</span>
          <span class="cl-main"><b>${esc(it.label)}</b><small>${[it.time, it.place, it.sub].filter(Boolean).map(esc).join('　')}</small></span>`)).join('')}</div>
      </div>`).join('')
    : `<p class="muted" style="text-align:center;padding:20px 0">${m}月の予定はまだありません${admin ? '<br>「＋ 予定を追加」か、カレンダーの日付の「＋」から追加できます' : ''}</p>`;

  const html = `${pageHero('SCHEDULE', 'スケジュール', '試合・練習・イベントの予定です。予定を押すと詳しく見られます。', [[null, 'スケジュール']])}
  <section class="section section--light">
    <div class="container">
      ${admin ? `<div class="cal-admin">
        <span>管理者メニュー</span>
        <button class="btn btn-primary btn-sm" data-add="">＋ 予定を追加（練習など）</button>
        <a class="btn btn-ghost btn-sm" href="/admin/games/new">＋ 試合を追加</a>
      </div>` : ''}
      <div class="cal-head">
        <button class="cal-nav" data-month="${ym(y, m - 1)}" aria-label="前の月" ${d.month <= d.start ? 'disabled' : ''}>‹</button>
        <h2><small>${y}</small>${m}月</h2>
        <button class="cal-nav" data-month="${ym(y, m + 1)}" aria-label="次の月">›</button>
        ${d.month !== home ? `<button class="chip" data-month="${home}">${home === thisMonth ? '今月に戻る' : '最初の月に戻る'}</button>` : ''}
      </div>
      <div class="cal-legend">${['game', 'practice', 'other', 'act'].map((k) => `<span><i class="k-${k}"></i>${KIND[k]}</span>`).join('')}</div>
      <div class="cal">
        ${['日', '月', '火', '水', '木', '金', '土'].map((w, i) => `<div class="cal-dow ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${w}</div>`).join('')}
        ${cells.join('')}
      </div>
      <div class="cal-list">
        <h3>${m}月の予定</h3>
        ${listHtml}
      </div>
    </div>
  </section>`;

  return {
    title: 'スケジュール',
    html,
    mount(root) {
      root.querySelectorAll('[data-month]').forEach((b) => b.addEventListener('click', () => navigate(`/schedule?m=${b.dataset.month}`, { keepScroll: true })));
      // 練習などの予定は、押すと詳しい内容を出す(管理者には編集・削除ボタンも出す)
      root.querySelectorAll('[data-item]').forEach((b) => b.addEventListener('click', (e) => {
        e.stopPropagation();
        const ev = items[b.dataset.item].event;
        const playerLink = state.me?.player_id || state.me?.role === 'player' ? '<a class="btn btn-primary btn-sm" href="/mypage" data-close>マイページで出欠を答える</a>' : '';
        const md = openModal({
          title: ev.title,
          body: `<dl class="cal-detail">
            <dt>種類</dt><dd>${KIND[ev.kind]}</dd>
            <dt>日時</dt><dd>${date.full(ev.date)}${ev.time ? ` ${esc(ev.time)}〜` : ''}</dd>
            <dt>場所</dt><dd>${esc(ev.place || '未定')}</dd>
            ${ev.note ? `<dt>メモ</dt><dd>${nl2br(ev.note)}</dd>` : ''}
          </dl>`,
          foot: admin ? `<button class="btn btn-danger btn-sm" data-del>削除</button><button class="btn btn-ghost btn-sm" data-edit>編集</button>${playerLink}` : playerLink,
        });
        md.el.querySelector('[data-edit]')?.addEventListener('click', () => { md.close(); openEventForm(ev, null, rerender); });
        md.el.querySelector('[data-del]')?.addEventListener('click', async () => {
          md.close();
          if (!(await confirmDialog(`「${ev.title}」(${date.full(ev.date)})を削除しますか？\n出欠の回答も一緒に消え、元に戻せません。`, '削除する'))) return;
          try { await api.del(`/api/admin/r/events/${ev.id}`); toast('削除しました'); rerender(); } catch (err) { toast(err.message, true); }
        });
      }));
      root.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', (e) => {
        e.stopPropagation();
        openEventForm(null, b.dataset.add || (d.month === thisMonth ? d.today : `${d.month}-01`), rerender);
      }));
      // スマホでは日付を押すと、下のリストのその日に移動する
      root.querySelectorAll('.cal-day[data-date]').forEach((c) => c.addEventListener('click', (e) => {
        if (e.target.closest('.cal-item, .cal-add')) return;
        root.querySelector(`#d-${c.dataset.date}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
    },
  };
}
