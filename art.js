/* Sink or Float — all pictures, drawn as SVG strings.
   Toy pictures are turned into images (canvas + <img>), so each one is its own document and may use ids.
   The frog and the icons are put straight into the page, so they must NOT use ids. */
'use strict';
var ART = (function () {
  var OL = '#2D2140';                      // outline colour used everywhere
  var S = ' stroke="' + OL + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  var S3 = ' stroke="' + OL + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';

  function svg(w, h, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w * 4 +
      '" height="' + h * 4 + '">' + body + '</svg>';
  }
  // happy little face: eyes, shine, smile, rosy cheeks
  function face(cx, cy, s) {
    s = s || 1;
    var o = '';
    [-1, 1].forEach(function (d) {
      o += '<ellipse cx="' + (cx + d * 15 * s) + '" cy="' + (cy + 5.5 * s) + '" rx="' + 4.2 * s + '" ry="' + 2.6 * s +
        '" fill="#FF7E9D" opacity=".55"/>';
      o += '<ellipse cx="' + (cx + d * 8.5 * s) + '" cy="' + cy + '" rx="' + 3.6 * s + '" ry="' + 4.6 * s + '" fill="' + OL + '"/>';
      o += '<circle cx="' + (cx + d * 8.5 * s + 1.2 * s) + '" cy="' + (cy - 1.7 * s) + '" r="' + 1.4 * s + '" fill="#fff"/>';
    });
    o += '<path d="M' + (cx - 5 * s) + ' ' + (cy + 6 * s) + ' Q' + cx + ' ' + (cy + 11 * s) + ' ' + (cx + 5 * s) + ' ' +
      (cy + 6 * s) + '" fill="none" stroke="' + OL + '" stroke-width="' + 2.6 * s + '" stroke-linecap="round"/>';
    return o;
  }
  function shine(cx, cy, rx, ry, rot, op) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#fff" opacity="' + (op || 0.6) +
      '" transform="rotate(' + (rot || 0) + ' ' + cx + ' ' + cy + ')"/>';
  }

  var TOY_SVG = {
    duck: function () {
      return svg(122, 100,
        '<path d="M8 58 Q4 34 24 44 Q34 50 50 50 L64 50 Q102 47 110 68 Q112 93 70 95 L40 95 Q9 93 8 58Z" fill="#FFD23F"' + S + '/>' +
        '<path d="M40 69 Q56 58 72 66 Q68 83 47 81 Q38 77 40 69Z" fill="#F5B400"' + S3 + '/>' +
        '<circle cx="78" cy="32" r="24" fill="#FFD23F"' + S + '/>' +
        '<path d="M96 35 Q118 33 116 44 Q107 51 95 46Z" fill="#FF8A1F"' + S + '/>' +
        shine(68, 17, 7, 4, -20, 0.7) + face(77, 31, 0.8));
    },
    leaf: function () {
      return svg(122, 66,
        '<path d="M5 37 L20 35" fill="none" stroke="' + OL + '" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M16 35 Q46 2 106 23 Q118 31 106 41 Q50 66 16 35Z" fill="#6CCB4A"' + S + '/>' +
        '<path d="M80 31 Q92 30 104 31 M84 31 L94 22 M84 31 L95 40" fill="none" stroke="#3F9A2E" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M22 35 L34 34" fill="none" stroke="#3F9A2E" stroke-width="3" stroke-linecap="round"/>' +
        shine(50, 19, 10, 3.5, -12, 0.45) + face(57, 34, 0.75));
    },
    apple: function () {
      return svg(100, 100,
        '<path d="M50 27 Q48 15 55 7" fill="none" stroke="#7A4A26" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M50 28 Q66 15 82 27 Q98 42 91 66 Q83 93 62 93 Q56 91 50 93 Q44 91 38 93 Q17 93 9 66 Q2 42 18 27 Q34 15 50 28Z" fill="#F0453A"' + S + '/>' +
        '<path d="M55 17 Q67 4 81 10 Q71 23 55 17Z" fill="#6CCB4A"' + S3 + '/>' +
        shine(28, 44, 5, 11, 20, 0.55) + face(52, 58, 1));
    },
    block: function () {
      return svg(98, 92,
        '<path d="M8 27 L28 8 L90 8 L70 27Z" fill="#F7D08F"' + S + '/>' +
        '<path d="M70 27 L90 8 L90 68 L70 87Z" fill="#C98B43"' + S + '/>' +
        '<rect x="8" y="27" width="62" height="60" rx="3" fill="#E9AD62"' + S + '/>' +
        '<path d="M14 37 Q38 33 64 38 M14 79 Q38 75 64 80" fill="none" stroke="#C98B43" stroke-width="2.5" stroke-linecap="round"/>' +
        face(39, 55, 0.85));
    },
    ball: function () {
      var bands = [[6, 25, '#F0453A'], [25, 41, '#fff'], [41, 59, '#3FA9F5'], [59, 75, '#fff'], [75, 94, '#FFD23F']];
      var b = '';
      bands.forEach(function (d) {
        var c1 = 2 * d[0] - 50, c2 = 2 * d[1] - 50;
        b += '<path d="M50 6 Q' + c1 + ' 50 50 94 Q' + c2 + ' 50 50 6Z" fill="' + d[2] + '"/>';
      });
      return svg(100, 100,
        '<defs><clipPath id="c"><circle cx="50" cy="50" r="44"/></clipPath></defs>' +
        '<g transform="rotate(-18 50 50)"><circle cx="50" cy="50" r="44" fill="#fff"/><g clip-path="url(#c)">' + b + '</g>' +
        '<circle cx="50" cy="7" r="5" fill="#fff"' + S3 + '/></g>' +
        '<circle cx="50" cy="50" r="44" fill="none"' + S + '/>' +
        shine(30, 28, 9, 5, -40, 0.65) + face(53, 55, 0.9));
    },
    ice: function () {
      return svg(94, 94,
        '<path d="M10 28 L28 10 L84 10 L66 28Z" fill="#EAFAFF"' + S + '/>' +
        '<path d="M66 28 L84 10 L84 68 L66 86Z" fill="#9ED8F5"' + S + '/>' +
        '<rect x="10" y="28" width="56" height="58" rx="6" fill="#C6EDFF"' + S + '/>' +
        '<path d="M18 38 L18 52 M18 60 L18 64" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M34 17 L48 17" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
        face(39, 57, 0.8));
    },
    sponge: function () {
      var holes = [[20, 38, 4, 3], [90, 36, 5, 3.5], [24, 58, 3.5, 3], [86, 58, 4, 3], [56, 63, 3, 2.2], [72, 40, 2.5, 2], [38, 64, 2.4, 2]];
      var h = '';
      holes.forEach(function (o) { h += '<ellipse cx="' + o[0] + '" cy="' + o[1] + '" rx="' + o[2] + '" ry="' + o[3] + '" fill="#E7A920"/>'; });
      return svg(112, 74,
        '<rect x="6" y="24" width="100" height="46" rx="8" fill="#FFD84D"' + S + '/>' +
        '<rect x="6" y="6" width="100" height="20" rx="6" fill="#5DBB4C"' + S + '/>' +
        '<path d="M16 13 L30 13 M44 17 L60 17 M74 12 L90 12" fill="none" stroke="#3F9A2E" stroke-width="2.5" stroke-linecap="round"/>' +
        h + face(56, 44, 0.85));
    },
    boat: function () {
      return svg(122, 98,
        '<rect x="57" y="8" width="6" height="56" rx="2" fill="#8A5A33"' + S3 + '/>' +
        '<path d="M65 12 L65 58 L104 58Z" fill="#FFD23F"' + S + '/>' +
        '<path d="M55 20 L55 58 L24 58Z" fill="#fff"' + S + '/>' +
        '<path d="M62 4 L78 9 L62 14Z" fill="#3FA9F5"' + S3 + '/>' +
        '<path d="M6 60 L116 60 Q112 78 99 92 L23 92 Q10 78 6 60Z" fill="#F0453A"' + S + '/>' +
        face(61, 72, 0.75));
    },
    rock: function () {
      return svg(100, 82,
        '<path d="M12 60 Q5 37 24 25 Q38 10 58 14 Q81 12 91 35 Q99 58 85 70 Q66 78 44 76 Q20 76 12 60Z" fill="#9AA3B5"' + S + '/>' +
        '<ellipse cx="27" cy="44" rx="6" ry="4" fill="#7F889C"/><ellipse cx="76" cy="31" rx="5" ry="3.5" fill="#7F889C"/>' +
        '<ellipse cx="75" cy="60" rx="7" ry="4" fill="#7F889C"/>' +
        shine(38, 25, 10, 4, -15, 0.5) + face(52, 49, 0.9));
    },
    key: function () {
      return svg(124, 64,
        '<path d="M84 36 L84 52 L92 52 L92 45 L100 45 L100 54 L108 54 L108 36Z" fill="#FFC93C"' + S + '/>' +
        '<rect x="48" y="25" width="66" height="13" rx="5" fill="#FFC93C"' + S + '/>' +
        '<circle cx="31" cy="32" r="25" fill="#FFC93C"' + S + '/>' +
        '<circle cx="14" cy="32" r="4.5" fill="#FFF3C4"' + S3 + '/>' +
        '<path d="M62 30 L84 30" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>' +
        face(35, 31, 0.8));
    },
    coin: function () {
      return svg(72, 72,
        '<circle cx="36" cy="36" r="31" fill="#FFC93C"' + S + '/>' +
        '<circle cx="36" cy="36" r="23" fill="none" stroke="#E0A21C" stroke-width="3"/>' +
        '<path d="M15 27 Q20 15 32 11" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>' +
        face(36, 36, 0.85));
    },
    spoon: function () {
      return svg(134, 52,
        '<path d="M7 22 Q40 18 78 23 L78 29 Q40 34 7 30 Q2 26 7 22Z" fill="#C9D3E2"' + S + '/>' +
        '<ellipse cx="103" cy="26" rx="26" ry="19" fill="#DDE5F0"' + S + '/>' +
        shine(93, 16, 8, 3.5, -10, 0.8) + face(104, 27, 0.75));
    },
    marble: function () {
      return svg(64, 64,
        '<circle cx="32" cy="32" r="27" fill="#5BC0F8"' + S + '/>' +
        '<path d="M10 30 Q28 9 54 21 Q34 22 16 38Z" fill="#2E86DE" opacity=".55"/>' +
        shine(21, 17, 6, 4, -30, 0.85) + face(33, 37, 0.62));
    },
    car: function () {
      return svg(126, 86,
        '<path d="M8 60 Q8 46 20 44 L36 42 L48 20 Q52 14 60 14 L84 14 Q92 14 96 22 L106 42 L112 44 Q120 46 120 58 L120 64 Q120 68 116 68 L12 68 Q8 68 8 64Z" fill="#F0453A"' + S + '/>' +
        '<path d="M53 21 L68 21 L68 40 L44 40Z" fill="#9FD8FF"' + S3 + '/>' +
        '<path d="M74 21 L86 21 Q90 21 92 25 L99 40 L74 40Z" fill="#9FD8FF"' + S3 + '/>' +
        '<ellipse cx="116" cy="52" rx="3" ry="4" fill="#FFE680"/>' +
        '<circle cx="33" cy="68" r="13" fill="#3A3350"' + S + '/><circle cx="33" cy="68" r="5" fill="#C9D3E2"/>' +
        '<circle cx="93" cy="68" r="13" fill="#3A3350"' + S + '/><circle cx="93" cy="68" r="5" fill="#C9D3E2"/>' +
        face(63, 51, 0.62));
    },
    egg: function () {
      return svg(72, 94,
        '<path d="M36 5 C58 5 67 48 65 62 C63 80 52 89 36 89 C20 89 9 80 7 62 C5 48 14 5 36 5Z" fill="#FCEBD0"' + S + '/>' +
        shine(23, 30, 5, 10, 15, 0.8) + face(37, 58, 0.9));
    },
    shell: function () {
      var cx = 52, cy = 84, tips = [[12, 36], [22, 18], [37, 9], [52, 6], [67, 9], [82, 18], [92, 36]], r = '';
      tips.forEach(function (t) {
        var dx = t[0] - cx, dy = t[1] - cy;
        r += 'M' + (cx + dx * 0.62).toFixed(1) + ' ' + (cy + dy * 0.62).toFixed(1) + ' L' + (cx + dx * 0.94).toFixed(1) + ' ' + (cy + dy * 0.94).toFixed(1) + ' ';
      });
      return svg(104, 94,
        '<path d="M38 82 L30 90 L74 90 L66 82Z" fill="#F49B82"' + S + '/>' +
        '<path d="M52 86 L16 58 Q4 40 14 26 Q30 6 52 6 Q74 6 90 26 Q100 40 88 58Z" fill="#FFB59E"' + S + '/>' +
        '<path d="' + r + '" fill="none" stroke="#E8846A" stroke-width="3" stroke-linecap="round"/>' +
        face(52, 58, 0.75));
    },
  };

  /* Fizz the frog (inline in the page: no ids). Mouth shapes switch with the .talk class. */
  function frog() {
    return '<svg viewBox="0 0 200 176" class="frog-svg" aria-hidden="true">' +
      '<ellipse cx="46" cy="160" rx="28" ry="11" fill="#5BB84A"' + S + '/>' +
      '<ellipse cx="154" cy="160" rx="28" ry="11" fill="#5BB84A"' + S + '/>' +
      '<ellipse cx="100" cy="124" rx="70" ry="44" fill="#6BCB5A"' + S + '/>' +
      '<ellipse cx="100" cy="134" rx="42" ry="28" fill="#D8F5B8"/>' +
      '<ellipse cx="100" cy="86" rx="80" ry="48" fill="#6BCB5A"' + S + '/>' +
      '<g class="eye"><circle cx="56" cy="44" r="27" fill="#6BCB5A"' + S + '/><circle cx="56" cy="44" r="19" fill="#fff"/>' +
      '<circle class="pupil" cx="60" cy="47" r="9.5" fill="' + OL + '"/><circle cx="63" cy="43" r="3.4" fill="#fff"/></g>' +
      '<g class="eye"><circle cx="144" cy="44" r="27" fill="#6BCB5A"' + S + '/><circle cx="144" cy="44" r="19" fill="#fff"/>' +
      '<circle class="pupil" cx="140" cy="47" r="9.5" fill="' + OL + '"/><circle cx="143" cy="43" r="3.4" fill="#fff"/></g>' +
      '<ellipse cx="42" cy="98" rx="12" ry="7" fill="#FF7E9D" opacity=".55"/>' +
      '<ellipse cx="158" cy="98" rx="12" ry="7" fill="#FF7E9D" opacity=".55"/>' +
      '<path class="m-shut" d="M62 92 Q100 122 138 92" fill="none" stroke="' + OL + '" stroke-width="5" stroke-linecap="round"/>' +
      '<g class="m-open"><path d="M64 89 Q100 142 136 89 Q100 101 64 89Z" fill="#C2304B" stroke="' + OL + '" stroke-width="4.5" stroke-linejoin="round"/>' +
      '<ellipse cx="100" cy="116" rx="15" ry="7" fill="#FF7A9A"/></g>' +
      '</svg>';
  }

  /* --- small icons (inline, no ids) --- */
  var ICON = {
    home: '<svg viewBox="0 0 48 48"><path d="M8 24 L24 9 L40 24" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 22 L13 39 L35 39 L35 22" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><rect x="20" y="28" width="8" height="11" rx="2" fill="currentColor"/></svg>',
    soundOn: '<svg viewBox="0 0 48 48"><path d="M8 19 L16 19 L26 10 L26 38 L16 29 L8 29Z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M32 17 Q37 24 32 31 M37 12 Q46 24 37 36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
    soundOff: '<svg viewBox="0 0 48 48"><path d="M8 19 L16 19 L26 10 L26 38 L16 29 L8 29Z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M33 18 L43 30 M43 18 L33 30" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 48 48"><path d="M24 4 L29.6 16.6 L43 18 L32.8 27.2 L35.8 40.6 L24 33.6 L12.2 40.6 L15.2 27.2 L5 18 L18.4 16.6Z" fill="#FFC93C" stroke="' + OL + '" stroke-width="3.2" stroke-linejoin="round"/><path d="M17 20 L21 19" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/></svg>',
    shuffle: '<svg viewBox="0 0 48 48"><path d="M10 22 Q12 10 24 10 Q32 10 36 16" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M38 8 L37 18 L28 16" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M38 26 Q36 38 24 38 Q16 38 12 32" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M10 40 L11 30 L20 32" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    net: '<svg viewBox="0 0 48 48"><path d="M30 18 L44 4" stroke="#B9783F" stroke-width="6" stroke-linecap="round"/><ellipse cx="20" cy="26" rx="14" ry="12" fill="#fff" fill-opacity=".5" stroke="currentColor" stroke-width="4"/><path d="M10 20 L30 34 M14 15 L33 28 M8 28 L22 38 M18 14 L18 38 M26 15 L26 37" stroke="currentColor" stroke-width="2" opacity=".6"/></svg>',
    // guess button pictures
    float: '<svg viewBox="0 0 100 80"><path d="M22 30 L22 16 M15 22 L22 15 L29 22" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M27 46 Q25 33 40 37 L55 37 Q74 34 74 48 Q72 59 50 59 Q29 59 27 46Z" fill="#FFD23F" stroke="' + OL + '" stroke-width="3.5" stroke-linejoin="round"/><circle cx="62" cy="27" r="10" fill="#FFD23F" stroke="' + OL + '" stroke-width="3.5"/><path d="M71 27 L80 29 L71 32Z" fill="#FF8A1F" stroke="' + OL + '" stroke-width="2.5" stroke-linejoin="round"/><circle cx="64" cy="25" r="2.2" fill="' + OL + '"/><path d="M0 48 Q12.5 41 25 48 T50 48 T75 48 T100 48 L100 80 L0 80Z" fill="#1F7FD1" fill-opacity=".78"/><path d="M0 48 Q12.5 41 25 48 T50 48 T75 48 T100 48" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></svg>',
    sink: '<svg viewBox="0 0 100 80"><path d="M0 14 Q12.5 7 25 14 T50 14 T75 14 T100 14 L100 80 L0 80Z" fill="#1F7FD1" fill-opacity=".78"/><path d="M0 14 Q12.5 7 25 14 T50 14 T75 14 T100 14" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><rect x="0" y="70" width="100" height="10" fill="#F6D98E"/><path d="M50 24 L50 44 M42 37 L50 45 L58 37" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 70 Q36 56 50 55 Q64 56 64 70Z" fill="#9AA3B5" stroke="' + OL + '" stroke-width="4" stroke-linejoin="round"/></svg>',
    // hand that shows the child what to do
    hand: '<svg viewBox="0 0 64 80"><path d="M24 44 L24 10 Q24 3 30 3 Q36 3 36 10 L36 34 Q38 28 44 30 Q48 31 48 37 Q50 33 55 35 Q59 37 59 43 L59 58 Q59 76 40 76 L34 76 Q22 76 15 64 L7 50 Q4 44 9 42 Q14 40 18 46Z" fill="#FFDDBF" stroke="' + OL + '" stroke-width="3.5" stroke-linejoin="round"/><path d="M36 34 L36 44 M48 37 L48 46" stroke="' + OL + '" stroke-width="3" stroke-linecap="round"/></svg>',
  };

  var urlCache = {};
  function toyUrl(id) {
    if (!urlCache[id]) urlCache[id] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(TOY_SVG[id]());
    return urlCache[id];
  }
  // viewBox size of a toy picture (its true shape; used for the physics box)
  function toyBox(id) {
    var m = /viewBox="0 0 (\d+) (\d+)"/.exec(TOY_SVG[id]());
    return { w: +m[1], h: +m[2] };
  }

  return { OL: OL, TOY_SVG: TOY_SVG, toyUrl: toyUrl, toyBox: toyBox, frog: frog, ICON: ICON };
})();
