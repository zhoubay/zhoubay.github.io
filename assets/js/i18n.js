/* Page language comes from its URL and the server-rendered HTML lang attribute. */
(function () {
  'use strict';

  var isChinese = /^zh(?:-|$)/i.test(document.documentElement.lang || 'en');
  function choose(en, zh) { return isChinese ? zh : en; }

  window.SiteI18n = {
    isChinese: isChinese,
    choose: choose,
    popup: {
      tClose: choose('Close (Esc)', '关闭（Esc）'),
      tLoading: choose('Loading…', '加载中…'),
      gallery: {
        tPrev: choose('Previous (Left arrow key)', '上一张（左方向键）'),
        tNext: choose('Next (Right arrow key)', '下一张（右方向键）'),
        tCounter: choose('%curr% of %total%', '第 %curr% 张，共 %total% 张')
      },
      image: {
        tError: choose('The <a href="%url%">image</a> could not be loaded.', '无法加载<a href="%url%">图片</a>。')
      }
    }
  };
})();
