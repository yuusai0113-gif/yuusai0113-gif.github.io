// 公開ページ用: データはCloudflare(赤鬼サイトの本体)から読む。つながらないときだけ、書き出しておいたデータを使う
(function () {
  var API = 'https://akaoni-line.yuusai0113.workers.dev';
  var realFetch = window.fetch.bind(window);
  function fileName(u) {
    var p = u.pathname.replace('/api/', '').split('/').join('_');
    var q = Array.from(u.searchParams).filter(function (e) { return e[1] !== ''; }).sort().map(function (e) { return e[0] + '-' + e[1]; }).join('_');
    return q ? p + '__' + q : p;
  }
  function fallback(u) {
    if (u.pathname === '/api/schedule' && !u.searchParams.get('month')) {
      var d = new Date();
      var month = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      u.searchParams.set('month', month < '2026-11' ? '2026-11' : month > '2027-12' ? '2027-12' : month);
    }
    return realFetch('/data/' + fileName(u) + '.json');
  }
  window.fetch = function (input, opts) {
    var u = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (u.pathname.indexOf('/api/') !== 0) return realFetch(input, opts);
    if (opts && opts.method && opts.method !== 'GET') {
      return Promise.resolve(new Response(JSON.stringify({ error: 'この公開ページは見るだけです。ログインや編集はできません' }), { status: 403, headers: { 'Content-Type': 'application/json' } }));
    }
    return realFetch(API + u.pathname + u.search)
      .then(function (res) { return res.ok || res.status === 404 ? res : fallback(u); })
      .catch(function () { return fallback(u); });
  };
})();
