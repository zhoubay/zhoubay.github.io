/* Keep ordinary, server-rendered language links usable without JavaScript.
   With JavaScript, carry the current query and section to the matching page. */
(function () {
  'use strict';

  function init() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.language-switcher a[data-lang]'));
    var destinations = links.map(function (link) {
      return new URL(link.getAttribute('href'), document.baseURI);
    });

    // GitHub Pages serves the root 404 document for missing URLs in either
    // language. Select its generated Chinese counterpart from the URL path.
    if (document.body.dataset.pageKey === 'page.404' && document.documentElement.lang !== 'zh-CN') {
      for (var i = 0; i < links.length; i++) {
        var errorPage = destinations[i];
        var suffix = '/zh/404.html';
        if (links[i].getAttribute('data-lang') !== 'zh-CN' || errorPage.origin !== window.location.origin || errorPage.pathname.slice(-suffix.length) !== suffix) continue;
        var prefix = errorPage.pathname.slice(0, -suffix.length);
        if (window.location.pathname.indexOf(prefix + '/zh/') === 0 && window.location.pathname !== errorPage.pathname) {
          var original = window.location.pathname + window.location.search + window.location.hash;
          errorPage.search = '';
          errorPage.hash = '';
          errorPage.searchParams.set('from', original);
          window.location.replace(errorPage.href);
          return;
        }
      }
    }

    function updateLinks() {
      links.forEach(function (link, index) {
        var destination = destinations[index];
        if (destination.origin !== window.location.origin) return;
        destination.search = window.location.search;
        destination.hash = window.location.hash;
        link.href = destination.href;
      });
    }

    updateLinks();
    links.forEach(function (link) { link.addEventListener('click', updateLinks); });
    window.addEventListener('hashchange', updateLinks);
    window.addEventListener('popstate', updateLinks);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
