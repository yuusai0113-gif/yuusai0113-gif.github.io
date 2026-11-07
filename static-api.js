// 見るだけの公開ページ用: サーバーの代わりに、書き出しておいたデータを読む
(function () {
  var LINE_EVENTS = 'https://akaoni-line.yuusai0113.workers.dev/events';
  var realFetch = window.fetch.bind(window);
  function fileName(u) {
    var p = u.pathname.replace('/api/', '').split('/').join('_');
    var q = Array.from(u.searchParams).filter(function (e) { return e[1] !== ''; }).sort().map(function (e) { return e[0] + '-' + e[1]; }).join('_');
    return q ? p + '__' + q : p;
  }
  // 公式LINEから入った予定を、その月のカレンダーに足す。読めないときはカレンダーだけ出す
  function withLineEvents(res) {
    if (!res.ok) return res;
    return Promise.all([
      res.json(),
      realFetch(LINE_EVENTS).then(function (r) { return r.json(); }).catch(function () { return { events: [] }; }),
    ]).then(function (v) {
      var d = v[0];
      var seen = new Set(d.events.map(function (e) { return e.date + '|' + e.title; }));
      v[1].events.forEach(function (e) {
        if (e.date.indexOf(d.month) === 0 && !seen.has(e.date + '|' + e.title)) d.events.push(e);
      });
      return new Response(JSON.stringify(d), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
  }
  window.fetch = function (input, opts) {
    var u = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (u.pathname.indexOf('/api/') !== 0) return realFetch(input, opts);
    if (opts && opts.method && opts.method !== 'GET') {
      return Promise.resolve(new Response(JSON.stringify({ error: 'この公開ページは見るだけです。ログインや編集はできません' }), { status: 403, headers: { 'Content-Type': 'application/json' } }));
    }
    if (u.pathname === '/api/schedule') {
      if (!u.searchParams.get('month')) {
        var d = new Date();
        var month = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        u.searchParams.set('month', month < '2026-11' ? '2026-11' : month > '2027-12' ? '2027-12' : month);
      }
      return realFetch('/data/' + fileName(u) + '.json').then(withLineEvents);
    }
    return realFetch('/data/' + fileName(u) + '.json');
  };
})();
