/* ============================================================
   EXPERIMENT3.JS — "THE CLIMB", take three.

   Three layers, in this order:

   1. THE LADDER (WebGL, hand-written — no three.js). A straight ladder
      is uploaded to the GPU once; the vertex shader twists it around
      its own Z axis by an angle that grows with depth and with how
      hard you are scrolling, so scroll velocity physically torques the
      geometry. The camera flies down the inside of it for the whole
      page. Rungs are the four logo squares in 3D.
   2. THE CHOREOGRAPHY (GSAP + ScrollTrigger). Each <section> declares
      where the camera should be while it is on screen (data-cam-*) and
      how far the canvas should dim under it (data-scrim). Everything
      else — reveals, the pinned horizontal track, counters — hangs off
      the same scroll.
   3. THE INTERFACE. Cursor, magnetics, tilt, HUD, and the ordinary
      component behaviour (slides, accordion, tabs, popup, nav).

   Every layer is optional: no WebGL -> CSS stage; no GSAP -> content
   is still laid out and readable; reduced motion -> nothing moves on
   its own.
   ============================================================ */

(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  var BRAND = {
    coral: [0.937, 0.259, 0.400],
    blue: [0.047, 0.647, 0.816],
    yellow: [0.996, 0.827, 0.251],
    teal: [0.259, 0.667, 0.667],
    rail: [0.62, 0.72, 0.82],
    fog: [0.012, 0.070, 0.125]
  };
  // Coral leads the rung cycle — the ladder's primary colour — with yellow
  // taking the slot coral used to hold. Same order as the HUD ladder's rungs.
  var BRAND_HEX = ['#ef4266', '#0ca5d0', '#fed340', '#42aaaa'];

  var qs = function (s, c) { return (c || doc).querySelector(s); };
  var qsa = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ============================================================
     1. BOOT
     ============================================================ */
  var boot = qs('#x3-boot');
  var bootFill = qs('#x3-boot-fill');
  var bootPct = qs('#x3-boot-pct');

  /* The curtain is a piece of theatre, not a gate: it is driven by elapsed
     time (via rAF, so a throttled background tab cannot strand it mid-count)
     and it lifts at the later of "eager images in" or MIN_MS. Counting every
     <img> was the wrong model — the lazy ones below the fold never resolve
     until you scroll, and the load event waits on webfonts. */
  function runBoot(done) {
    if (!boot) { done(); return; }
    var MIN_MS = 1100, MAX_MS = 2600;
    var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
    var eager = qsa('img').filter(function (i) { return i.loading !== 'lazy'; });
    var pending = eager.filter(function (i) { return !i.complete; }).length;
    eager.forEach(function (img) {
      if (img.complete) return;
      var bump = function () { pending--; };
      img.addEventListener('load', bump, { once: true });
      img.addEventListener('error', bump, { once: true });
    });

    var closed = false;
    (function tick(now) {
      var t = ((now || 0) || ((window.performance && performance.now) ? performance.now() : Date.now())) - t0;
      var byTime = clamp(t / MIN_MS, 0, 1);
      var ready = (pending <= 0 && t >= MIN_MS) || t >= MAX_MS;
      var pct = ready ? 100 : Math.min(96, byTime * 92 + (t > MIN_MS ? 4 : 0));
      if (bootFill) bootFill.style.width = pct.toFixed(1) + '%';
      if (bootPct) bootPct.textContent = Math.round(pct);
      if (ready) {
        if (closed) return;
        closed = true;
        boot.classList.add('is-done');
        setTimeout(function () { boot.style.display = 'none'; }, 800);
        done();
        return;
      }
      requestAnimationFrame(tick);
    })();
  }

  /* ============================================================
     2. THE LADDER — WebGL
     ============================================================ */

  // --- minimal column-major mat4 ---
  function m4perspective(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
    return out;
  }
  function m4lookAt(out, eye, center, up) {
    var z0 = eye[0] - center[0], z1 = eye[1] - center[1], z2 = eye[2] - center[2];
    var len = Math.hypot(z0, z1, z2) || 1; z0 /= len; z1 /= len; z2 /= len;
    var x0 = up[1] * z2 - up[2] * z1, x1 = up[2] * z0 - up[0] * z2, x2 = up[0] * z1 - up[1] * z0;
    len = Math.hypot(x0, x1, x2);
    if (!len) { x0 = 1; x1 = 0; x2 = 0; } else { x0 /= len; x1 /= len; x2 /= len; }
    var y0 = z1 * x2 - z2 * x1, y1 = z2 * x0 - z0 * x2, y2 = z0 * x1 - z1 * x0;
    out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
    out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
    out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
    out[12] = -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]);
    out[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
    out[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]);
    out[15] = 1;
    return out;
  }

  // Ladder metrics. The path() here MUST match the one in the shader,
  // or the camera will fly beside the ladder instead of down it.
  var SPACING = 3.3;
  var RUNGS = 190;
  var RAIL_X = 2.15;
  var LENGTH = SPACING * RUNGS;
  function pathX(z) { return Math.sin(z * 0.011) * 4.2; }
  function pathY(z) { return Math.cos(z * 0.0135) * 2.7; }

  var VERT = [
    'attribute vec3 aPos;',
    'attribute vec3 aNor;',
    'attribute vec3 aCol;',
    'attribute float aGlow;',
    'uniform mat4 uProj;',
    'uniform mat4 uView;',
    'uniform float uTwist;',
    'uniform float uPhase;',
    'uniform float uTime;',
    'uniform float uWave;',
    'varying vec3 vNor;',
    'varying vec3 vCol;',
    'varying float vGlow;',
    'varying float vDepth;',
    'void main() {',
    '  float z = aPos.z;',
    '  float a = uPhase + z * uTwist + sin(z * 0.018 + uTime * 0.25) * uWave;',
    '  float c = cos(a), s = sin(a);',
    '  mat2 R = mat2(c, s, -s, c);',
    '  vec2 xy = R * aPos.xy;',
    '  vec2 path = vec2(sin(z * 0.011) * 4.2, cos(z * 0.0135) * 2.7);',
    '  vec3 world = vec3(xy + path, z);',
    '  vNor = normalize(vec3(R * aNor.xy, aNor.z));',
    '  vCol = aCol;',
    '  vGlow = aGlow;',
    '  vec4 v = uView * vec4(world, 1.0);',
    '  vDepth = -v.z;',
    '  gl_Position = uProj * v;',
    '}'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    'varying vec3 vNor;',
    'varying vec3 vCol;',
    'varying float vGlow;',
    'varying float vDepth;',
    'uniform vec3 uFog;',
    'uniform float uFogNear;',
    'uniform float uFogFar;',
    'uniform float uFlash;',
    'void main() {',
    '  vec3 N = normalize(vNor);',
    '  vec3 L1 = normalize(vec3(0.35, 0.85, 0.40));',
    '  vec3 L2 = normalize(vec3(-0.70, -0.25, 0.60));',
    '  float d1 = max(dot(N, L1), 0.0);',
    '  float d2 = max(dot(N, L2), 0.0);',
    '  vec3 base = vCol * (0.24 + 0.80 * d1) + vCol * 0.32 * d2;',
    '  float rim = pow(1.0 - abs(N.z), 3.0);',
    '  base += vCol * rim * 0.55 * (0.35 + vGlow);',
    '  base += vCol * vGlow * (0.40 + 0.45 * uFlash);',
    // near-field fade keeps geometry from smearing across the lens
    '  float near = smoothstep(0.0, 7.0, vDepth);',
    '  float f = clamp((vDepth - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);',
    '  f = f * f;',
    '  vec3 col = mix(base, uFog, f);',
    '  col = mix(uFog, col, near);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function buildGeometry() {
    var pos = [], nor = [], col = [], glow = [];

    // 6 faces x 2 tris, unit cube corners scaled per call
    var FACES = [
      { n: [0, 0, 1], v: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
      { n: [0, 0, -1], v: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
      { n: [1, 0, 0], v: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1]] },
      { n: [-1, 0, 0], v: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, -1, -1], [-1, 1, 1], [-1, 1, -1]] },
      { n: [0, 1, 0], v: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
      { n: [0, -1, 0], v: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, -1], [1, -1, 1], [-1, -1, 1]] }
    ];

    function box(cx, cy, cz, hx, hy, hz, c, g) {
      for (var f = 0; f < 6; f++) {
        var face = FACES[f];
        for (var i = 0; i < 6; i++) {
          var v = face.v[i];
          pos.push(cx + v[0] * hx, cy + v[1] * hy, cz + v[2] * hz);
          nor.push(face.n[0], face.n[1], face.n[2]);
          col.push(c[0], c[1], c[2]);
          glow.push(g);
        }
      }
    }

    var order = [BRAND.coral, BRAND.blue, BRAND.yellow, BRAND.teal];
    var SUB = 2;                       // rail segments per rung gap
    var segH = (SPACING / SUB) * 0.54; // half-depth, slight overlap so joins read solid

    for (var i = 0; i < RUNGS; i++) {
      var z = -i * SPACING;

      // rung — a brand square, spanning the rails
      box(0, 0, z, RAIL_X + 0.42, 0.17, 0.45, order[i % 4], 1.0);

      // the two rails
      for (var s = 0; s < SUB; s++) {
        var sz = z - (s + 0.5) * (SPACING / SUB);
        box(-RAIL_X, 0, sz, 0.17, 0.17, segH, BRAND.rail, 0.12);
        box(RAIL_X, 0, sz, 0.17, 0.17, segH, BRAND.rail, 0.12);
      }
    }

    // Drifting brand squares for parallax depth. Deterministic pseudo-random
    // so the scene is identical on every load.
    var seed = 1337;
    function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
    for (var k = 0; k < 90; k++) {
      var kz = -rnd() * LENGTH;
      var ang = rnd() * Math.PI * 2;
      var rad = 6 + rnd() * 12;
      var size = 0.28 + rnd() * 0.5;
      box(Math.cos(ang) * rad, Math.sin(ang) * rad, kz, size, size, size * 0.22, order[k % 4], 0.8);
    }

    return {
      pos: new Float32Array(pos),
      nor: new Float32Array(nor),
      col: new Float32Array(col),
      glow: new Float32Array(glow),
      count: pos.length / 3
    };
  }

  var Ladder = {
    ok: false,
    // live camera state, lerped toward .target every frame
    cam: { x: 0, y: 0, fov: 62, roll: 0, twist: 1 },
    target: { x: 0, y: 0, fov: 62, roll: 0, twist: 1 },
    mouse: { x: 0, y: 0, tx: 0, ty: 0 },
    progress: 0, shownProgress: 0, velocity: 0,
    phase: 0, flash: 0
  };

  function initLadder() {
    var canvas = qs('#x3-gl');
    if (!canvas) return false;
    var gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' })
      || canvas.getContext('experimental-webgl');
    if (!gl) return false;

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('[x3] shader:', gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    }
    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('[x3] link:', gl.getProgramInfoLog(prog));
      return false;
    }
    gl.useProgram(prog);

    var geo = buildGeometry();
    function attrib(name, data, size) {
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
    attrib('aPos', geo.pos, 3);
    attrib('aNor', geo.nor, 3);
    attrib('aCol', geo.col, 3);
    attrib('aGlow', geo.glow, 1);

    var U = {};
    ['uProj', 'uView', 'uTwist', 'uPhase', 'uTime', 'uWave', 'uFog', 'uFogNear', 'uFogFar', 'uFlash']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(BRAND.fog[0], BRAND.fog[1], BRAND.fog[2], 1);

    var proj = new Float32Array(16), view = new Float32Array(16);
    var aspect = 1;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(window.innerWidth * dpr);
      var h = Math.round(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    }
    resize();
    window.addEventListener('resize', resize);

    Ladder.ok = true;
    Ladder.render = function (t) {
      var L = Ladder;
      var camZ = 9 - L.shownProgress * (LENGTH - 150);
      var aheadZ = camZ - 34;

      // The camera rides ALONGSIDE the ladder, not down its bore: the same
      // offset is added to both the eye and the look-at point, so the view
      // direction stays parallel to the ladder's axis and the ladder itself
      // sits off to one side, receding to a vanishing point near the middle
      // of the frame. cam.x/cam.y are that offset — negative x puts the
      // ladder on the right of the screen, positive x on the left.
      // A lateral offset that frames nicely on a 1440px screen throws the
      // ladder clean off the edge of a phone, because horizontal FOV shrinks
      // with the viewport. Scale the framing with the width.
      var k = clamp(window.innerWidth / 1440, 0.4, 1.1);
      var offX = L.cam.x * k + L.mouse.x * 1.6;
      var offY = L.cam.y * (0.55 + 0.45 * k) + L.mouse.y * 1.2;

      var eye = [pathX(camZ) + offX, pathY(camZ) + offY, camZ];
      var at = [pathX(aheadZ) + offX, pathY(aheadZ) + offY, aheadZ];
      var up = [Math.sin(L.cam.roll), Math.cos(L.cam.roll), 0];

      m4perspective(proj, L.cam.fov * Math.PI / 180, aspect, 0.6, 420);
      m4lookAt(view, eye, at, up);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(U.uProj, false, proj);
      gl.uniformMatrix4fv(U.uView, false, view);
      // Base torsion per section, plus the kick from how fast you are scrolling.
      gl.uniform1f(U.uTwist, 0.012 * L.cam.twist + clamp(L.velocity * 0.9, -0.022, 0.022));
      gl.uniform1f(U.uPhase, L.phase);
      gl.uniform1f(U.uTime, t);
      gl.uniform1f(U.uWave, 0.16);
      gl.uniform3f(U.uFog, BRAND.fog[0], BRAND.fog[1], BRAND.fog[2]);
      gl.uniform1f(U.uFogNear, 45);
      gl.uniform1f(U.uFogFar, 320);
      gl.uniform1f(U.uFlash, L.flash);
      gl.drawArrays(gl.TRIANGLES, 0, geo.count);
    };
    return true;
  }

  /* ============================================================
     3. SCROLL ENGINE
     ============================================================ */
  var scrimEl = qs('#x3-scrim');
  var progressEl = qs('#x3-progress');
  var progressFill = progressEl ? progressEl.querySelector('i') : null;
  var hud = qs('#x3-hud');
  var hudItems = qsa('#x3-hud-rungs li');
  var toast = qs('#x3-toast');
  var toastText = toast ? toast.querySelector('.x3-toast-text') : null;
  var toastSq = toast ? toast.querySelector('.x3-toast-sq') : null;
  var topBtn = qs('#x3-top');
  var nav = qs('#x3-nav');

  var currentRung = -1;
  var toastTimer = null;
  var cursorDot = null;   // set by initCursor; the square takes the section's colour

  function scrollMax() {
    return Math.max(doc.body.scrollHeight - window.innerHeight, 1);
  }

  function setRung(n, label) {
    if (n === currentRung) return;
    var forward = n > currentRung;
    currentRung = n;
    hudItems.forEach(function (li, i) {
      li.classList.toggle('is-done', i < n);
      li.classList.toggle('is-current', i === n);
    });
    if (toast && toastText && forward && n > 0) {
      toastText.innerHTML = '<b>Rung ' + (n < 10 ? '0' + n : n) + '</b> &middot; ' + label;
      if (toastSq) toastSq.style.background = BRAND_HEX[n % 4];
      toast.classList.add('is-on');
      Ladder.flash = 1;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 2200);
    }
  }

  /* Which section owns the camera right now.

     This is measured every frame from cached offsets rather than driven by
     ScrollTrigger enter/leave callbacks: those fire during refresh in DOM
     order and against whatever layout existed at creation time, which — with
     lazily-loaded images and a pinned track shifting everything below it —
     reliably latched the wrong section on first paint. A "which band is the
     viewport centre in" test cannot get out of sync. */
  var sectionData = [];
  var activeSection = -1;

  function measureSections() {
    sectionData = qsa('.x3-sec').map(function (sec) {
      var rung = parseInt(sec.dataset.rung || 0, 10);
      var labelEl = hudItems[rung] ? hudItems[rung].querySelector('span') : null;
      return {
        top: sec.getBoundingClientRect().top + window.scrollY,
        x: parseFloat(sec.dataset.camX || 0),
        y: parseFloat(sec.dataset.camY || 0),
        fov: parseFloat(sec.dataset.camFov || 62),
        twist: parseFloat(sec.dataset.camTwist || 1),
        roll: parseFloat(sec.dataset.camRoll || 0),
        scrim: parseFloat(sec.dataset.scrim || 0.5),
        rung: rung,
        label: labelEl ? labelEl.textContent : ''
      };
    }).sort(function (a, b) { return a.top - b.top; });
    activeSection = -1;
  }

  function syncSection() {
    if (!sectionData.length) return;
    var mark = window.scrollY + window.innerHeight * 0.42;
    var idx = 0;
    for (var i = 0; i < sectionData.length; i++) {
      if (sectionData[i].top <= mark) idx = i; else break;
    }
    if (idx === activeSection) return;
    activeSection = idx;
    var s = sectionData[idx];
    Ladder.target.x = s.x;
    Ladder.target.y = s.y;
    Ladder.target.fov = s.fov;
    Ladder.target.twist = s.twist;
    Ladder.target.roll = s.roll;
    if (scrimEl) scrimEl.style.opacity = s.scrim;
    if (cursorDot) cursorDot.style.background = BRAND_HEX[idx % 4];
    setRung(s.rung, s.label);
  }

  function initSections() {
    measureSections();
    // The camera should not ease in from nowhere on first paint.
    if (sectionData.length) {
      var first = sectionData[0];
      Ladder.cam.x = Ladder.target.x = first.x;
      Ladder.cam.y = Ladder.target.y = first.y;
      Ladder.cam.fov = Ladder.target.fov = first.fov;
      Ladder.cam.roll = Ladder.target.roll = first.roll;
      Ladder.cam.twist = Ladder.target.twist = first.twist;
    }
    syncSection();
    window.addEventListener('resize', measureSections);
    if (hasST) ScrollTrigger.addEventListener('refresh', measureSections);
  }

  // The single render loop: scroll smoothing, camera easing, canvas.
  function startLoop() {
    var last = 0, lastProgress = 0;
    function frame(ts) {
      var t = ts * 0.001;
      var dt = Math.min(t - last, 0.05); last = t;

      syncSection();

      var raw = clamp(window.scrollY / scrollMax(), 0, 1);
      Ladder.progress = raw;
      Ladder.shownProgress = lerp(Ladder.shownProgress, raw, REDUCED ? 1 : 0.075);

      var delta = Ladder.shownProgress - lastProgress;
      lastProgress = Ladder.shownProgress;
      Ladder.velocity = lerp(Ladder.velocity, delta * 60, 0.2);

      // idle drift + scroll-driven spin: the ladder rolls as you climb
      if (!REDUCED) Ladder.phase += dt * 0.055 + delta * 6.5;

      Ladder.mouse.x = lerp(Ladder.mouse.x, Ladder.mouse.tx, 0.06);
      Ladder.mouse.y = lerp(Ladder.mouse.y, Ladder.mouse.ty, 0.06);

      var e = REDUCED ? 1 : 0.045;
      Ladder.cam.x = lerp(Ladder.cam.x, Ladder.target.x, e);
      Ladder.cam.y = lerp(Ladder.cam.y, Ladder.target.y, e);
      Ladder.cam.fov = lerp(Ladder.cam.fov, Ladder.target.fov, e);
      Ladder.cam.roll = lerp(Ladder.cam.roll, Ladder.target.roll, e);
      Ladder.cam.twist = lerp(Ladder.cam.twist, Ladder.target.twist, e);
      Ladder.flash = lerp(Ladder.flash, 0, 0.05);

      if (Ladder.ok) Ladder.render(t);

      var pct = Math.round(raw * 100);
      if (progressFill) progressFill.style.width = pct + '%';
      if (progressEl) progressEl.setAttribute('aria-valuenow', pct);
      // Fills the HUD ladder's rails and slides the climber up them.
      if (hud) hud.style.setProperty('--climb', pct + '%');
      if (topBtn) topBtn.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.8);

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('mousemove', function (e) {
    Ladder.mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    Ladder.mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ============================================================
     4. NAVBAR
     ============================================================ */
  function initNav() {
    var lastY = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (!nav) return;
      nav.classList.toggle('is-stuck', y > 40);
      nav.classList.toggle('is-hidden', y > lastY && y > 320 && !navOpen);
      lastY = y;
    }, { passive: true });

    var burger = qs('#x3-burger');
    var menu = qs('#x3-nav-menu');
    var navOpen = false;
    if (burger && menu) {
      burger.addEventListener('click', function () {
        navOpen = !navOpen;
        burger.setAttribute('aria-expanded', String(navOpen));
        menu.classList.toggle('is-open', navOpen);
      });
      menu.addEventListener('click', function (e) {
        if (e.target.closest('a') && window.innerWidth <= 1100) {
          navOpen = false;
          burger.setAttribute('aria-expanded', 'false');
          menu.classList.remove('is-open');
        }
      });
    }

    // Dropdowns: hover on desktop (CSS), tap to expand on narrow screens.
    qsa('.x3-nav-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.parentElement;
        var open = item.classList.contains('is-open');
        qsa('.x3-nav-item').forEach(function (n) {
          n.classList.remove('is-open');
          var t = n.querySelector('.x3-nav-toggle');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
        if (!open) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
    doc.addEventListener('click', function (e) {
      if (!e.target.closest('.x3-nav-item')) {
        qsa('.x3-nav-item').forEach(function (n) { n.classList.remove('is-open'); });
      }
    });
  }

  /* ============================================================
     5. CURSOR, MAGNETICS, TILT
     ============================================================ */
  function initCursor() {
    if (REDUCED || window.matchMedia('(hover: none)').matches) return;
    var cur = qs('#x3-cursor');
    if (!cur) return;
    var dot = cur.querySelector('.x3-cursor-dot');
    cursorDot = dot;
    var ring = cur.querySelector('.x3-cursor-ring');
    var label = cur.querySelector('.x3-cursor-label');
    var x = window.innerWidth / 2, y = window.innerHeight / 2;
    var rx = x, ry = y, dx = x, dy = y;

    window.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; }, { passive: true });
    window.addEventListener('mousedown', function () { cur.classList.add('is-down'); });
    window.addEventListener('mouseup', function () { cur.classList.remove('is-down'); });

    (function loop() {
      dx = lerp(dx, x, 0.42); dy = lerp(dy, y, 0.42);
      rx = lerp(rx, x, 0.16); ry = lerp(ry, y, 0.16);
      dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (rx - dx) * 1.2 + 'deg)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) rotate(' + (rx - dx) * 0.6 + 'deg)';
      requestAnimationFrame(loop);
    })();

    var STATES = { link: 'is-link', cta: 'is-cta', view: 'is-view', drag: 'is-drag' };
    var LABELS = { view: 'View', drag: 'Drag' };

    function setState(kind) {
      Object.keys(STATES).forEach(function (k) { cur.classList.toggle(STATES[k], k === kind); });
      if (label) label.textContent = LABELS[kind] || '';
    }

    doc.addEventListener('mouseover', function (e) {
      var el = e.target.closest('[data-cursor], [data-cursor-zone], a, button');
      if (!el) { setState(null); return; }
      var kind = el.dataset.cursor || el.dataset.cursorZone
        || (el.tagName === 'A' || el.tagName === 'BUTTON' ? 'link' : null);
      setState(kind);
    });
  }

  function initMagnetic() {
    if (REDUCED || !hasGSAP || window.matchMedia('(hover: none)').matches) return;
    qsa('[data-magnetic]').forEach(function (el) {
      var strength = 0.32;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - (r.left + r.width / 2)) * strength,
          y: (e.clientY - (r.top + r.height / 2)) * strength,
          duration: 0.5, ease: 'power3.out'
        });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  function initTilt() {
    if (REDUCED || !hasGSAP || window.matchMedia('(hover: none)').matches) return;
    qsa('[data-tilt]').forEach(function (el) {
      el.style.transformStyle = 'preserve-3d';
      var parent = el.parentElement;
      if (parent && !parent.style.perspective) parent.style.perspective = '1200px';
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, {
          rotationY: px * 9, rotationX: -py * 9, scale: 1.012,
          duration: 0.6, ease: 'power3.out', transformPerspective: 1200
        });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { rotationX: 0, rotationY: 0, scale: 1, duration: 0.9, ease: 'power3.out' });
      });
    });
  }

  /* ============================================================
     6. REVEALS
     ============================================================ */
  function initReveals() {
    if (!hasST) return;
    if (REDUCED) return;

    // Headings: split to lines, masked, staggered up. The hero's headings are
    // excluded — they belong to the slide rotation (initHero), and two tweens
    // owning one element's opacity is how you get a heading stuck at 30%.
    qsa('[data-split]').filter(function (el) { return !el.closest('.x3-hero'); }).forEach(function (el) {
      var targets = null;
      if (typeof window.SplitText !== 'undefined') {
        try {
          var sp = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'x3-line' });
          targets = sp.lines;
        } catch (err) { targets = null; }
      }
      if (targets && targets.length) {
        gsap.from(targets, {
          yPercent: 118, opacity: 0, duration: 1.05, ease: 'expo.out', stagger: 0.09,
          scrollTrigger: { trigger: el, start: 'top 85%' }
        });
      } else {
        gsap.from(el, {
          y: 40, opacity: 0, duration: 1, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%' }
        });
      }
    });

    // Everything else: a short lift, batched so long grids stagger.
    var blocks = qsa([
      '.x3-marker', '.x3-lead', '.x3-tags', '.x3-figure', '.x3-stat', '.x3-stat-cta',
      '.x3-acc-item', '.x3-arch-media', '.x3-panel', '.x3-tabs', '.x3-tabpanel-inner',
      '.x3-story-card', '.x3-voice', '.x3-quote', '.x3-cat-card', '.x3-final-copy',
      '.x3-final-img', '.x3-eyebrow', '.x3-kicker', '.x3-footer-col', '.x3-footer-brand'
    ].join(',')).filter(function (el) {
      // The hero has its own intro below; anything in the first screenful
      // must not wait for a scroll it may never get.
      return !el.closest('.x3-boot') && !el.closest('.x3-hero');
    });

    // Hide first, batch second: ScrollTrigger.batch fires onEnter for anything
    // already in view the moment it is created, so setting the start state
    // after that would leave the first screenful invisible forever.
    gsap.set(blocks, { opacity: 0, y: 34 });
    ScrollTrigger.batch(blocks, {
      start: 'top 88%',
      onEnter: function (batch) {
        gsap.to(batch, {
          y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.07, overwrite: true
        });
      }
    });

    // Images breathe a little as they pass.
    qsa('.x3-story-media img, .x3-slab-img img, .x3-final-img img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // Hero furniture: plays on load, never on scroll. On a short viewport the
    // trust row can sit below the batch's 88% line, and an element that only
    // appears once you scroll is an element some visitors never see.
    var heroBits = qsa('.x3-hero-eyebrow, .x3-hero-controls, .x3-trust');
    if (heroBits.length) {
      gsap.from(heroBits, {
        y: 26, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, delay: 0.2
      });
    }

    // Footer wordmark: letters splay out on the last stretch of scroll.
    var word = qs('#x3-footer-word');
    if (word) {
      gsap.from(word.children, {
        yPercent: 110, opacity: 0, stagger: 0.05, ease: 'expo.out', duration: 1.1,
        scrollTrigger: { trigger: word, start: 'top 92%' }
      });
    }
  }

  /* ============================================================
     7. PINNED HORIZONTAL TRACK (the ladder story)
     ============================================================ */
  function initTrack() {
    var track = qs('#x3-track');
    var rail = qs('#x3-track-rail');
    if (!track || !rail || !hasST) return;
    if (REDUCED || window.innerWidth < 760) {
      rail.style.overflowX = 'auto';
      rail.style.scrollSnapType = 'x mandatory';
      qsa('.x3-slab', rail).forEach(function (s) { s.style.scrollSnapAlign = 'center'; });
      return;
    }

    var slabs = qsa('.x3-slab', rail);

    ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: function () { return '+=' + (rail.scrollWidth - window.innerWidth + window.innerHeight * 0.5); },
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        var distance = rail.scrollWidth - window.innerWidth;
        gsap.set(rail, { x: -distance * self.progress });
        // Each slab turns to face the centre of the screen as it passes.
        var mid = window.innerWidth / 2;
        slabs.forEach(function (s) {
          var r = s.getBoundingClientRect();
          var off = ((r.left + r.width / 2) - mid) / mid;
          gsap.set(s, {
            rotationY: clamp(off * -18, -22, 22),
            rotateZ: off * 1.2,
            scale: 1 - Math.min(Math.abs(off) * 0.06, 0.09),
            transformPerspective: 1400,
            transformOrigin: 'center center'
          });
        });
      }
    });
  }

  /* ============================================================
     8. COUNTERS
     ============================================================ */
  function initCounters() {
    qsa('.x3-count').forEach(function (el) {
      var to = parseFloat(el.dataset.countTo || '0');
      var suffix = el.dataset.countSuffix || '';
      var run = function () {
        if (el.dataset.done) return;
        el.dataset.done = '1';
        if (!hasGSAP || REDUCED) { el.textContent = to + suffix; return; }
        var o = { v: 0 };
        gsap.to(o, {
          v: to, duration: 1.9, ease: 'power2.out',
          onUpdate: function () { el.textContent = Math.round(o.v) + suffix; }
        });
      };
      if (hasST) ScrollTrigger.create({ trigger: el, start: 'top 92%', onEnter: run });
      else run();
    });
  }

  /* ============================================================
     9. COMPONENTS
     ============================================================ */
  function initHero() {
    var wrap = qs('[data-hero-slides]');
    var dots = qsa('[data-hero-dots] .x3-dot');
    if (!wrap) return;
    var slides = qsa('.x3-hero-slide', wrap);
    var i = 0, timer = null;

    // Split each heading into words once, up front. Words (not lines) because
    // the first banner is a "Design | Structure | Orchestrate | Implement"
    // run that has to keep wrapping like normal text.
    var parts = slides.map(function (s) {
      var h = s.querySelector('.x3-hero-h');
      var words = null;
      if (h && typeof window.SplitText !== 'undefined' && !REDUCED) {
        try { words = new SplitText(h, { type: 'words', wordsClass: 'x3-word' }).words; }
        catch (err) { words = null; }
      }
      return {
        words: (words && words.length) ? words : (h ? [h] : []),
        rest: qsa('.x3-hero-sub, .x3-hero-body', s)
      };
    });

    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      dots.forEach(function (d, k) {
        d.classList.toggle('is-active', k === i);
        d.setAttribute('aria-selected', String(k === i));
      });
      if (hasGSAP && !REDUCED) {
        var p = parts[i];
        gsap.fromTo(p.words,
          { yPercent: 70, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.035, overwrite: true });
        gsap.fromTo(p.rest,
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, delay: 0.12, ease: 'expo.out', stagger: 0.08, overwrite: true });
      }
    }
    function play() { if (REDUCED) return; stop(); timer = setInterval(function () { show(i + 1); }, 6500); }
    function stop() { if (timer) clearInterval(timer); timer = null; }

    dots.forEach(function (d, k) {
      d.addEventListener('click', function () { show(k); play(); });
    });
    wrap.addEventListener('mouseenter', stop);
    wrap.addEventListener('mouseleave', play);
    doc.addEventListener('visibilitychange', function () { doc.hidden ? stop() : play(); });
    show(0);
    play();
  }

  function initAccordion() {
    var acc = qs('#x3-acc');
    if (!acc) return;
    var items = qsa('.x3-acc-item', acc);

    function setOpen(item, open) {
      var body = item.querySelector('.x3-acc-body');
      var head = item.querySelector('.x3-acc-head');
      var inner = item.querySelector('.x3-acc-inner');
      item.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', String(open));
      var h = open ? inner.scrollHeight : 0;
      if (hasGSAP && !REDUCED) gsap.to(body, { height: h, duration: 0.6, ease: 'expo.out' });
      else body.style.height = h + 'px';
    }

    items.forEach(function (item, idx) {
      setOpen(item, idx === 0);
      item.querySelector('.x3-acc-head').addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');
        items.forEach(function (o) { if (o !== item) setOpen(o, false); });
        setOpen(item, willOpen);
        // the media beside it follows the open panel
        showArch(idx % 2);
      });
    });
    window.addEventListener('resize', function () {
      items.forEach(function (item) {
        if (item.classList.contains('is-open')) {
          item.querySelector('.x3-acc-body').style.height = item.querySelector('.x3-acc-inner').scrollHeight + 'px';
        }
      });
    });
  }

  var archIndex = 0;
  function showArch(n) {
    var stack = qs('#x3-arch-stack');
    if (!stack) return;
    var figs = qsa('figure', stack);
    archIndex = (n + figs.length) % figs.length;
    figs.forEach(function (f, k) { f.classList.toggle('is-active', k === archIndex); });
  }
  function initArch() {
    var prev = qs('[data-arch-prev]');
    var next = qs('[data-arch-next]');
    if (prev) prev.addEventListener('click', function () { showArch(archIndex - 1); });
    if (next) next.addEventListener('click', function () { showArch(archIndex + 1); });
  }

  function initGallery() {
    var gal = qs('#x3-gallery');
    if (!gal) return;
    var panels = qsa('.x3-panel', gal);
    var coarse = window.matchMedia('(hover: none)').matches;

    panels.forEach(function (p) {
      var open = function () {
        panels.forEach(function (o) { o.classList.toggle('is-open', o === p); });
      };
      if (!coarse) p.addEventListener('mouseenter', open);
      p.addEventListener('focus', open);
      p.addEventListener('click', function (e) {
        // These are placeholder links — keep the page put and just expand.
        if (p.getAttribute('href') === '#') e.preventDefault();
        open();
      });
    });
  }

  function initTabs() {
    var tabs = qsa('.x3-tab');
    if (!tabs.length) return;
    var panels = qsa('.x3-tabpanel');

    function select(idx) {
      tabs.forEach(function (t, i) {
        t.classList.toggle('is-active', i === idx);
        t.setAttribute('aria-selected', String(i === idx));
        t.tabIndex = i === idx ? 0 : -1;
      });
      panels.forEach(function (p, i) {
        var on = i === idx;
        p.classList.toggle('is-active', on);
        if (on) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
      });
      if (hasGSAP && !REDUCED) {
        var inner = panels[idx].querySelector('.x3-tabpanel-inner');
        gsap.fromTo(inner.children,
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.08, overwrite: true });
      }
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        var next = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        select(next); tabs[next].focus();
      });
    });
  }

  function initPopup() {
    var popup = qs('#popup-form');
    if (!popup) return;
    var lastFocus = null;

    function open(e) {
      if (e) e.preventDefault();
      lastFocus = doc.activeElement;
      popup.removeAttribute('hidden');
      doc.body.classList.add('x3-locked');
      if (hasGSAP && !REDUCED) {
        gsap.fromTo(popup.querySelector('.x3-popup-card'),
          { y: 40, opacity: 0, scale: 0.97 },
          { y: 0, opacity: 1, scale: 1, duration: 0.65, ease: 'expo.out' });
        gsap.fromTo(popup.querySelector('.x3-popup-scrim'), { opacity: 0 }, { opacity: 1, duration: 0.4 });
      }
      var first = popup.querySelector('input, select, textarea, button');
      if (first) setTimeout(function () { first.focus(); }, 60);
    }
    function close() {
      popup.setAttribute('hidden', '');
      doc.body.classList.remove('x3-locked');
      if (lastFocus) lastFocus.focus();
    }

    qsa('[data-open-popup]').forEach(function (btn) { btn.addEventListener('click', open); });
    qsa('[data-close-popup]', popup).forEach(function (btn) { btn.addEventListener('click', close); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !popup.hasAttribute('hidden')) close();
    });

    var form = qs('#x3-contact-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        // No backend on this page — mirror index.html's success state.
        e.preventDefault();
        form.setAttribute('hidden', '');
        var done = popup.querySelector('.x3-form-done');
        if (done) done.removeAttribute('hidden');
      });
    }
  }

  function initTop() {
    if (!topBtn) return;
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    });
  }

  /* ============================================================
     BOOTSTRAP
     ============================================================ */
  function start() {
    if (!initLadder()) root.classList.add('x3-nogl');
    startLoop();

    initNav();
    initHero();
    initAccordion();
    initArch();
    initGallery();
    initTabs();
    initPopup();
    initTop();
    initCounters();
    initCursor();
    initMagnetic();
    initTilt();

    // Splitting before webfonts land produces wrong line breaks.
    var go = function () {
      initSections();
      initReveals();
      initTrack();
      if (hasST) ScrollTrigger.refresh();
      root.classList.add('x3-ready');
      if (hud) hud.classList.add('is-ready');
    };
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(go).catch(go);
    else window.addEventListener('load', go);
  }

  runBoot(function () { /* boot finished; page is already live behind it */ });

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();
})();
