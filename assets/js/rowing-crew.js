/* A small articulated sweep four. The lake owns timing, visibility and motion preferences. */
(function () {
  'use strict';
  var ns = 'http://www.w3.org/2000/svg';
  var radians = Math.PI / 180;
  var period = 1.8;
  // Catch -> leg drive -> body swing -> finish -> hands away -> body over -> slide.
  // Timing follows the British Rowing technical model; poses are illustrative.
  var poses = [
    [0, -10, -32, 57, 2, 1],
    [0.16, 20, -30, 30, 2, 1],
    [0.24, 36, -12, 10, 2, 1],
    [0.36, 36, 18, -22, 2, 1],
    [0.43, 36, 18, -20, 8, 0],
    [0.54, 36, 8, -1, 8, 0],
    [0.64, 36, -32, 16, 8, 0],
    [0.84, 1, -32, 43, 8, 0],
    [0.95, -9, -32, 54, 8, 1],
    [1, -10, -32, 57, 2, 1]
  ];

  function make(tag, attrs, parent) {
    var element = document.createElementNS(ns, tag);
    Object.keys(attrs || {}).forEach(function (key) { element.setAttribute(key, attrs[key]); });
    if (parent) parent.appendChild(element);
    return element;
  }
  function path(parent, fill, stroke, width) {
    return make('path', { fill: fill || 'none', stroke: stroke || 'none', 'stroke-width': width || 0, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  }
  function p(x, y, z) { return { x: x + z * 0.1, y: 180 - y + z * 0.18 }; }
  function xy(point) { return point.x.toFixed(2) + ' ' + point.y.toFixed(2); }
  function line(element, points) { element.setAttribute('d', 'M' + points.map(xy).join('L')); }
  function poseAt(seconds) {
    var phase = (seconds % period) / period;
    var index = 1;
    while (poses[index][0] < phase) index++;
    var a = poses[index - 1], b = poses[index];
    var t = (phase - a[0]) / (b[0] - a[0]);
    t = t * t * (3 - 2 * t);
    return { phase: phase, hip: a[1] + (b[1] - a[1]) * t, lean: a[2] + (b[2] - a[2]) * t, angle: a[3] + (b[3] - a[3]) * t, lift: a[4] + (b[4] - a[4]) * t, square: a[5] + (b[5] - a[5]) * t };
  }
  // Two fixed-length segments meet at a knee/elbow; the endpoints never detach.
  function joint(a, b, first, second, bend) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var length = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
    var reach = Math.min(length, first + second - 0.001);
    var along = (first * first - second * second + reach * reach) / (2 * reach);
    var rise = Math.sqrt(Math.max(0, first * first - along * along));
    return { x: a.x + dx / length * along - dy / length * rise * bend, y: a.y + dy / length * along + dx / length * rise * bend };
  }

  window.LakeRowingCrew = function (svg) {
    var farLayer = svg.querySelector('[data-crew-oars-far]');
    var peopleLayer = svg.querySelector('[data-crew-athletes]');
    var nearLayer = svg.querySelector('[data-crew-oars-near]');
    var sprayLayer = svg.querySelector('[data-crew-spray]');
    var skins = [ ['#ddb08e', '#b78062'], ['#c88e69', '#9b604b'], ['#e6bc99', '#bc8c6e'], ['#b78260', '#83513d'] ];
    var rowers = [250, 405, 560, 715].map(function (station, index) {
      var side = index % 2 ? 1 : -1;
      var skin = skins[index];
      var oar = make('g', { transform: 'translate(' + station + ' 0)', 'data-crew-oar': '', 'data-side': side < 0 ? 'far' : 'near' }, side < 0 ? farLayer : nearLayer);
      var pivot = p(5, 29, side * 55);
      var rigger = path(oar, 'none', '#536470', 2.6);
      line(rigger, [p(-23, 10, side * 12), pivot, p(34, 10, side * 12)]);
      var riggerLight = path(oar, 'none', '#cfdbdf', 0.9);
      line(riggerLight, [p(-23, 11, side * 12), pivot, p(34, 11, side * 12)]);
      var shaft = path(oar, 'none', side < 0 ? '#465964' : '#172d3c', 3.4);
      var shaftLight = path(oar, 'none', '#9caeb5', 0.65);
      var handle = path(oar, 'none', '#b5a27a', 4.1);
      var blade = path(oar, '#faf6e9', '#475a65', 0.85);
      var bladeStripe = path(oar, '#923d50');
      make('circle', { cx: pivot.x, cy: pivot.y, r: 3.6, fill: '#c2cf69', stroke: '#667447', 'stroke-width': 1 }, oar);
      make('circle', { cx: pivot.x, cy: pivot.y, r: 1.35, fill: '#263b40' }, oar);

      var person = make('g', { transform: 'translate(' + station + ' 0)', 'data-crew-rower': '' }, peopleLayer);
      var seat = make('rect', { width: 20, height: 4, rx: 1.5, fill: '#182c3c', 'data-crew-seat': '' }, person);
      var farLeg = path(person, 'none', skin[1], 7.5);
      var farShorts = path(person, 'none', '#172d43', 11.5);
      var nearThigh = path(person, 'none', skin[0], 11);
      var nearLeg = path(person, 'none', skin[0], 7.5);
      var nearLegLight = path(person, 'none', '#e5c3a4', 2.4);
      var shorts = path(person, 'none', '#20374f', 12.5);
      var shortsTrim = path(person, 'none', '#814350', 2.5);
      var farArm = path(person, 'none', skin[1], 5.5);
      var torso = make('g', { 'data-crew-torso': '' }, person);
      make('path', { d: 'M-8-40Q-4-47 5-44L11-36 9-20 10-3Q1 3-10-1L-8-20-12-32Z', fill: '#eeeae2', stroke: '#b3b6b1', 'stroke-width': 0.65 }, torso);
      make('path', { d: 'M5-44Q11-41 11-35L8-20 10-3 3-1 1-24Z', fill: '#263e55' }, torso);
      make('path', { d: 'm-10-30 14 10v7l-13-9Z', fill: '#903e50' }, torso);
      make('path', { d: 'm-10-32 14 10', fill: 'none', stroke: '#faf8f1', 'stroke-width': 1.4 }, torso);
      make('path', { d: 'M-7-4Q2 0 10-4L12 3Q0 8-12 4Z', fill: '#1a3149' }, torso);
      make('path', { d: 'M-5-41Q-4-48 2-47L4-42', fill: skin[0] }, torso);
      var head = make('g', {}, person);
      make('path', { d: 'M-3 2 3 3 5 12-3 12Z', fill: skin[1] }, head);
      make('path', { d: 'M-8-7Q-7-15 1-14 10-13 9-4L7 5Q5 10 0 9L-6 6-7 1-11-1-8-5Z', fill: skin[0], stroke: skin[1], 'stroke-width': 0.55 }, head);
      make('path', { d: 'M5-7Q10-8 8 0L5 5', fill: skin[1], opacity: 0.7 }, head);
      make('ellipse', { cx: 4.2, cy: -0.4, rx: 1.7, ry: 2.6, fill: skin[0] }, head);
      make('path', { d: 'M-9-7Q-9-17 1-17 10-16 10-7L3-9-7-7Z', fill: '#f4f4ed', stroke: '#a6afb1', 'stroke-width': 0.6 }, head);
      make('path', { d: 'M-15-6Q-8-10 2-9L3-7-8-5Z', fill: '#223b50' }, head);
      make('path', { d: 'M-8-3 0-4 3-2 0 1-6 1Z', fill: '#263e49' }, head);
      make('path', { d: 'm-7-2 5-1', stroke: '#8daeb8', 'stroke-width': 0.9 }, head);
      var nearUpperArm = path(person, 'none', skin[0], 8);
      var nearArm = path(person, 'none', skin[0], 6.1);
      var armLight = path(person, 'none', '#e4b997', 1.8);
      var hands = make('g', { transform: 'translate(' + station + ' 0)' }, sprayLayer);
      var handDots = [make('circle', { r: 2.8, fill: skin[1] }, hands), make('circle', { r: 3, fill: skin[0] }, hands)];
      var spray = make('g', { transform: 'translate(' + station + ' 0)', 'data-crew-splash': '' }, side < 0 ? farLayer : sprayLayer);
      var ripple = make('ellipse', { rx: 15, ry: 3, fill: 'none', stroke: '#e8f8f1', 'stroke-width': 1.3 }, spray);
      var drops = [];
      for (var i = 0; i < 5; i++) drops.push(make('circle', { r: i % 2 ? 1 : 1.6, fill: '#f4fcf2' }, spray));
      return { side: side, station: station, skin: skin, person: person, seat: seat, farLeg: farLeg, farShorts: farShorts, nearThigh: nearThigh, nearLeg: nearLeg, nearLegLight: nearLegLight, shorts: shorts, shortsTrim: shortsTrim, farArm: farArm, torso: torso, head: head, nearUpperArm: nearUpperArm, nearArm: nearArm, armLight: armLight, shaft: shaft, shaftLight: shaftLight, handle: handle, blade: blade, bladeStripe: bladeStripe, handDots: handDots, spray: spray, ripple: ripple, drops: drops };
    });

    this.draw = function (seconds) {
      var pose = poseAt(seconds);
      rowers.forEach(function (rower) {
        var angle = pose.angle * radians, lean = pose.lean * radians, side = rower.side;
        var sine = Math.sin(angle), cosine = Math.cos(angle);
        var inboard = 97, outboard = inboard * 2.25;
        function oarPoint(distance, across) {
          // A squared blade is vertical; feathering rotates it flat over the water.
          var feather = 1 - pose.square;
          return p(5 + distance * sine + across * cosine * feather, 29 + (pose.lift - 29) * distance / outboard + across * pose.square, side * (55 + distance * cosine - across * sine * feather));
        }
        var hand = oarPoint(-inboard, 0), otherHand = oarPoint(-inboard + 8, 0);
        var bladeRoot = oarPoint(outboard - 39, 0);
        line(rower.shaft, [hand, bladeRoot]);
        line(rower.shaftLight, [oarPoint(-70, 0), bladeRoot]);
        line(rower.handle, [hand, oarPoint(-inboard + 19, 0)]);
        var bladeCorners = [oarPoint(outboard - 40, 3), oarPoint(outboard - 7, 10), oarPoint(outboard + 4, 7), oarPoint(outboard + 4, -9), oarPoint(outboard - 38, -6)];
        rower.blade.setAttribute('d', 'M' + bladeCorners.map(xy).join('L') + 'Z');
        var stripe = [oarPoint(outboard - 18, 7.7), oarPoint(outboard - 7, 10), oarPoint(outboard + 4, 7), oarPoint(outboard + 4, -9), oarPoint(outboard - 18, -7.4)];
        rower.bladeStripe.setAttribute('d', 'M' + stripe.map(xy).join('L') + 'Z');

        var hipWorld = { x: pose.hip, y: 26 }, footWorld = { x: -40, y: 13 };
        var kneeWorld = joint(hipWorld, footWorld, 39, 39, -1);
        function leg(z) { return [p(hipWorld.x, hipWorld.y, z), p(kneeWorld.x, kneeWorld.y, z), p(footWorld.x, footWorld.y, z)]; }
        var farLeg = leg(-5), nearLeg = leg(6);
        line(rower.farLeg, farLeg); line(rower.nearThigh, nearLeg.slice(0, 2)); line(rower.nearLeg, nearLeg.slice(1));
        line(rower.nearLegLight, [{ x: nearLeg[1].x + 1.8, y: nearLeg[1].y }, { x: nearLeg[2].x + 1.3, y: nearLeg[2].y - 4 }]);
        var shortsEnd = { x: nearLeg[0].x + (nearLeg[1].x - nearLeg[0].x) * 0.58, y: nearLeg[0].y + (nearLeg[1].y - nearLeg[0].y) * 0.58 };
        line(rower.shorts, [nearLeg[0], shortsEnd]);
        line(rower.farShorts, [farLeg[0], { x: farLeg[0].x + (farLeg[1].x - farLeg[0].x) * 0.58, y: farLeg[0].y + (farLeg[1].y - farLeg[0].y) * 0.58 }]);
        line(rower.shortsTrim, [{ x: nearLeg[0].x + 1.6, y: nearLeg[0].y - 3 }, { x: shortsEnd.x + 1.6, y: shortsEnd.y - 3 }]);
        rower.seat.setAttribute('x', pose.hip - 10); rower.seat.setAttribute('y', 160);
        rower.torso.setAttribute('transform', 'translate(' + pose.hip.toFixed(2) + ' 154) rotate(' + pose.lean.toFixed(2) + ')');
        var shoulder = { x: pose.hip + Math.sin(lean) * 41, y: 26 + Math.cos(lean) * 41 };
        var headPoint = p(shoulder.x + Math.sin(lean) * 5 - 1, shoulder.y + 14, 0);
        rower.head.setAttribute('transform', 'translate(' + xy(headPoint) + ') rotate(' + (pose.lean * 0.12).toFixed(2) + ')');
        var farShoulder = p(shoulder.x + 1, shoulder.y, -7), nearShoulder = p(shoulder.x - 2, shoulder.y - 1, 6);
        var farElbow = joint(farShoulder, otherHand, 24, 25, -1);
        var nearElbow = joint(nearShoulder, hand, 24, 25, -1);
        line(rower.farArm, [farShoulder, farElbow, otherHand]);
        line(rower.nearUpperArm, [nearShoulder, nearElbow]);
        line(rower.nearArm, [nearElbow, hand]);
        line(rower.armLight, [{ x: nearShoulder.x, y: nearShoulder.y - 1.4 }, { x: nearElbow.x, y: nearElbow.y - 1.4 }]);
        [otherHand, hand].forEach(function (point, index) { rower.handDots[index].setAttribute('cx', point.x); rower.handDots[index].setAttribute('cy', point.y); });

        // Only the blade making a stroke throws water; recovery stays quiet.
        var wet = pose.phase < 0.39 || pose.phase > 0.98;
        var burst = Math.exp(-pose.phase * 18) + Math.exp(-Math.pow((pose.phase - 0.36) / 0.045, 2));
        var splashAt = p(5 + (outboard - 18) * sine, 0, side * (55 + (outboard - 18) * cosine));
        rower.spray.setAttribute('opacity', wet ? (0.25 + Math.min(1, burst) * 0.65).toFixed(2) : '0');
        rower.ripple.setAttribute('cx', splashAt.x); rower.ripple.setAttribute('cy', splashAt.y + 2);
        rower.ripple.setAttribute('rx', 13 + (pose.phase % 0.1) * 70);
        rower.drops.forEach(function (drop, index) {
          drop.setAttribute('cx', splashAt.x - 13 + index * 6 + Math.sin(seconds * 11 + index) * 2);
          drop.setAttribute('cy', splashAt.y - 2 - Math.sin((index + 1) / 6 * Math.PI) * (3 + burst * 9));
        });
      });
    };
    this.draw(0);
  };
})();
