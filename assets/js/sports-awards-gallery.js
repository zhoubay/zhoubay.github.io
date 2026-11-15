/* Keep award photos in a native, keyboard-accessible horizontal carousel. */
(function () {
  'use strict';

  function initGallery(carousel) {
    var track = carousel.querySelector('[data-gallery-track]');
    var controls = carousel.querySelector('[data-gallery-controls]');
    var previous = carousel.querySelector('[data-gallery-prev]');
    var next = carousel.querySelector('[data-gallery-next]');
    var status = carousel.querySelector('[data-gallery-status]');
    if (!track || !controls || !previous || !next || !status) return;

    var photos = Array.prototype.slice.call(track.querySelectorAll('.sports-award__photo'));
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var frame = null;

    function update() {
      frame = null;
      var width = track.clientWidth;
      var limit = Math.max(0, track.scrollWidth - width);
      controls.hidden = !width || limit <= 2;
      previous.disabled = !width || track.scrollLeft <= 2;
      next.disabled = !width || track.scrollLeft >= limit - 2;
      if (!width || !photos.length) return;

      var left = track.getBoundingClientRect().left + track.clientLeft;
      var right = left + width;
      var visible = [];
      photos.forEach(function (photo, index) {
        var bounds = photo.getBoundingClientRect();
        if (bounds.right > left + 2 && bounds.left < right - 2) visible.push(index + 1);
      });
      if (visible.length) {
        var first = visible[0];
        var last = visible[visible.length - 1];
        var label = (first === last ? first : first + '\u2013' + last) + ' / ' + photos.length;
        if (status.textContent !== label) status.textContent = label;
      }
    }

    function scheduleUpdate() {
      if (frame === null) frame = window.requestAnimationFrame(update);
    }

    function scrollTo(left) {
      track.scrollTo({
        left: Math.max(0, Math.min(left, track.scrollWidth - track.clientWidth)),
        behavior: reducedMotion.matches ? 'auto' : 'smooth'
      });
    }

    function advance(direction) {
      if (!track.clientWidth || !photos.length) return;
      var first = photos[0].getBoundingClientRect();
      var step = photos.length > 1 ? photos[1].getBoundingClientRect().left - first.left : first.width;
      scrollTo(track.scrollLeft + direction * step);
    }

    previous.addEventListener('click', function () { advance(-1); });
    next.addEventListener('click', function () { advance(1); });
    track.addEventListener('scroll', scheduleUpdate, { passive: true });
    track.addEventListener('keydown', function (event) {
      if (event.target !== track || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft') advance(-1);
      else if (event.key === 'ArrowRight') advance(1);
      else if (event.key === 'Home') scrollTo(0);
      else if (event.key === 'End') scrollTo(track.scrollWidth);
      else return;
      event.preventDefault();
    });

    window.addEventListener('resize', scheduleUpdate);
    if ('ResizeObserver' in window) {
      var observer = new ResizeObserver(scheduleUpdate);
      observer.observe(track);
    }
    update();
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-award-carousel]'), initGallery);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
