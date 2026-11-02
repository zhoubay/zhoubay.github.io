/* Temporary, local-only lake toys. One shared animation clock; no network calls. */
(function () {
  'use strict';

  window.LakePrizeEffects = function (host) {
    var root = host.root;
    var layer = document.createElement('div');
    layer.className = 'after-hours__effects';
    host.stage.appendChild(layer);
    var duckBubble = document.createElement('div');
    duckBubble.className = 'after-hours__duck-bubble';
    duckBubble.id = 'lake-duck-bubble';
    duckBubble.setAttribute('role', 'status');
    duckBubble.setAttribute('aria-live', 'polite');
    duckBubble.setAttribute('aria-atomic', 'true');
    duckBubble.hidden = true;
    duckBubble.innerHTML = '<span lang="en"></span><span lang="zh-CN"></span>';
    host.stage.appendChild(duckBubble);
    var scene = document.createElement('section');
    scene.className = 'after-hours__prize-scene';
    scene.setAttribute('aria-labelledby', 'lake-prize-title');
    scene.hidden = true;
    scene.innerHTML = '<button class="after-hours__scene-close" type="button" aria-label="Put away / 收起来">×</button>' +
      '<div class="after-hours__scene-art" aria-hidden="true"></div>' +
      '<p class="after-hours__scene-title" id="lake-prize-title"><span lang="en"></span><span lang="zh-CN"></span></p>' +
      '<div role="status" aria-live="polite" aria-atomic="true"><p class="after-hours__scene-copy"><span lang="en"></span><span lang="zh-CN"></span></p></div>' +
      '<div class="after-hours__scene-countdown" aria-hidden="true" hidden></div>' +
      '<div class="after-hours__scene-actions"><button class="after-hours__toy-action" type="button" hidden><span lang="en"></span><span lang="zh-CN"></span></button></div>';
    host.stage.appendChild(scene);
    var art = scene.querySelector('.after-hours__scene-art');
    var title = scene.querySelector('.after-hours__scene-title');
    var copy = scene.querySelector('.after-hours__scene-copy');
    var countdown = scene.querySelector('.after-hours__scene-countdown');
    var action = scene.querySelector('.after-hours__scene-actions button');
    var close = scene.querySelector('.after-hours__scene-close');
    var current = null;
    var onAction = null;
    var objects = {};
    var jobs = {};
    var elapsed = 0;
    var reducedTimer = 0;
    var sunStep = 0;
    var sunsetProgress = 0;
    var duckRemark = 0;
    var lakeBounds = null;
    var crewDuckRemark = ['Racing to a Nature deadline?', '赶着去投 Nature 啊？'];
    var chaseDuckRemark = ['Wait for me! I can be the corresponding author.', '带我一个，我负责通讯。'];
    var duckRemarks = [
      ['Works on my pond.', '在我的池塘里能运行啊。'],
      ['Explain the bug slowly. I bill by the quack.', '慢慢讲这个 bug。我按叫声收费。'],
      ['Have you tried turning your weekend off and on again?', '试过把周末关掉，再重新打开吗？'],
      ['I reviewed your code. The comments are very optimistic.', '代码看完了。注释写得很乐观。'],
      ['That is not a bug. It is a future paper.', '这不是 bug，这是下一篇论文的选题。'],
      ['One more ablation? I would rather have one more breadcrumb.', '再补一个消融实验？我选再来一块面包。'],
      ['My diagnosis: you need a break. The code can wait.', '诊断结果：你需要休息。代码可以等。']
    ];
    var lastTick = performance.now();
    var wasPaused = true;

    function pair(element, en, zh) {
      element.querySelector('[lang="en"]').textContent = en;
      element.querySelector('[lang="zh-CN"]').textContent = zh;
    }

    function find(id) {
      return host.prizes.filter(function (prize) { return prize.id === id; })[0];
    }

    function say(id, en, zh) {
      if (current !== id || scene.hidden) return;
      pair(copy, en, zh);
    }

    function button(en, zh, handler) {
      action.hidden = !handler;
      action.disabled = false;
      onAction = handler;
      if (handler) pair(action, en, zh);
    }

    function hideDuckBubble() {
      duckBubble.hidden = true;
      duckBubble.classList.remove('is-speaking');
      delete jobs['duck-speech'];
      if (objects.duck) objects.duck.element.setAttribute('aria-expanded', 'false');
    }

    function dismiss(focus) {
      var wasOpen = !scene.hidden || !duckBubble.hidden;
      root.classList.remove('has-prize-scene');
      hideDuckBubble();
      scene.hidden = true;
      scene.classList.remove('is-returning');
      current = null;
      onAction = null;
      sync();
      if (focus && wasOpen) host.focus();
    }

    function show(prize) {
      dismiss(false);
      current = prize.id;
      scene.dataset.prize = prize.id;
      scene.hidden = false;
      root.classList.add('has-prize-scene');
      art.innerHTML = prize.art; // Repository-owned SVG only.
      pair(title, prize.en, prize.zh);
      pair(copy, prize.detailEn, prize.detailZh);
      countdown.hidden = true;
      button('', '', null);
    }

    function object(id, svg) {
      if (objects[id]) objects[id].element.remove();
      var element = document.createElement(id === 'duck' ? 'button' : 'div');
      element.className = 'after-hours__effect-object after-hours__effect-object--' + id;
      if (id === 'duck') {
        element.type = 'button';
        element.setAttribute('aria-label', 'Ask the debugging duck / 问问橡皮鸭');
        element.setAttribute('aria-controls', duckBubble.id);
        element.setAttribute('aria-expanded', 'false');
      } else {
        element.setAttribute('aria-hidden', 'true');
      }
      element.innerHTML = svg || find(id).art;
      layer.appendChild(element);
      objects[id] = { element: element, born: elapsed };
      return objects[id];
    }

    function removeObject(id) {
      if (!objects[id]) return;
      objects[id].element.remove();
      delete objects[id];
    }

    function schedule(id, duration, done, update) {
      // A reduced-motion visitor may read an idle card before starting its timer.
      if (!Object.keys(jobs).length) lastTick = performance.now();
      jobs[id] = { age: 0, duration: duration, done: done, update: update };
      sync();
    }

    function setSunset(amount) {
      sunsetProgress = amount;
      host.sunset(amount);
    }

    function sync() {
      if (host.reduced() && objects.duck && objects.duck.encounter) {
        var encounter = objects.duck.encounter;
        clearDuckEncounter();
        if (encounter.phase !== 'speak' && encounter.phase !== 'return') speakDuck(encounter.remark || crewDuckRemark);
      }
      if (host.reduced() && jobs.friday) {
        delete jobs.friday;
        setSunset(1);
      }
      var paused = host.paused();
      if (paused !== wasPaused) { lastTick = performance.now(); wasPaused = paused; }
      root.classList.toggle('has-prize-pause', paused);
      // Reduced motion stops the lake RAF, but timed jokes still need a clock.
      if (host.reduced() && Object.keys(jobs).length) {
        if (!reducedTimer) {
          reducedTimer = window.setInterval(function () {
            tick();
            if (!host.paused()) host.changed();
          }, 100);
        }
      } else if (reducedTimer) {
        window.clearInterval(reducedTimer);
        reducedTimer = 0;
      }
    }

    function tick() {
      var now = performance.now();
      var delta = (now - lastTick) / 1000;
      lastTick = now;
      if (host.paused()) return;
      // Real elapsed time for punchlines; bounded steps for floating scenery.
      // Physics can slow down on a busy device without making “two seconds” longer.
      elapsed += Math.min(delta, 0.05);
      // Hover and speech pause patrol; retained click/keyboard focus never does.
      var duck = objects.duck;
      if (duck && duckBubble.hidden && !duck.hovered && (!duck.encounter || duck.encounter.phase === 'approach')) {
        duck.patrol += Math.min(delta, 0.05);
      }
      updateDuckEncounter(Math.min(delta, 0.05));
      Object.keys(jobs).forEach(function (id) {
        var job = jobs[id];
        if (!job) return;
        job.age += delta;
        var progress = Math.min(1, job.age / job.duration);
        if (job.update) job.update(progress);
        if (progress === 1 && jobs[id] === job) {
          delete jobs[id];
          job.done();
        }
      });
      sync();
    }

    function speakDuck(remark) {
      hideDuckBubble();
      pair(duckBubble, remark[0], remark[1]);
      duckBubble.hidden = false;
      objects.duck.element.setAttribute('aria-expanded', 'true');
      host.changed();
      // Replay one small pop for every line, even when the last one is still up.
      void duckBubble.offsetWidth;
      duckBubble.classList.add('is-speaking');
      schedule('duck-speech', 4.5, hideDuckBubble);
    }

    function askDuck() {
      if (host.paused() || !find('duck') || !objects.duck) return;
      var remark = duckRemarks[duckRemark++ % duckRemarks.length];
      var encounter = objects.duck.encounter;
      if (encounter && ['notice', 'yield'].indexOf(encounter.phase) >= 0) {
        // Finish the short maneuver before speaking, so text never rides along.
        encounter.remark = remark;
        return;
      }
      dismiss(false);
      if (encounter && ['wake', 'chase', 'return'].indexOf(encounter.phase) >= 0) duckPhase('speak');
      speakDuck(remark);
    }

    function clearDuckEncounter() {
      var duck = objects.duck;
      if (!duck) return;
      duck.encounter = null;
      duck.alert.hidden = true;
      duck.element.removeAttribute('data-crew-reaction');
      duck.element.style.removeProperty('--duck-wake-opacity');
      duck.element.style.removeProperty('--duck-wake-scale');
    }

    function duckPhase(phase, duration, x, y) {
      var duck = objects.duck;
      var encounter = duck.encounter;
      encounter.phase = phase;
      encounter.age = 0;
      encounter.duration = duration || 1;
      encounter.fromX = encounter.x;
      encounter.fromY = encounter.y;
      encounter.toX = x === undefined ? encounter.x : x;
      encounter.toY = y === undefined ? encounter.y : y;
      encounter.roll = 0;
      encounter.lift = 0;
      duck.alert.hidden = phase !== 'notice';
      duck.element.dataset.crewReaction = phase;
    }

    function crewStarted() {
      var duck = objects.duck;
      if (!duck) return;
      if (host.reduced()) {
        clearDuckEncounter();
        speakDuck(crewDuckRemark);
        return;
      }
      var previous = duck.encounter;
      duck.encounter = {
        x: previous ? previous.x : 0, y: previous ? previous.y : 0,
        chase: Math.random() < 0.15, roll: 0, lift: 0
      };
      duckPhase('approach');
    }

    function finishDuckManeuver() {
      var duck = objects.duck;
      var encounter = duck.encounter;
      // An unrelated toy card takes priority over an automatic punchline.
      if (!scene.hidden) { duckPhase('return', 1.4, 0, 0); return; }
      duckPhase('speak');
      speakDuck(encounter.remark || (encounter.chased ? chaseDuckRemark : crewDuckRemark));
      encounter.remark = null;
    }

    function updateDuckEncounter(delta) {
      var duck = objects.duck;
      if (!duck || !duck.encounter || !duck.pose || !lakeBounds) return;
      var encounter = duck.encounter;
      var crew = host.crew();
      var pose = duck.pose;
      var bounds = lakeBounds;
      if (crew.state === 'idle' && encounter.phase !== 'return' && encounter.phase !== 'speak') {
        encounter.remark = null;
        duckPhase('return', 1.4, 0, 0);
      }
      if (encounter.phase === 'approach') {
        if (crew.state !== 'rowing') { finishDuckManeuver(); return; }
        if (crew.bow < pose.x - crew.speed * 1.4) return;
        hideDuckBubble();
        // A duck near the left edge gets a shorter warning and a quicker dodge.
        var available = Math.max(0.16, Math.min(1.05, (pose.x - crew.bow) / crew.speed - 0.08));
        encounter.noticeTime = Math.min(0.35, available * 0.3);
        encounter.yieldTime = Math.max(0.11, available - encounter.noticeTime);
        var bottom = bounds.captionTop - pose.h - 16;
        var targetY = Math.min(bottom, Math.max(pose.y + pose.h * 1.25, crew.waterline + crew.width * 0.1));
        // On shallow screens use the far side of the lane instead of the controls.
        if (targetY - pose.y < pose.h * 0.45) targetY = Math.max(8, bounds.surface - pose.h * 0.58);
        var targetX = Math.min(bounds.width - pose.w - 12, pose.x + pose.w * 0.3);
        encounter.safeX = (targetX - pose.baseX) / bounds.width;
        encounter.safeY = (targetY - pose.baseY) / bounds.height;
        duckPhase('notice', encounter.noticeTime);
        return;
      }
      if (encounter.phase === 'speak') {
        if (duckBubble.hidden) duckPhase('return', 1.4, 0, 0);
        return;
      }
      if (encounter.phase === 'wait') {
        if (encounter.remark && duckBubble.hidden) {
          speakDuck(encounter.remark);
          encounter.remark = null;
        }
        if (duckBubble.hidden && (crew.state !== 'rowing' || crew.stern > pose.x + pose.w)) duckPhase('wake', 1.1);
        return;
      }
      // Yielding takes priority over hover; once safe, hover/speech pause motion.
      if (encounter.phase !== 'notice' && encounter.phase !== 'yield' && (duck.hovered || !duckBubble.hidden)) return;
      encounter.age += delta;
      var progress = Math.min(1, encounter.age / encounter.duration);
      var eased = progress * progress * (3 - 2 * progress);
      if (encounter.phase === 'notice') {
        if (progress === 1) duckPhase('yield', encounter.yieldTime, encounter.safeX, encounter.safeY);
      } else if (encounter.phase === 'yield' || encounter.phase === 'chase' || encounter.phase === 'return') {
        encounter.x = encounter.fromX + (encounter.toX - encounter.fromX) * eased;
        encounter.y = encounter.fromY + (encounter.toY - encounter.fromY) * eased;
        if (progress === 1) {
          if (encounter.phase === 'yield') duckPhase('wait');
          else if (encounter.phase === 'chase') finishDuckManeuver();
          else clearDuckEncounter();
        }
      } else if (encounter.phase === 'wake') {
        // Two diminishing rocks, driven by the same paused clock as the lake.
        encounter.roll = Math.sin(progress * Math.PI * 4) * 12 * (1 - progress);
        encounter.lift = -Math.sin(progress * Math.PI * 4) * 5 * (1 - progress);
        if (progress === 1) {
          var distance = Math.min(150, bounds.width * 0.26, bounds.width - pose.w - 12 - pose.x);
          if (encounter.chase && distance > 30) {
            encounter.chased = true;
            duckPhase('chase', 0.9, encounter.x + distance / bounds.width, encounter.y);
          } else finishDuckManeuver();
        }
      }
    }

    function positionDuckBubble(x, y, width, height, bounds) {
      if (duckBubble.hidden) return;
      var bubbleWidth = duckBubble.offsetWidth;
      var bubbleHeight = duckBubble.offsetHeight;
      var anchor = x + width / 2;
      var left = Math.max(12, Math.min(bounds.width - bubbleWidth - 12, anchor - bubbleWidth / 2));
      var above = y - bubbleHeight - 10 >= 12;
      var top = above ? y - bubbleHeight - 10 : y + height + 10;
      top = Math.max(12, Math.min(bounds.height - bubbleHeight - 12, top));
      duckBubble.dataset.placement = above ? 'above' : 'below';
      duckBubble.style.left = left.toFixed(1) + 'px';
      duckBubble.style.top = top.toFixed(1) + 'px';
      duckBubble.style.setProperty('--duck-tail-x', Math.max(18, Math.min(bubbleWidth - 18, anchor - left)).toFixed(1) + 'px');
    }

    function spawnDuck() {
      if (objects.duck) return;
      var duck = object('duck');
      duck.patrol = elapsed;
      duck.hovered = false;
      duck.encounter = null;
      duck.alert = document.createElement('span');
      duck.alert.className = 'after-hours__duck-alert';
      duck.alert.setAttribute('aria-hidden', 'true');
      duck.alert.textContent = '!';
      duck.alert.hidden = true;
      duck.element.appendChild(duck.alert);
      function updateHover(event) {
        duck.hovered = event.type === 'pointerenter' && event.pointerType !== 'touch';
        duck.element.classList.toggle('is-hovered', duck.hovered);
      }
      duck.element.addEventListener('pointerenter', updateHover);
      duck.element.addEventListener('pointerleave', updateHover);
      duck.element.addEventListener('pointercancel', updateHover);
      duck.element.addEventListener('click', askDuck);
    }

    function mail() {
      host.boats.forEach(function (boat) {
        if (boat.element.querySelector('.after-hours__mail')) return;
        var envelope = document.createElement('span');
        envelope.className = 'after-hours__mail';
        envelope.setAttribute('aria-hidden', 'true');
        envelope.textContent = '✉';
        boat.element.appendChild(envelope);
      });
    }

    function jackets() {
      host.boats.forEach(function (boat) {
        if (boat.element.querySelector('.after-hours__jacket')) return;
        var jacket = document.createElement('span');
        jacket.className = 'after-hours__jacket';
        jacket.setAttribute('aria-hidden', 'true');
        boat.element.appendChild(jacket);
      });
    }

    var recycledBoat = '<svg viewBox="0 0 120 90" fill="none" aria-hidden="true"><ellipse cx="60" cy="78" rx="48" ry="5" fill="#194e60" opacity=".15"/><path d="m23 51 37-41 37 41" fill="#fffaf0"/><path d="M60 10v48l37-7Z" fill="#e3dcc8"/><path d="m8 50 52 12 52-12-22 26H30Z" fill="#f9ead0"/><path d="m8 50 52 12-30 14Z" fill="#fffaf0"/><path d="m112 50-52 12 30 14Z" fill="#c3b799"/><path d="m49 37 16 5m-20 1 20 5" stroke="#d28670" stroke-width="2"/></svg>';
    var gpuTree = '<svg viewBox="0 0 120 100" fill="none" aria-hidden="true"><ellipse cx="60" cy="90" rx="34" ry="7" fill="#194e60" opacity=".15"/><path d="M60 88V38m0 26L30 43m30 12 29-23" stroke="#8b8060" stroke-width="7" stroke-linecap="round"/><path d="M44 87h32l-4 9H48Z" fill="#d4ae76"/>' +
      '<g fill="#89af98" stroke="#315e59" stroke-width="2"><rect x="12" y="23" width="31" height="24" rx="5"/><rect x="74" y="13" width="31" height="24" rx="5"/><rect x="45" y="10" width="27" height="24" rx="5"/></g>' +
      '<g fill="#f3d78b"><rect x="21" y="29" width="13" height="12" rx="2"/><rect x="83" y="19" width="13" height="12" rx="2"/><rect x="52" y="16" width="13" height="12" rx="2"/></g><path d="M17 47v5m7-5v5m7-5v5m7-5v5m41-15v5m7-5v5m7-5v5m7-5v5M50 34v5m7-5v5m7-5v5" stroke="#dbb859" stroke-width="2"/></svg>';

    var radarArt = '<svg viewBox="0 0 160 130" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="80" cy="120" rx="52" ry="5" fill="#294f57" opacity=".09"/>' +
      '<path d="m53 105-9 13m63-13 9 13" stroke="#34575c" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="80" cy="61" r="53" fill="#365a5d" stroke="#34575c" stroke-width="2"/>' +
      '<circle cx="80" cy="61" r="46" fill="#c2d9bf" stroke="#edf1d9" stroke-width="2"/>' +
      '<g stroke="#83ad94" stroke-width="1"><circle cx="80" cy="61" r="31"/><circle cx="80" cy="61" r="16"/>' +
      '<path d="M80 15v92M34 61h92M48 29l64 64m0-64L48 93"/></g>' +
      '<g class="lake-radar-sweep" transform="rotate(0 80 61)"><path d="M80 61V15a46 46 0 0 1 32.5 13.5Z" fill="#f6e1a0" opacity=".8"/>' +
      '<path d="M80 61V15" stroke="#fff4c8" stroke-width="2"/></g>' +
      '<circle cx="80" cy="61" r="3" fill="#567f70"/>' +
      '<g class="lake-radar-target" transform="translate(112 32)"><circle r="10" fill="#d96f55" opacity=".2"/>' +
      '<circle r="4.5" fill="#c55d49" stroke="#fff1cb" stroke-width="1.5"/></g>' +
      '<g class="lake-radar-duck" transform="translate(80 61) scale(.7)" hidden>' +
      '<path d="M10-6c-7-7-4-18 5-19 11-1 16 10 9 17 12 3 14 14 4 20-14 8-38 3-43-9l-8-12L-7-3c4-5 11-6 17-3Z" fill="#efc86e" stroke="#34575c" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="m24-18 10 5-11 3" fill="#dc8c59" stroke="#34575c" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="18" cy="-17" r="2" fill="#34575c"/><path d="M-4 1c7-3 13 1 18 7-11 5-19 0-18-7Z" fill="#f7dda0" stroke="#c39a4f" stroke-width="1.5"/>' +
      '<path d="M-22 19c7-4 12 3 19 0m23 0c7-4 12 3 19 0" stroke="#7fa9a1" stroke-width="2" stroke-linecap="round"/></g>' +
      '<circle cx="118" cy="104" r="3" fill="#f1d78a"/></svg>';

    function scanRadar() {
      if (current !== 'radar' || scene.hidden) return;
      art.innerHTML = radarArt;
      var display = art.firstElementChild;
      var sweep = display.querySelector('.lake-radar-sweep');
      var target = display.querySelector('.lake-radar-target');
      var duck = display.querySelector('.lake-radar-duck');
      say('radar', 'Boss approaching. Look busy!', '老板正在靠近！快装忙！');
      button('', '', null);
      close.focus({ preventScroll: true });
      function isCurrentScan() { return current === 'radar' && !scene.hidden && art.firstElementChild === display; }
      schedule('radar', 2, function () {
        if (!isCurrentScan()) return;
        target.setAttribute('hidden', '');
        duck.removeAttribute('hidden');
        sweep.setAttribute('opacity', '.45');
        say('radar', 'False alarm. It’s a duck. A very senior duck.', '识别错误，是一只鸭子。看起来资历很深。');
        button('Scan again', '再扫描一次', scanRadar);
      }, function (progress) {
        if (!isCurrentScan() || host.reduced()) return;
        sweep.setAttribute('transform', 'rotate(' + (progress * 330).toFixed(1) + ' 80 61)');
        target.setAttribute('transform', 'translate(' + (112 - progress * 26).toFixed(1) + ' ' + (32 + progress * 24).toFixed(1) + ')');
      });
    }

    function start(prize) {
      if (prize.enabled === false) return;
      host.prepare();
      if (prize.id === 'duck') {
        spawnDuck();
        askDuck();
        objects.duck.element.focus({ preventScroll: true });
        return;
      }
      show(prize);
      var id = prize.id;
      // Re-using a prize replaces its pending sequence, never stacks timers/nodes.
      if (id !== 'friday') delete jobs[id];
      switch (id) {
        case 'blackhole':
          delete jobs['hole-exit'];
          host.boats.forEach(function (boat) { if (boat.absorbed) boat.absorbed = 1; });
          var victim = host.boats.filter(function (boat) { return !boat.absorbed; })[0];
          if (!victim) {
            say(id, 'Out of papers. Try fishing them back first.', '论文吸完了。先捞回来，再吸。');
            break;
          }
          var hole = object('blackhole');
          hole.boat = victim;
          victim.absorbed = host.reduced() ? 1 : 0.001;
          host.rescue();
          say(id, 'It said “absorbs stress.” Apparently, papers count.', '包装写着“吸收科研压力”。看来论文也算。');
          schedule(id, host.reduced() ? 0.1 : 1.4, function () {
            victim.absorbed = 1;
            schedule('hole-exit', 1.5, function () { removeObject('blackhole'); });
          }, function (p) { victim.absorbed = host.reduced() ? 1 : p; });
          break;
        case 'friday':
          root.classList.add('has-friday');
          if (host.reduced()) setSunset(1);
          else if (sunsetProgress < 1 && !jobs.friday) {
            schedule('friday', 5, function () { setSunset(1); }, function (p) {
              setSunset(p * p * (3 - 2 * p));
            });
          }
          say(id, 'Friday, uncorked. Best before the next message from your boss.', '星期五已开瓶。保质期：直到老板发消息。');
          break;
        case 'radar':
          scanRadar();
          break;
        case 'letter':
          say(id, 'Until you open it, consider it accepted.', '打开之前，默认接收。');
          button('Open the letter', '拆开通知', function () {
            say(id, 'Still under review.', '仍在审稿中。');
            button('Check again', '再查一次', function () {
              say(id, 'Still. Under. Review.', '依。然。在。审。');
            });
          });
          break;
        case 'warmer':
          object('warmer');
          say(id, 'No VRAM for you. The residual heat is free.', '显存没有你的份，余温可以。');
          break;
        case 'seed':
          var seed = object('seed');
          say(id, 'Plant a seed. Grow a waiting list.', '种下一粒种子，收获一整棵等待名单。');
          schedule(id, host.reduced() ? 0.1 : 1.3, function () {
            seed.element.innerHTML = gpuTree + '<span class="after-hours__effect-badge"><span lang="en">All queued</span><span lang="zh-CN">全部排队中</span></span>';
            say(id, 'A whole GPU tree. Every fruit is queued.', '长出了一棵 GPU 树。每个果子都在排队中。');
          }, function (p) { seed.scale = host.reduced() ? 1 : 0.35 + p * 0.65; });
          break;
        case 'remote':
          say(id, sunStep >= 2 ? 'Two extensions used. The sun has clocked out.' : 'Two snoozes. A very limited warranty.',
            sunStep >= 2 ? '两次额度已用完，太阳也要下班。' : '限延期两次。适用范围极其有限。');
          button(sunStep >= 2 ? 'Ask for one more?' : 'Snooze the deadline', sunStep >= 2 ? '再求一次？' : '延期一下', function () {
            if (sunStep >= 2) {
              say(id, 'Extension denied. The sun has a life outside academia.', '延期失败：太阳也要下班，不接受第三次加班。');
              pair(action, 'No extensions left', '延期额度已用完');
              action.disabled = true;
              close.focus({ preventScroll: true });
              return;
            }
            sunStep += 1;
            // A visible rewind, bounded to the sky even on a narrow phone.
            root.style.setProperty('--lake-sun-x', 'max(' + (-sunStep * 96) + 'px, ' + (-sunStep * 14) + 'vw)');
            root.style.setProperty('--lake-sun-y', 'max(' + (-sunStep * 18) + 'px, ' + (-sunStep * 2) + 'vh)');
            root.classList.add('has-deadline');
            say(id, 'The sun went back. Your deadline didn’t.', '太阳倒回了，截止日期照旧。仅对太阳有效。');
            if (sunStep === 2) pair(action, 'Ask for one more?', '再求一次？');
          });
          break;
        case 'noodles':
          say(id, 'Ready in three minutes. Tiny-lake time: 30× faster.', '预计三分钟。湖边小剧场：时间加速 30 倍。');
          button('Start cooking', '开始泡面', function cook() {
            button('', '', null);
            close.focus({ preventScroll: true });
            countdown.hidden = false;
            countdown.textContent = '03:00';
            say(id, 'Cooking… three minutes in six seconds.', '正在泡面……小剧场里，三分钟等于六秒。');
            schedule(id, 6, function () {
              if (current !== id) return;
              countdown.textContent = '03:00';
              say(id, 'Estimated time remaining: another three minutes.', '预计还需三分钟。');
              button('Wait another three minutes', '那就再等三分钟', cook);
            }, function (p) {
              if (current !== id) return;
              var seconds = Math.max(0, Math.ceil(180 * (1 - p)));
              countdown.textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
            });
          });
          break;
        case 'recycler':
          var recycled = object('recycler');
          say(id, 'Processing reviewer feedback into something useful…', '正在把审稿意见加工成有用的东西……');
          schedule(id, host.reduced() ? 0.1 : 1, function () {
            recycled.element.innerHTML = recycledBoat;
            recycled.scale = 1;
            say(id, 'At least it floats now.', '至少它现在能浮起来。');
          }, function (p) { recycled.scale = host.reduced() ? 1 : 1 - Math.sin(p * Math.PI) * 0.65; });
          break;
        case 'die':
          button('Roll for authorship', '摇一下作者排序', function () {
            mail();
            say(id, 'Corresponding author. Congratulations on your new inbox.', '通讯作者。恭喜，收件箱归你了。');
            button('Roll again', '再摇一次', function () {
              say(id, 'Still the corresponding author. The die has six identical sides.', '还是通讯作者。这颗骰子的六面是一样的。');
            });
          });
          break;
        case 'bottle':
          say(id, '“You worked hard. Get some rest.”', '“辛苦了，早点休息。”');
          var flipped = false;
          button('Turn the note over', '翻到背面', function () {
            flipped = !flipped;
            say(id, flipped ? '“Oh, and just one more experiment.”' : '“You worked hard. Get some rest.”', flipped ? '“顺便再补一个实验。”' : '“辛苦了，早点休息。”');
            pair(action, flipped ? 'Turn it back' : 'Turn the note over', flipped ? '翻回正面' : '翻到背面');
          });
          break;
        case 'undo':
          button('Press Ctrl+Z', '按下 Ctrl+Z', function () {
            action.disabled = true;
            scene.classList.add('is-returning');
            schedule(id, host.reduced() ? 0.1 : 0.6, function () {
              if (current !== id) return;
              dismiss(false);
              host.returnPrize();
            });
          });
          break;
        case 'jackets':
          jackets();
          say(id, 'Experiments may sink. Papers need not.', '实验可以沉，论文不能。');
          break;
      }
      (action.hidden ? close : action).focus({ preventScroll: true });
      sync();
      host.changed();
    }

    function render(bounds) {
      lakeBounds = bounds;
      Object.keys(objects).forEach(function (id) {
        var item = objects[id];
        var element = item.element;
        var w = element.offsetWidth;
        var h = element.offsetHeight;
        var x = bounds.width * 0.5 - w / 2;
        var y = bounds.surface + 18;
        var encounter = id === 'duck' ? item.encounter : null;
        var roll = 0;
        if (id === 'duck') {
          x = host.reduced() ? bounds.width * 0.24 : (bounds.width - w - 24) * (0.5 + Math.sin(item.patrol * 0.24) * 0.48) + 12;
          y = Math.max(8, Math.min(bounds.captionTop - h - 12, y));
          item.pose = { baseX: x, baseY: y, w: w, h: h };
          var facing = !host.reduced() && Math.cos(item.patrol * 0.24) < 0 ? -1 : 1;
          if (encounter) {
            x += encounter.x * bounds.width;
            y += encounter.y * bounds.height + encounter.lift;
            roll = encounter.roll;
            if (encounter.phase === 'notice' || encounter.phase === 'yield' || encounter.phase === 'wait') facing = -1;
            else if (encounter.phase !== 'approach' && encounter.phase !== 'return') facing = 1;
            var moving = encounter.phase === 'yield' || encounter.phase === 'chase';
            element.style.setProperty('--duck-wake-opacity', moving ? '0.7' : encounter.phase === 'wake' ? String(0.55 * (1 - encounter.age / encounter.duration)) : '0');
            element.style.setProperty('--duck-wake-scale', String(1 + 0.12 * Math.sin(encounter.age * 18)));
          }
          element.style.setProperty('--lake-duck-facing', facing);
        } else if (id === 'blackhole' && item.boat) {
          x = item.boat.x + item.boat.size / 2 - w / 2;
          y = item.boat.y + item.boat.size * 0.35 - h / 2;
        } else if (id === 'warmer') x = bounds.width * 0.79 - w / 2;
        else if (id === 'seed') { x = bounds.width * 0.15 - w / 2; y = bounds.surface - h * 0.5; }
        else if (id === 'recycler') { x = bounds.width * 0.58 - w / 2; y += 34; }
        x = Math.max(8, Math.min(bounds.width - w - 8, x));
        y = Math.max(8, Math.min(bounds.captionTop - h - 12, y));
        element.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + roll.toFixed(2) + 'deg) scale(' + (item.scale || 1) + ')';
        if (id === 'duck') {
          item.pose.x = x;
          item.pose.y = y;
          positionDuckBubble(x, y, w, h, bounds);
        }
      });
    }

    function restoreBoats() {
      delete jobs.blackhole;
      delete jobs['hole-exit'];
      removeObject('blackhole');
      host.boats.forEach(function (boat) { boat.absorbed = 0; });
      sync();
    }

    function reset() {
      dismiss(false);
      jobs = {};
      Object.keys(objects).forEach(removeObject);
      restoreBoats();
      host.boats.forEach(function (boat) {
        Array.prototype.forEach.call(boat.element.querySelectorAll('.after-hours__mail, .after-hours__jacket'), function (node) { node.remove(); });
      });
      root.classList.remove('has-friday', 'has-deadline', 'has-prize-pause');
      root.style.removeProperty('--lake-sun-x');
      root.style.removeProperty('--lake-sun-y');
      elapsed = 0;
      sunStep = 0;
      duckRemark = 0;
      setSunset(0);
      sync();
    }

    action.addEventListener('click', function () {
      if (onAction && !host.paused()) { onAction(); sync(); host.changed(); }
    });
    close.addEventListener('click', function () { dismiss(true); });
    this.crewStarted = crewStarted;
    this.start = start;
    this.tick = tick;
    this.render = render;
    this.sync = sync;
    this.dismiss = dismiss;
    this.isOpen = function () { return !scene.hidden || !duckBubble.hidden; };
    this.sweep = function () {
      delete jobs.recycler;
      removeObject('recycler');
      sync();
    };
    this.restoreBoats = restoreBoats;
    this.reset = reset;
  };
})();
