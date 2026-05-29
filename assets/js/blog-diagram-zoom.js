function initBlogDiagramZoom() {
  var $canvases = $('.blog-diagram__canvas');
  if (!$canvases.length) return;

  var items = $canvases.map(function () {
    return {
      src: '<div class="mfp-diagram-zoom">' + $(this).html() + '</div>',
      type: 'inline'
    };
  }).get();

  $canvases.css('cursor', 'zoom-in').on('click', function (e) {
    e.preventDefault();
    $.magnificPopup.open({
      items: items,
      gallery: { enabled: items.length > 1 },
      type: 'inline',
      removalDelay: 300,
      mainClass: 'mfp-zoom-in mfp-diagram',
      closeOnContentClick: false,
      midClick: true
    }, $canvases.index(this));
  });
}
