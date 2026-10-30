/* A tiny lake for papers that have worked hard enough. Homepage only. */
(function () {
  'use strict';

  var root = document.querySelector('[data-after-hours]');
  if (!root) return;
  var stage = root.querySelector('.after-hours__stage');
  var canvas = root.querySelector('canvas');
  var context = canvas.getContext('2d');
  if (!context) return;

  var toggle = root.querySelector('.after-hours__toggle');
  var toggleLabel = root.querySelector('[data-after-hours-toggle-label]');
  var toggleEnglish = toggleLabel.querySelector('[lang="en"]');
  var toggleChinese = toggleLabel.querySelector('[lang="zh-CN"]');
  var message = root.querySelector('.after-hours__message');
  var caption = root.querySelector('.after-hours__caption');
  var fleet = root.querySelector('.after-hours__fleet');
  var note = root.querySelector('.after-hours__note');
  var noteEnglish = note.querySelector('[lang="en"]');
  var noteChinese = note.querySelector('[lang="zh-CN"]');
  var currentNote;
  var menuButton = root.querySelector('[data-lake-menu]');
  var toyMenu = root.querySelector('#lake-toy-menu');
  var vending = root.querySelector('.after-hours__vending');
  var vendButton = root.querySelector('[data-vend]');
  var vendingCrew = root.querySelector('[data-vending-crew]');
  var workScreen = root.querySelector('.after-hours__workscreen');
  var workMode = false;
  var overlayBackground = [];
  var vendingTimer;
  var lastPrize = -1;
  var crew = root.querySelector('.after-hours__crew');
  var crewRenderer = new window.LakeRowingCrew(crew.querySelector('svg'));
  var crewTravel = 6.8;
  var crewButton = root.querySelector('[data-lake-crew]');
  var rescue = root.querySelector('[data-lake-restore]');
  var crewState = 'idle';
  var crewClock = 0;
  var crewWidth = 700;
  var prizes = [
    { icon: 'coffee', en: 'A coffee, on the lab.', zh: '实验室请你喝咖啡。', detailEn: 'Best enjoyed with your tabs closed.', detailZh: '建议关掉论文标签页后饮用。' },
    { icon: 'gpu', en: 'One free GPU.', zh: '一张空闲 GPU 券。', detailEn: 'Valid in your imagination. No queue required.', detailZh: '仅限想象中使用，无需排队。' },
    { icon: 'ticket', en: 'Permission to clock out.', zh: '准时下班许可证。', detailEn: 'Signed by you. That counts.', detailZh: '本人签字，当场生效。' },
    { icon: 'note', en: '“Just one tiny revision.”', zh: '老板的“就改一点点”。', detailEn: 'The machine apologizes.', detailZh: '售货机对此表示抱歉。' },
    { icon: 'crew', en: 'A rowing break.', zh: '赛艇队体验券。', detailEn: 'Redeem it on the lake. Expect a splash.', detailZh: '去湖上兑现，小心浪花。', crew: true }
  ];
  var boss = root.querySelector('.after-hours__boss');
  var bossQuote = root.querySelector('.after-hours__boss-quote');
  var bossTranslation = root.querySelector('.after-hours__boss-translation');
  var bossClock = 0;
  var bossSweepAt = -1;
  var bossDone = true;
  var bossX = 0;
  var bossY = 0;
  var bossWidth = 260;
  var bossHeight = 164;
  var bossHold = 2.5;
  var paperFoldPending = false;
  var bossRequest = {
    en: 'The boss: One more experiment before you go?',
    zh: '老板：下班前，再跑一组实验？'
  };
  var bossDeparture = {
    en: 'The boss has drifted away. You’re off the clock.',
    zh: '老板已离岸。今天准时下班。'
  };
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var cards = Array.prototype.slice.call(document.querySelectorAll('#publications .pub-card'));
  var boats = [];
  var ripples = [];
  var paperCopies = [];
  var savedBackground = [];
  var savedBodyStyle;
  var savedFocus;
  var active = false;
  var closing = false;
  var closeTimer;
  var frame = 0;
  var lastTime = 0;
  var time = 0;
  var progress = 0;
  var width = 0;
  var height = 0;
  var surface = 0;
  var lastPointer = null;
  var messageIndex = 0;
  var messages = [
    { en: 'No more experiments. Just a few waves.', zh: '今天不加实验，只加一点浪。' },
    { en: 'The boss can’t catch this boat.', zh: '老板暂时追不上这艘船。' },
    { en: 'Papers find their shore. Ideas do too.', zh: '论文会靠岸，灵感也会。' },
    { en: 'One last task today: relax.', zh: '今天的最后一个任务：放松。' }
  ];
  var colors = [
    ['#f8f1df', '#d5c5a5', '#fffaf0'],
    ['#f5dfd2', '#d0a899', '#fff0e8'],
    ['#e4ebe2', '#a5b7a7', '#f3f7ed'],
    ['#e9e3f2', '#b4a6c4', '#f8f3ff']
  ];

  cards.forEach(function (card, index) {
    var title = card.querySelector('.pub-card__title');
    var name = card.dataset.paperBoatName || (title ? title.textContent.trim().split(':')[0] : 'Paper');
    var palette = colors[index % colors.length];
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'after-hours__boat';
    button.setAttribute('aria-label', 'Nudge the ' + name + ' paper boat / 推一推 ' + name + ' 纸船');
    // Only fixed SVG geometry and this local color palette enter markup.
    button.innerHTML = '<svg viewBox="0 0 160 110" fill="none" aria-hidden="true">' +
      '<ellipse cx="80" cy="99" rx="57" ry="5" fill="#163d49" opacity=".12"/>' +
      '<path d="M29 66 80 8l51 58Z" fill="' + palette[2] + '"/>' +
      '<path d="m80 8 0 58h51Z" fill="' + palette[0] + '"/>' +
      '<path d="m29 66 51-20 51 20Z" fill="' + palette[1] + '"/>' +
      '<path d="m7 64 73 12 73-12-29 34H38Z" fill="' + palette[0] + '"/>' +
      '<path d="m7 64 73 12-42 22Z" fill="' + palette[2] + '"/>' +
      '<path d="m153 64-73 12 44 22Z" fill="' + palette[1] + '" opacity=".65"/>' +
      '<path d="m80 8 0 38M7 64l73 12 73-12M38 98h86" stroke="#665d55" stroke-opacity=".2" stroke-width="1"/>' +
      '</svg>';
    var label = document.createElement('span');
    label.className = 'after-hours__boat-label';
    label.textContent = name.replace(/^PLM-guided-/, '');
    button.appendChild(label);
    fleet.appendChild(button);
    var boat = { element: button, card: card, name: name, index: index, x: 0, y: 0, size: 0, push: 0, velocity: 0, sweptAt: -1 };
    boats.push(boat);
    button.addEventListener('click', function () {
      if (!active) return;
      var rect = button.getBoundingClientRect();
      makeRipple(rect.left + rect.width / 2, rect.top + rect.height * 0.83, 1.4);
      boat.velocity += (index % 2 ? -1 : 1) * 55;
      setNote(messages[messageIndex++ % messages.length]);
      if (motionQuery.matches) draw();
    });
  });

  function setNote(copy) {
    currentNote = copy;
    noteEnglish.textContent = copy.en;
    noteChinese.textContent = copy.zh;
  }

  function toggleToyMenu(open) {
    var hadFocus = toyMenu.contains(document.activeElement);
    toyMenu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    if (open) toyMenu.querySelector('button').focus();
    else if (hadFocus) menuButton.focus();
  }

  function lockLakeFor(panel) {
    overlayBackground = [];
    Array.prototype.forEach.call(stage.children, function (element) {
      if (element === panel) return;
      overlayBackground.push({ element: element, inert: element.inert });
      element.inert = true;
    });
    toggle.inert = true;
  }

  function unlockLake() {
    overlayBackground.forEach(function (item) { item.element.inert = item.inert; });
    overlayBackground = [];
    toggle.inert = false;
  }

  function closeVending(focus) {
    if (vending.hidden) return;
    window.clearTimeout(vendingTimer);
    vending.classList.remove('is-dispensing');
    vendButton.removeAttribute('aria-disabled');
    vending.hidden = true;
    toggle.hidden = false;
    unlockLake();
    if (focus && active) menuButton.focus();
  }

  function openVending() {
    if (!active || workMode) return;
    toggleToyMenu(false);
    vending.hidden = false;
    lockLakeFor(vending);
    toggle.hidden = true;
    vendButton.focus();
  }

  function dispensePrize() {
    if (!active || vending.hidden || vendButton.getAttribute('aria-disabled') === 'true') return;
    var index = Math.floor(Math.random() * prizes.length);
    if (index === lastPrize) index = (index + 1) % prizes.length;
    lastPrize = index;
    var prize = prizes[index];
    vending.querySelector('[data-prize-placeholder]').hidden = true;
    Array.prototype.forEach.call(vending.querySelectorAll('[data-prize-art]'), function (art) {
      // SVG has no HTMLElement.hidden property; use the actual attribute.
      if (art.getAttribute('data-prize-art') === prize.icon) art.removeAttribute('hidden');
      else art.setAttribute('hidden', '');
    });
    vending.querySelector('[data-prize-en]').textContent = prize.en;
    vending.querySelector('[data-prize-zh]').textContent = prize.zh;
    vending.querySelector('[data-prize-detail-en]').textContent = prize.detailEn;
    vending.querySelector('[data-prize-detail-zh]').textContent = prize.detailZh;
    vendingCrew.hidden = !prize.crew;
    vendingCrew.disabled = crewState === 'rowing';
    vending.classList.remove('is-dispensing');
    if (!motionQuery.matches) {
      void vending.offsetWidth;
      vending.classList.add('is-dispensing');
      vendButton.setAttribute('aria-disabled', 'true');
      vendingTimer = window.setTimeout(function () {
        vendButton.removeAttribute('aria-disabled');
        vending.classList.remove('is-dispensing');
      }, 650);
    }
  }

  function setWorkMode(enabled, focus) {
    if (enabled === workMode || (enabled && !active)) return;
    if (enabled) {
      closeVending(false);
      toggleToyMenu(false);
      workMode = true;
      workScreen.hidden = false;
      root.classList.add('is-working');
      root.setAttribute('aria-labelledby', 'lake-work-title');
      lockLakeFor(workScreen);
      toggle.hidden = true;
      window.cancelAnimationFrame(frame);
      frame = 0;
      root.querySelector('[data-lake-resume]').focus();
    } else {
      workMode = false;
      workScreen.hidden = true;
      root.classList.remove('is-working');
      root.setAttribute('aria-labelledby', 'after-hours-title');
      toggle.hidden = false;
      unlockLake();
      if (active) {
        measure();
        draw();
        startFrames();
        if (focus) menuButton.focus();
      }
    }
  }

  function finishCrew() {
    crewState = 'cleared';
    vendingCrew.disabled = false;
    crew.hidden = true;
    crewButton.disabled = false;
    rescue.hidden = false;
    setNote({ en: 'The crew swept every paper away.', zh: '赛艇队经过，论文全被冲走了。' });
  }

  function restoreBoats() {
    var hadFocus = document.activeElement === rescue;
    crewState = 'idle';
    crewClock = 0;
    crew.hidden = true;
    rescue.hidden = true;
    crewButton.disabled = false;
    boats.forEach(function (boat) { boat.sweptAt = -1; boat.push = 0; boat.velocity = 0; });
    setNote({ en: 'All aboard. Papers recovered.', zh: '打捞完成，全员归队。' });
    draw();
    if (hadFocus) menuButton.focus();
  }

  function startCrew() {
    if (!active || workMode || crewState === 'rowing') return;
    closeVending(false);
    toggleToyMenu(false);
    if (crewState === 'cleared') restoreBoats();
    finishBoss();
    paperFoldPending = false;
    clearPapers();
    progress = 1;
    crewState = 'rowing';
    crewClock = 0;
    crew.hidden = false;
    rescue.hidden = true;
    crewButton.disabled = true;
    boats.forEach(function (boat) { boat.sweptAt = -1; });
    setNote({ en: 'Rowing crew incoming. Hold on to your papers!', zh: '赛艇队来了，抓紧论文！' });
    menuButton.focus();
    if (motionQuery.matches) finishCrew();
    draw();
    startFrames();
  }

  function updateCrew(delta) {
    if (crewState !== 'rowing') return;
    crewClock += delta;
    var bow = -crewWidth + (width + crewWidth + 60) * Math.min(1, crewClock / crewTravel) + crewWidth * 0.98;
    boats.forEach(function (boat) {
      if (boat.sweptAt < 0 && bow >= boat.x + boat.size / 2) boat.sweptAt = crewClock;
    });
    if (crewClock >= crewTravel + 1.2) finishCrew();
  }

  function drawCrew() {
    if (crewState !== 'rowing') return;
    var x = -crewWidth + (width + crewWidth + 60) * Math.min(1, crewClock / crewTravel);
    var crewWaterline = surface + crewWidth * 65 / 1024;
    var y = crewWaterline - crewWidth * 180 / 1024 + Math.sin(crewClock * Math.PI * 2 / 1.8) * 0.7;
    crew.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
    crewRenderer.draw(crewClock);
    // A light bow wave and wake connect the shell to the drifting papers.
    var bow = x + crewWidth * 0.98;
    var bottom = Math.min(height, caption.offsetTop - 8);
    context.save();
    context.beginPath();
    context.moveTo(bow - crewWidth - 90, crewWaterline + 5);
    context.quadraticCurveTo(bow - 28, crewWaterline - 8, bow + 12, crewWaterline + 5);
    context.bezierCurveTo(bow + 80, surface + (bottom - surface) * 0.45, bow - 50, bottom, bow - 160, bottom + 20);
    context.quadraticCurveTo(bow - crewWidth * 0.7, surface + (bottom - surface) * 0.45, bow - crewWidth - 90, crewWaterline + 5);
    context.closePath();
    var wash = context.createLinearGradient(0, surface, 0, bottom + 20);
    wash.addColorStop(0, 'rgba(225,251,241,.17)');
    wash.addColorStop(0.6, 'rgba(205,247,239,.06)');
    wash.addColorStop(1, 'rgba(205,247,239,0)');
    context.fillStyle = wash;
    context.fill();
    context.strokeStyle = 'rgba(246,255,244,.72)';
    context.lineWidth = 2.5;
    context.beginPath();
    context.moveTo(bow - 64, crewWaterline + 6);
    context.quadraticCurveTo(bow + 8, crewWaterline - 5, bow + 12, crewWaterline + 9);
    context.stroke();
    for (var n = 0; n < 5; n++) {
      context.beginPath();
      context.ellipse(x + crewWidth * (0.15 + n * 0.14), crewWaterline + 9 + n % 2 * 3, 13 + n * 4, 3, 0, 0, Math.PI);
      context.stroke();
    }
    context.restore();
  }

  function resetToys() {
    closeVending(false);
    setWorkMode(false, false);
    toggleToyMenu(false);
    crewState = 'idle';
    crewClock = 0;
    crew.hidden = true;
    rescue.hidden = true;
    crewButton.disabled = false;
    vendingCrew.disabled = false;
    boats.forEach(function (boat) { boat.sweptAt = -1; });
  }

  function measure() {
    width = window.innerWidth;
    height = window.innerHeight;
    surface = height * (width <= 640 ? 0.56 : 0.64);
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    crewWidth = width <= 640 ? Math.max(460, width * 1.12) : Math.min(740, Math.max(640, width * 0.6));
    crew.style.width = crewWidth + 'px';
    var size = boats.length ? boats[0].element.offsetWidth : 150;
    var columns = Math.max(1, Math.min(boats.length, Math.floor((width - 24) / (size + 12))));
    var rows = Math.ceil(boats.length / columns);
    // A compact harbor leaves the caption and exit control clear on short screens.
    if (height < 520) surface = height * 0.48;
    // Leave room for both languages above the boats and in the caption below.
    var lastWaterline = Math.min(height - (width <= 640 ? 180 : 110), caption.offsetTop - Math.max(18, size * 0.12));
    var rowStep = rows > 1 ? size * 110 / 160 + 13 : 0;
    surface = Math.max(surface, message.offsetTop + message.offsetHeight + size * 0.61 + 16);
    surface = Math.min(surface, lastWaterline - rowStep * (rows - 1));
    boats.forEach(function (boat, index) {
      var row = Math.floor(index / columns);
      var inRow = Math.min(columns, boats.length - row * columns);
      var gap = Math.min(size + 65, (width - 24) / inRow);
      boat.size = size;
      boat.x = width / 2 + (index % columns - (inRow - 1) / 2) * gap - size / 2;
      boat.y = surface + row * rowStep - size * 0.61;
    });
    rescue.style.top = Math.min(caption.offsetTop - 70, surface + 45) + 'px';
    if (!boss.hidden) {
      bossWidth = boss.offsetWidth;
      bossHeight = boss.offsetHeight;
      bossX = width <= 640 ? (width - bossWidth) / 2 : Math.min(width * 0.67, width - bossWidth - 28);
      bossY = Math.max(12, Math.min(surface + 36, height - bossHeight - (width <= 640 ? 185 : 110)));
    }
  }

  function resetBoss() {
    bossClock = 0;
    bossSweepAt = -1;
    bossDone = motionQuery.matches;
    paperFoldPending = !motionQuery.matches;
    boss.hidden = bossDone;
    root.classList.toggle('is-boss-visiting', !bossDone);
    boss.style.opacity = '0';
    bossQuote.textContent = 'One more experiment before you go?';
    bossTranslation.textContent = '下班前，再跑一组实验？';
    setNote(bossDone ? bossDeparture : bossRequest);
  }

  function finishBoss() {
    bossDone = true;
    boss.hidden = true;
    root.classList.remove('is-boss-visiting');
    // A visitor's boat-click message takes precedence over the automatic punchline.
    if (currentNote === bossRequest) setNote(bossDeparture);
  }

  function drawBoss(waterline) {
    if (bossDone || !active) return;
    if (bossSweepAt < 0 && bossClock >= bossHold && waterline <= bossY + bossHeight - 16) {
      bossSweepAt = bossClock;
      bossQuote.textContent = 'Wait, I’m not done—';
      bossTranslation.textContent = '等等，我还没说完——';
      makeRipple(bossX + bossWidth / 2, waterline + 8, 2);
    }
    var appearance = Math.min(1, bossClock / 0.3);
    var swept = bossSweepAt < 0 ? 0 : Math.min(1, (bossClock - bossSweepAt) / 1.35);
    var x = bossX + (width + bossWidth - bossX) * swept * swept;
    var y = bossY + (1 - appearance) * 16;
    if (swept) y += (waterline - bossY - bossHeight * 0.35) * Math.min(1, swept * 3) + Math.sin(swept * Math.PI) * 14;
    var angle = -4 + swept * 42;
    boss.style.opacity = (appearance * Math.min(1, (1 - swept) * 4)).toFixed(3);
    boss.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' + angle.toFixed(2) + 'deg) scale(' + (0.96 + appearance * 0.04 - swept * 0.12).toFixed(3) + ')';
    if (swept === 1) finishBoss();
  }

  function wave(x, offset) {
    return Math.sin(x * 0.009 + time * 0.7 + offset) * 5 + Math.sin(x * 0.019 - time * 0.45 + offset) * 2.5;
  }

  function makeRipple(x, y, strength) {
    if (motionQuery.matches || y < surface + (1 - progress) * (height - surface + 100) - 15) return;
    ripples.push({ x: x, y: y, age: 0, strength: strength });
    if (ripples.length > 24) ripples.shift();
    boats.forEach(function (boat) {
      var dx = boat.x + boat.size / 2 + boat.push - x;
      if (Math.abs(dx) < 180 && Math.abs(boat.y + boat.size * 0.61 - y) < 100) {
        boat.velocity += (dx < 0 ? -1 : 1) * strength * 18 * (1 - Math.abs(dx) / 180);
      }
    });
  }

  function drawWater(waterline) {
    var gradient = context.createLinearGradient(0, waterline, 0, height);
    gradient.addColorStop(0, 'rgba(127, 184, 181, .88)');
    gradient.addColorStop(0.3, 'rgba(62, 139, 154, .95)');
    gradient.addColorStop(1, '#174f67');
    context.beginPath();
    context.moveTo(0, height);
    for (var x = 0; x <= width + 16; x += 16) context.lineTo(x, waterline + wave(x, 0));
    context.lineTo(width, height);
    context.closePath();
    context.fillStyle = gradient;
    context.fill();
    for (var line = 0; line < 3; line++) {
      context.beginPath();
      for (var point = 0; point <= width + 16; point += 16) {
        var y = waterline + line * 12 + wave(point, line * 0.8);
        if (point === 0) context.moveTo(point, y);
        else context.lineTo(point, y);
      }
      context.strokeStyle = 'rgba(255, 247, 220, ' + (0.35 - line * 0.1) + ')';
      context.lineWidth = line ? 1 : 1.8;
      context.stroke();
    }
    // Small broken reflections, rather than a busy particle system.
    for (var glint = 0; glint < 26; glint++) {
      var gy = waterline + 20 + glint / 26 * Math.max(0, height - waterline - 20);
      var gx = width * 0.55 + Math.sin(glint * 13.1 + time * 0.13) * (35 + glint * 5);
      context.beginPath();
      context.moveTo(gx, gy);
      context.lineTo(gx + 7 + glint % 5 * 5, gy);
      context.strokeStyle = 'rgba(255, 229, 187, ' + (0.16 - glint * 0.003) + ')';
      context.lineWidth = 1.4;
      context.stroke();
    }
    ripples.forEach(function (ripple) {
      for (var ring = 0; ring < 2; ring++) {
        var radius = ripple.age * 65 + ring * 12 + 5;
        context.beginPath();
        context.ellipse(ripple.x, ripple.y, radius, radius * 0.25, 0, 0, Math.PI * 2);
        context.strokeStyle = 'rgba(237, 250, 245, ' + Math.max(0, (1 - ripple.age / 1.8) * 0.45 / (ring + 1)) + ')';
        context.lineWidth = 1.3;
        context.stroke();
      }
    });
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    var rise = (1 - progress) * (height - surface + 100);
    drawWater(surface + rise);
    drawCrew();
    boats.forEach(function (boat) {
      var drift = motionQuery.matches ? 0 : Math.sin(time * 0.22 + boat.index * 1.9) * 9;
      var x = Math.max(8, Math.min(width - boat.size - 8, boat.x + drift + boat.push));
      var bob = motionQuery.matches ? 0 : wave(x, boat.index * 0.7) * 0.55;
      var roll = motionQuery.matches ? 0 : Math.sin(time * 0.9 + boat.index) * 2.4 + boat.velocity * 0.035;
      var swept = boat.sweptAt < 0 ? 0 : Math.min(1, (crewClock - boat.sweptAt) / 1.1);
      x += (width + boat.size - x) * Math.pow(swept, 1.4);
      var y = boat.y + rise + bob - Math.sin(swept * Math.PI) * 24;
      boat.element.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' + (roll + swept * 65).toFixed(2) + 'deg) scale(' + (1 - swept * 0.45).toFixed(3) + ')';
      var visibility = Math.max(0, Math.min(1, (progress - 0.3 - boat.index * 0.035) / 0.45));
      visibility *= crewState === 'cleared' ? 0 : 1 - swept;
      boat.element.style.opacity = visibility;
      boat.element.disabled = !active || visibility < 0.5 || crewState !== 'idle';
    });
    drawBoss(surface + rise);
  }

  function tick(now) {
    frame = 0;
    if ((!active && !closing) || document.hidden || workMode) return;
    // Some browsers expose the new preference before dispatching its change event.
    if (motionQuery.matches) { updateMotion(); return; }
    if (lastTime && now - lastTime < 32) {
      frame = window.requestAnimationFrame(tick);
      return;
    }
    var delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.033;
    lastTime = now;
    time += delta;
    if (active) updateCrew(delta);
    if (active && !bossDone) bossClock += delta;
    if (active && paperFoldPending && bossClock >= bossHold) {
      paperFoldPending = false;
      root.classList.remove('is-boss-visiting');
      foldPapers();
    }
    var waterReady = active && (bossDone || bossClock >= bossHold);
    progress += ((waterReady ? 1 : 0) - progress) * Math.min(1, delta * (active ? 4.5 : 7));
    if (active && progress > 0.998) progress = 1;
    ripples.forEach(function (ripple) { ripple.age += delta; });
    ripples = ripples.filter(function (ripple) { return ripple.age < 1.8; });
    boats.forEach(function (boat) {
      boat.velocity += -boat.push * 1.4 * delta;
      boat.velocity *= Math.exp(-2.1 * delta);
      boat.push += boat.velocity * delta;
    });
    draw();
    frame = window.requestAnimationFrame(tick);
  }

  function startFrames() {
    if (!frame && !document.hidden && !motionQuery.matches && !workMode) {
      lastTime = 0;
      frame = window.requestAnimationFrame(tick);
    }
  }

  function clearPapers() {
    paperCopies.forEach(function (paper) {
      paper.getAnimations().forEach(function (animation) { animation.cancel(); });
      paper.remove();
    });
    paperCopies = [];
  }

  function foldPapers() {
    if (motionQuery.matches || !Element.prototype.animate) return;
    boats.forEach(function (boat) {
      var rect = boat.card.getBoundingClientRect();
      var visible = rect.bottom > 0 && rect.top < height;
      var paper = document.createElement('div');
      paper.className = 'after-hours__paper';
      paper.setAttribute('aria-hidden', 'true');
      var title = document.createElement('strong');
      title.textContent = boat.name;
      paper.appendChild(title);
      var lines = document.createElement('p');
      lines.textContent = boat.card.querySelector('.pub-card__title').textContent.trim();
      paper.appendChild(lines);
      var paperWidth = Math.min(240, Math.max(160, rect.width));
      paper.style.width = paperWidth + 'px';
      stage.appendChild(paper);
      paperCopies.push(paper);
      var x = visible ? rect.left : width / 2 - paperWidth / 2;
      var y = visible ? Math.max(40, Math.min(height - 130, rect.top)) : height + 40;
      var destination = 'translate(' + (boat.x + boat.size / 2 - paperWidth / 2) + 'px,' + boat.y + 'px)';
      var animation = paper.animate([
        { transform: 'translate(' + x + 'px,' + y + 'px) scale(1)', opacity: 0 },
        { transform: 'translate(' + x + 'px,' + y + 'px) scale(.85)', opacity: 0.9, offset: 0.2 },
        { transform: destination + ' scale(.65) rotate(-8deg)', opacity: 0.8, offset: 0.7 },
        { transform: destination + ' scale(.06) rotate(12deg)', opacity: 0 }
      ], { duration: 1050, delay: boat.index * 65, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'both' });
      animation.onfinish = function () { paper.remove(); };
    });
  }

  function freezePage() {
    savedFocus = document.activeElement;
    savedBodyStyle = { overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight };
    var scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar) document.body.style.paddingRight = (parseFloat(window.getComputedStyle(document.body).paddingRight) + scrollbar) + 'px';
    document.body.style.overflow = 'hidden';
    Array.prototype.forEach.call(document.body.children, function (element) {
      if (element === root || element.contains(root) || /^(SCRIPT|STYLE|LINK)$/.test(element.tagName)) return;
      savedBackground.push({ element: element, inert: element.inert });
      element.inert = true;
    });
  }

  function restorePage() {
    savedBackground.forEach(function (item) { item.element.inert = item.inert; });
    savedBackground = [];
    document.body.style.overflow = savedBodyStyle.overflow;
    document.body.style.paddingRight = savedBodyStyle.paddingRight;
    if (savedFocus && savedFocus.isConnected) savedFocus.focus({ preventScroll: true });
  }

  function openLake() {
    window.clearTimeout(closeTimer);
    if (!closing) freezePage();
    closing = false;
    active = true;
    stage.hidden = false;
    root.classList.remove('is-leaving');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'after-hours-title');
    toggle.setAttribute('aria-expanded', 'true');
    toggleEnglish.textContent = 'Back to shore';
    toggleChinese.textContent = '回岸上';
    toggle.setAttribute('aria-label', 'Back to shore / 回岸上 — Exit after-hours mode (Esc)');
    toggle.setAttribute('aria-keyshortcuts', 'Escape');
    resetToys();
    resetBoss();
    ripples = [];
    boats.forEach(function (boat) { boat.push = 0; boat.velocity = 0; });
    lastPointer = null;
    measure();
    progress = motionQuery.matches ? 1 : 0;
    draw();
    // Commit the initial style before playing the entrance transition.
    void stage.offsetWidth;
    root.classList.add('is-active');
    clearPapers();
    toggle.focus({ preventScroll: true });
    startFrames();
  }

  function closeLake() {
    if (!active) return;
    active = false;
    resetToys();
    closing = true;
    boss.hidden = true;
    bossDone = true;
    paperFoldPending = false;
    root.classList.remove('is-boss-visiting');
    root.classList.remove('is-active');
    root.classList.add('is-leaving');
    toggle.setAttribute('aria-expanded', 'false');
    toggleEnglish.textContent = 'Off the clock';
    toggleChinese.textContent = '下班了';
    toggle.removeAttribute('aria-label');
    toggle.removeAttribute('aria-keyshortcuts');
    clearPapers();
    closeTimer = window.setTimeout(function () {
      closing = false;
      window.cancelAnimationFrame(frame);
      frame = 0;
      progress = 0;
      stage.hidden = true;
      root.classList.remove('is-leaving');
      root.removeAttribute('role');
      root.removeAttribute('aria-modal');
      root.removeAttribute('aria-labelledby');
      ripples = [];
      boats.forEach(function (boat) { boat.push = 0; boat.velocity = 0; });
      restorePage();
    }, motionQuery.matches ? 0 : 600);
  }

  menuButton.addEventListener('click', function () { if (active) toggleToyMenu(toyMenu.hidden); });
  root.querySelector('[data-lake-boss]').addEventListener('click', function () { setWorkMode(true, true); });
  root.querySelector('[data-lake-resume]').addEventListener('click', function () { setWorkMode(false, true); });
  root.querySelector('[data-lake-vending]').addEventListener('click', openVending);
  root.querySelector('[data-vending-close]').addEventListener('click', function () { closeVending(true); });
  vendButton.addEventListener('click', dispensePrize);
  vendingCrew.addEventListener('click', startCrew);
  crewButton.addEventListener('click', startCrew);
  rescue.addEventListener('click', restoreBoats);
  toggle.addEventListener('click', function () { if (active) closeLake(); else openLake(); });
  stage.addEventListener('pointerdown', function (event) {
    if (!active || workMode || !vending.hidden) return;
    if (!event.target.closest('.after-hours__tools')) toggleToyMenu(false);
    if (event.target.closest('button')) return;
    if (event.clientY > surface - 25) makeRipple(event.clientX, event.clientY, 1.5);
  }, { passive: true });
  stage.addEventListener('pointermove', function (event) {
    if (!active || workMode || !vending.hidden || event.clientY < surface - 20) return;
    var now = performance.now();
    if (lastPointer && (now - lastPointer.time < 80 || Math.abs(lastPointer.x - event.clientX) + Math.abs(lastPointer.y - event.clientY) < 12)) return;
    makeRipple(event.clientX, event.clientY, 0.65);
    lastPointer = { x: event.clientX, y: event.clientY, time: now };
  }, { passive: true });
  // Blank-area clicks can move focus to body, outside the lake's DOM subtree.
  // Listen at document level while the lake is open so its shortcuts still work.
  document.addEventListener('keydown', function (event) {
    if ((!active && !closing) || event.isComposing) return;
    var target = event.target;
    var isEditing = target instanceof Element && (target.isContentEditable || target.closest('input, textarea, select'));
    if (active && event.key.toLowerCase() === 'b' && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && !isEditing) {
      event.preventDefault();
      setWorkMode(!workMode, true);
      return;
    }
    if (event.key === 'Escape' && !event.repeat) {
      event.preventDefault();
      if (workMode) setWorkMode(false, true);
      else if (!vending.hidden) closeVending(true);
      else if (!toyMenu.hidden) toggleToyMenu(false);
      else closeLake();
      return;
    }
    if (event.key === 'Tab') {
      var buttons = Array.prototype.slice.call(root.querySelectorAll('button:not(:disabled)')).filter(function (button) {
        return button.getClientRects().length && !button.closest('[inert]');
      });
      if (!buttons.length) return;
      var index = buttons.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        buttons[buttons.length - 1].focus();
      } else if (!event.shiftKey && (index < 0 || index === buttons.length - 1)) {
        event.preventDefault();
        buttons[0].focus();
      }
    }
  });
  window.addEventListener('resize', function () {
    if (active || closing) { measure(); draw(); }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    } else if (active || closing) startFrames();
  });
  function updateMotion() {
    if (!active && !closing) return;
    if (motionQuery.matches) {
      window.cancelAnimationFrame(frame);
      frame = 0;
      progress = active ? 1 : 0;
      ripples = [];
      paperFoldPending = false;
      finishBoss();
      if (crewState === 'rowing') finishCrew();
      clearPapers();
      draw();
    } else startFrames();
  }
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', updateMotion);
  else motionQuery.addListener(updateMotion);
  // No-JavaScript visits keep the entire enhancement hidden.
  root.hidden = false;
})();
