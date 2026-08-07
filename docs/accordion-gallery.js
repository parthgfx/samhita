/*
  AccordionGallery — vanilla port of the React Bits component.

  Why a port rather than the original: this site is static HTML with no React,
  no bundler and no build step (see the other files in this folder). Dropping
  the JSX version in would have meant shipping React + ReactDOM to every
  visitor for one gallery. The behaviour, the props and the class names are all
  kept the same, so the CSS is the component's own, unmodified, and anyone who
  knows the React version will recognise this one.

  Two deliberate differences from the original:

  - Markup lives in the HTML, not in JS. The React version builds its panels
    from an `items` array; here the panels are written into index.html and this
    file only enhances them. That keeps the images in the page for crawlers and
    means the gallery still renders (as a plain row of photos) if this script
    fails to load — the same rule the rest of this site follows for the hero.
  - Props are read from `data-*` attributes on the root element, so a second
    gallery elsewhere on the site can be configured without touching this file.

  GSAP is already loaded by the page for the scroll animations, so this adds no
  new dependency.
*/
(function () {
  "use strict";

  if (!window.gsap) return;

  var num = function (el, name, fallback) {
    var v = parseFloat(el.getAttribute("data-" + name));
    return isNaN(v) ? fallback : v;
  };
  var str = function (el, name, fallback) {
    return el.getAttribute("data-" + name) || fallback;
  };
  var bool = function (el, name, fallback) {
    var v = el.getAttribute("data-" + name);
    return v === null ? fallback : v !== "false";
  };
  var clamp = function (v, lo, hi) {
    return Math.min(Math.max(v, lo), hi);
  };

  function init(root) {
    var panels = Array.prototype.slice.call(root.querySelectorAll(".ag-panel"));
    if (!panels.length) return;

    var count = panels.length;
    var opts = {
      defaultIndex: num(root, "default-index", 2),
      duration: num(root, "duration", 0.6),
      ease: str(root, "ease", "power3.out"),
      parallax: num(root, "parallax", 0.5),
      tilt: num(root, "tilt", 8),
      stagger: num(root, "stagger", 0.06),
      gap: num(root, "gap", 10),
      expandRatio: clamp(num(root, "expand-ratio", 0.52), 0.2, 0.9),
      trigger: str(root, "trigger", "hover"),
      showLabels: bool(root, "show-labels", true),
      grayscale: bool(root, "grayscale", true),
      vertical: str(root, "orientation", "horizontal") === "vertical"
    };

    var reduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var medias = panels.map(function (p) { return p.querySelector(".ag-panel__media"); });
    var bars = panels.map(function (p) { return p.querySelector(".ag-panel__bar"); });
    var texts = panels.map(function (p) { return p.querySelector(".ag-panel__text"); });

    var active = clamp(opts.defaultIndex, 0, count - 1);
    var mediaSize = 320;
    var tl = null;
    var firstRun = true;

    function applyLayout(animate) {
      // grow is what makes the open panel occupy `expandRatio` of the row:
      // with (count-1) panels at flex-grow 1, giving the open one this value
      // divides the free space in exactly that proportion.
      var grow = count > 1 ? (opts.expandRatio * (count - 1)) / (1 - opts.expandRatio) : 1;
      var dur = animate && !reduced ? opts.duration : 0;

      if (tl) tl.kill();
      tl = window.gsap.timeline();

      panels.forEach(function (panel, i) {
        var isActive = i === active;
        var rot = isActive ? 0 : i < active ? opts.tilt : -opts.tilt;
        var props = { flexGrow: isActive ? grow : 1, duration: dur, ease: opts.ease };
        props[opts.vertical ? "rotateX" : "rotateY"] = opts.vertical ? -rot : rot;
        tl.to(panel, props, 0);

        panel.classList.toggle("ag-panel--active", isActive);
        if (isActive) panel.setAttribute("aria-current", "true");
        else panel.removeAttribute("aria-current");

        var media = medias[i];
        if (media) {
          var drift = clamp(active - i, -1.5, 1.5);
          var shift = drift * opts.parallax * mediaSize * 0.06;
          tl.to(media, {
            xPercent: -50,
            yPercent: -50,
            x: opts.vertical ? 0 : isActive ? 0 : shift,
            y: opts.vertical ? (isActive ? 0 : shift) : 0,
            "--ag-gray": opts.grayscale ? (isActive ? 0 : 1) : 0,
            "--ag-dim": isActive ? 0 : 0.35,
            duration: dur,
            ease: opts.ease
          }, 0);
        }

        if (opts.showLabels && bars[i] && texts[i]) {
          if (isActive) {
            // Held back until the panel is most of the way open. The original
            // starts the caption at 0, so on a long label ("Market Linkages"
            // needs 159px against a 158px box in a collapsed panel) the text
            // faded in while the panel was still narrow and was visibly
            // clipped for the first part of every transition. Starting at 35%
            // of the duration means the width is there before the words are.
            tl.to([bars[i], texts[i]], {
              opacity: 1, x: 0, duration: dur * 0.65, ease: opts.ease,
              stagger: reduced ? 0 : opts.stagger
            }, dur * 0.35);
          } else {
            tl.to([bars[i], texts[i]], {
              opacity: 0, x: -14, duration: dur * 0.6, ease: opts.ease
            }, 0);
          }
        }
      });
    }

    function measure() {
      var rect = root.getBoundingClientRect();
      var total = opts.vertical ? rect.height : rect.width;
      var usable = Math.max(total - opts.gap * (count - 1), 120);
      mediaSize = Math.max(140, usable * opts.expandRatio * 1.22);
      root.style.setProperty("--ag-media-size", mediaSize + "px");
      applyLayout(!firstRun);
      firstRun = false;
    }

    function setActive(i) {
      if (i === active) return;
      active = i;
      applyLayout(true);
    }

    panels.forEach(function (panel, i) {
      panel.addEventListener("mouseenter", function () {
        if (opts.trigger === "hover") setActive(i);
      });
      panel.addEventListener("focus", function () { setActive(i); });
      panel.addEventListener("click", function (e) {
        // A collapsed panel's first tap opens it rather than following its
        // link - on touch there is no hover, so this is the only way in.
        if (i !== active) { e.preventDefault(); setActive(i); }
      });
      panel.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          panels[(i + 1) % count].focus();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          panels[(i - 1 + count) % count].focus();
        }
      });
    });

    measure();
    if (window.ResizeObserver) new ResizeObserver(measure).observe(root);
  }

  function boot() {
    document.querySelectorAll(".accordion-gallery").forEach(init);
  }

  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
