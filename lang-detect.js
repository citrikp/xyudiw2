/* Auto locale routing: Portuguese devices → *PT* HTML; all others → *-en*. */
(function () {
  try {
    var qs = new URLSearchParams(window.location.search);
    if (qs.has('nolang')) return;

    var override = (qs.get('lang') || '').toLowerCase();
    var wantPt;
    if (override === 'pt') wantPt = true;
    else if (override === 'en') wantPt = false;
    else {
      var langs = navigator.languages && navigator.languages.length
        ? Array.prototype.slice.call(navigator.languages)
        : [navigator.language || ''];
      wantPt = langs.some(function (l) {
        return /^pt\b/i.test(l || '');
      });
    }

    var pathname = window.location.pathname || '';
    var leaf = pathname.replace(/^.*\//, '') || '';
    if (!leaf) leaf = 'index.html';

    var routable = {
      'index.html': true,
      'index-en.html': true,
      'portfolio.html': true,
      'portfolio-en.html': true
    };
    if (!routable[leaf]) return;

    var qsOut = new URLSearchParams(window.location.search);
    qsOut.delete('lang');
    var qstr = qsOut.toString();
    var suffix = (qstr ? '?' + qstr : '') + (window.location.hash || '');

    function go(path) {
      if (leaf === path) return;
      window.location.replace(path + suffix);
    }

    if (leaf === 'index.html') {
      if (!wantPt) go('index-en.html');
    } else if (leaf === 'index-en.html') {
      if (wantPt) go('index.html');
    } else if (leaf === 'portfolio.html') {
      if (!wantPt) go('portfolio-en.html');
    } else if (leaf === 'portfolio-en.html') {
      if (wantPt) go('portfolio.html');
    }
  } catch (_) {
    /* noop */
  }
})();
