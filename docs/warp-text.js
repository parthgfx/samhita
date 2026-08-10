/*
  WarpText — vanilla port of the React Bits component.

  Two departures from the original, both forced by this project rather than by
  preference:

  1. No React. This site is static HTML with no bundler (same reason the
     AccordionGallery was ported — see accordion-gallery.js).

  2. No `ogl`. The original lists it as a dependency, but uses exactly five of
     its exports (Renderer, Program, Mesh, Triangle, Texture) as a thin wrapper
     over a fullscreen-triangle draw with one texture. With no bundler, adding
     it would mean vendoring an ES-module build and an import map for ~30 lines
     of setup. The raw WebGL2 below does the same job; the shader is the
     component's own, unaltered.

  It renders the footer's "samhita" wordmark into a canvas texture and warps it
  with ambient noise plus a cursor lens.

  Progressive enhancement, deliberately: the real .big-letters markup stays in
  the DOM and visible. This only hides it and swaps in the canvas once WebGL2
  has actually initialised, so a browser without WebGL2 — or with the context
  refused — keeps the plain wordmark rather than an empty footer. It also stays
  off entirely under prefers-reduced-motion.
*/
(function () {
  "use strict";

  var VERT =
    "#version 300 es\n" +
    "in vec2 position;\n" +
    "out vec2 vUv;\n" +
    "void main() {\n" +
    "  vUv = position * 0.5 + 0.5;\n" +
    "  gl_Position = vec4(position, 0.0, 1.0);\n" +
    "}\n";

  var FRAG =
    "#version 300 es\n" +
    "precision highp float;\n" +
    "uniform sampler2D uTextTexture;\n" +
    "uniform vec2 uResolution;\n" +
    "uniform vec2 uPointer;\n" +
    "uniform float uPointerActive;\n" +
    "uniform float uTime;\n" +
    "uniform float uWarpStrength;\n" +
    "uniform float uWarpScale;\n" +
    "uniform float uSpeed;\n" +
    "uniform float uPointerInfluence;\n" +
    "uniform float uPointerStrength;\n" +
    "uniform float uRefraction;\n" +
    "uniform float uRipple;\n" +
    "uniform float uMotion;\n" +
    "in vec2 vUv;\n" +
    "out vec4 fragColor;\n" +
    "float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}\n" +
    "float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f);" +
    "float a=hash(i);float b=hash(i+vec2(1.0,0.0));float c=hash(i+vec2(0.0,1.0));float d=hash(i+vec2(1.0,1.0));" +
    "return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}\n" +
    "float fbm(vec2 p){float v=0.0;float a=0.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.02;a*=0.5;}return v;}\n" +
    "vec4 sampleText(vec2 uv){if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){return vec4(0.0);}return texture(uTextTexture,uv);}\n" +
    "void main(){\n" +
    "  vec2 uv = vUv;\n" +
    "  float aspect = uResolution.x / max(uResolution.y, 1.0);\n" +
    "  float time = uTime * uSpeed;\n" +
    "  float scale = max(uWarpScale, 0.001);\n" +
    "  vec2 drift = vec2(time * 0.055, -time * 0.045);\n" +
    "  float n1 = fbm(uv * scale * 3.1 + drift);\n" +
    "  float n2 = fbm((uv + 19.17) * scale * 3.4 - drift.yx);\n" +
    "  vec2 ambient = (vec2(n1, n2) - 0.5) * uWarpStrength * 0.045 * uMotion;\n" +
    "  vec2 pointerDelta = uv - uPointer;\n" +
    "  vec2 aspectDelta = vec2(pointerDelta.x * aspect, pointerDelta.y);\n" +
    "  float dist = length(aspectDelta);\n" +
    "  float radius = max(uPointerInfluence, 0.001);\n" +
    "  float t = clamp(dist / radius, 0.0, 1.0);\n" +
    "  float lens = smoothstep(radius, 0.0, dist) * uPointerActive;\n" +
    "  float bulge = t * (1.0 - t) * (1.0 - t) * 6.75 * uPointerActive;\n" +
    "  vec2 dir = dist > 0.0001 ? vec2(aspectDelta.x / aspect, aspectDelta.y) / dist : vec2(0.0);\n" +
    "  float rippleWave = sin(dist * 28.0 - time * 4.2) * 0.5 + 0.5;\n" +
    "  float rippleRing = (rippleWave - 0.5) * uRipple;\n" +
    "  vec2 pointerWarp = -dir * bulge * uPointerStrength * 0.045;\n" +
    "  pointerWarp += dir * rippleRing * bulge * uPointerStrength * 0.016;\n" +
    "  vec2 displaced = uv + ambient + pointerWarp;\n" +
    "  vec2 splitDir = ambient + pointerWarp;\n" +
    "  float splitLen = length(splitDir);\n" +
    "  splitDir = splitLen > 0.00001 ? splitDir / splitLen : vec2(0.7071, 0.7071);\n" +
    "  vec2 split = splitDir * uRefraction * 0.16 * (0.35 + lens * 1.65);\n" +
    "  vec4 base = sampleText(displaced);\n" +
    "  float r = sampleText(displaced + split).r;\n" +
    "  float g = base.g;\n" +
    "  float b = sampleText(displaced - split).b;\n" +
    "  float a = max(max(sampleText(displaced + split).a, base.a), sampleText(displaced - split).a);\n" +
    "  vec3 color = vec3(r, g, b) + lens * base.a * 0.055;\n" +
    "  fragColor = vec4(color, a);\n" +
    "}\n";

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn("WarpText shader:", gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  function num(el, name, fallback) {
    var v = parseFloat(el.getAttribute("data-" + name));
    return isNaN(v) ? fallback : v;
  }

  function init(host) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var source = host.querySelector("[data-warp-source]");
    var text = (host.getAttribute("data-warp-text") || (source && source.textContent) || "").trim();
    if (!text) return;

    var opts = {
      color: host.getAttribute("data-warp-color") || "#ffffff",
      warpStrength: num(host, "warp-strength", 0.08),
      warpScale: num(host, "warp-scale", 1.7),
      speed: num(host, "speed", 0.55),
      pointerInfluence: num(host, "pointer-influence", 0.42),
      pointerStrength: num(host, "pointer-strength", 0.38),
      refraction: num(host, "refraction", 0.018),
      ripple: host.getAttribute("data-ripple") !== "false",
      fontWeight: host.getAttribute("data-font-weight") || "700",
      letterSpacing: num(host, "letter-spacing", -0.06)
    };

    var canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "warp-text__canvas";

    var gl = canvas.getContext("webgl2", {
      alpha: true, premultipliedAlpha: false, antialias: true
    });
    if (!gl) return;                       // no WebGL2 -> leave the real letters alone

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("WarpText link:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // fullscreen triangle
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var U = {};
    ["uTextTexture","uResolution","uPointer","uPointerActive","uTime","uWarpStrength","uWarpScale",
     "uSpeed","uPointerInfluence","uPointerStrength","uRefraction","uRipple","uMotion"]
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    host.classList.add("is-warping");     // hides the plain letters, shows the canvas
    host.appendChild(canvas);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 1, H = 1;

    function rasterize() {
      var rect = host.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      var c = document.createElement("canvas");
      c.width = Math.max(1, Math.floor(rect.width * dpr));
      c.height = Math.max(1, Math.floor(rect.height * dpr));
      var ctx = c.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = opts.color;

      // fit the word to the box, mirroring the original's shrink-to-fit
      var fam = getComputedStyle(host).fontFamily || "sans-serif";
      var size = rect.height * 0.92;
      var tracking = opts.letterSpacing * size;
      var fit = function () {
        ctx.font = opts.fontWeight + " " + size + "px " + fam;
        var chars = Array.from(text);
        var w = chars.reduce(function (a, ch) { return a + ctx.measureText(ch).width; }, 0)
                + Math.max(0, chars.length - 1) * tracking;
        return w;
      };
      var width = fit();
      var max = rect.width * 0.92;
      if (width > max) { var k = max / width; size *= k; tracking *= k; width = fit(); }

      var cursor = rect.width / 2 - width / 2;
      Array.from(text).forEach(function (ch, i, arr) {
        var cw = ctx.measureText(ch).width;
        ctx.fillText(ch, cursor + cw / 2, rect.height / 2);
        cursor += cw + (i === arr.length - 1 ? 0 : tracking);
      });

      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    }

    function resize() {
      var rect = host.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      W = Math.floor(rect.width * dpr); H = Math.floor(rect.height * dpr);
      canvas.width = W; canvas.height = H;
      gl.viewport(0, 0, W, H);
      rasterize();
    }

    var ptr = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: 0, target: 0 };
    canvas.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = canvas.getBoundingClientRect();
      ptr.tx = (e.clientX - r.left) / r.width;
      ptr.ty = 1 - (e.clientY - r.top) / r.height;
      ptr.target = 1;
    });
    canvas.addEventListener("pointerleave", function () { ptr.target = 0; });

    var raf = 0, running = false, t0 = performance.now();
    function frame(now) {
      var e = (now - t0) * 0.001;
      var ix = 0.5 + Math.sin(e * 0.33) * 0.12, iy = 0.5 + Math.cos(e * 0.27) * 0.1;
      var tx = ptr.target > 0 ? ptr.tx : ix, ty = ptr.target > 0 ? ptr.ty : iy;
      var damp = ptr.target > 0 ? 0.12 : 0.035;
      ptr.x += (tx - ptr.x) * damp; ptr.y += (ty - ptr.y) * damp;
      ptr.active += ((ptr.target > 0 ? 1 : 0.18) - ptr.active) * 0.06;

      gl.useProgram(prog);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(U.uTextTexture, 0);
      gl.uniform2f(U.uResolution, W, H);
      gl.uniform2f(U.uPointer, ptr.x, ptr.y);
      gl.uniform1f(U.uPointerActive, ptr.active);
      gl.uniform1f(U.uTime, e);
      gl.uniform1f(U.uWarpStrength, opts.warpStrength);
      gl.uniform1f(U.uWarpScale, opts.warpScale);
      gl.uniform1f(U.uSpeed, opts.speed);
      gl.uniform1f(U.uPointerInfluence, opts.pointerInfluence);
      gl.uniform1f(U.uPointerStrength, opts.pointerStrength);
      gl.uniform1f(U.uRefraction, opts.refraction);
      gl.uniform1f(U.uRipple, opts.ripple ? 1 : 0);
      gl.uniform1f(U.uMotion, 1);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!running) { running = true; t0 = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop() { if (running) { running = false; cancelAnimationFrame(raf); raf = 0; } }

    if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
    // Only runs while actually on screen — this sits at the very bottom of a
    // long page, so otherwise it would burn a rAF loop for the entire visit.
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0 }).observe(host);
    } else { start(); }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
    });
    canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); stop(); });

    resize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rasterize);
  }

  function boot() { document.querySelectorAll("[data-warp-text-host]").forEach(init); }
  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
