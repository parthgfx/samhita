/*
  Samhita adaptation: scroll-reveal micro-interactions.

  The original Waveyu page's heading/card/image reveal animations were
  driven by Webflow's compiled Interactions 2 (IX2) config, bound to this
  specific page's original element IDs (data-w-id). That config lives
  inside webflow.85a1c9ed....js and can't be retargeted at new content —
  it was silently inert once this page's markup changed (see HANDOVER.md).

  This file re-implements the same *kind* of interaction (fade + rise in on
  scroll) generically, driven by class name rather than per-element IDs, so
  it survives future content edits. It uses GSAP + ScrollTrigger, which the
  original template already ships (Waveyu - Webflow HTML website
  template_files/gsap.min.js, ScrollTrigger.min.js) but which the adapted
  page wasn't loading.

  Safety: every animation below is a `gsap.from()`. The "from" (hidden)
  state is only ever applied by this script at runtime, once GSAP has
  already loaded and run — never via static CSS or an HTML attribute. If
  this script fails to load, throws, or GSAP/ScrollTrigger aren't present,
  nothing is hidden: the page just falls back to showing all content
  normally, exactly as if this file didn't exist.
*/
(function () {
  "use strict";

  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    try {
      gsap.registerPlugin(ScrollTrigger);

      var EASE = "power2.out";

      // Headline lines/words (pre-split into spans/divs in the markup itself).
      // Deliberately excludes anything inside .hero-content / .hero-stats —
      // see note below on why the hero never gets a JS-driven entrance.
      gsap.utils.toArray(".gsap_split_line, .gsap_split_word").forEach(function (el) {
        if (el.closest(".hero-content, .hero-stats")) return;
        gsap.from(el, {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: EASE,
          scrollTrigger: { trigger: el, start: "top 92%", once: true }
        });
      });

      // Staggered check-mark "pop" on tag lists (the CSR/FCRA banner and
      // the "Our Story" ladder-rung tags) - a small scale-up-from-zero with
      // overshoot, staggered a beat apart per icon, layered on top of the
      // .tag-item fade+rise the group already gets below (this only
      // targets the check-icon itself, not its whole tag-item row).
      var tagLists = gsap.utils.toArray(".tag-list");
      tagLists.forEach(function (list) {
        var icons = list.querySelectorAll(".check-icon");
        if (!icons.length) return;
        gsap.from(icons, {
          scale: 0,
          opacity: 0,
          duration: 0.5,
          ease: "back.out(2.5)",
          stagger: 0.12,
          scrollTrigger: { trigger: list, start: "top 90%", once: true }
        });
      });

      // The hero deliberately gets NO JS-driven entrance animation. It's the
      // first thing anyone sees, with zero scroll required, so it must never
      // depend on a ticker tick to become visible — testing here found this
      // environment's requestAnimationFrame is heavily throttled (a tool
      // quirk, see HANDOVER.md), which left the hero text invisible for a
      // very long stretch under a gsap.from() entrance. The hero shows at
      // full opacity immediately from plain HTML/CSS; only content the user
      // has to scroll to reach (below, where there's always been real time
      // for JS to run) gets the scroll-triggered reveal treatment.

      // Small inline chips keep the original one-shot staggered entrance -
      // they're too small for a scrubbed fade to read as anything but flicker.
      var groupSelectors = [
        ".tag-list .tag-item"
      ];
      groupSelectors.forEach(function (sel) {
        var items = gsap.utils.toArray(sel);
        if (!items.length) return;
        gsap.from(items, {
          opacity: 0,
          y: 28,
          duration: 0.6,
          ease: EASE,
          stagger: 0.1,
          scrollTrigger: { trigger: items[0], start: "top 88%", once: true }
        });
      });

      // Footer blocks: one-shot entrance. Deliberately NOT scrubbed - the
      // footer is the last thing on the page, so it can never scroll up and
      // out again, and a scrubbed exit it can never reach would just mean it
      // sits permanently mid-fade.
      var soloSelectors = [
        ".footer-header",
        ".footer-nav-wrap"
      ];
      soloSelectors.forEach(function (sel) {
        gsap.utils.toArray(sel).forEach(function (el) {
          gsap.from(el, {
            opacity: 0,
            y: 24,
            duration: 0.7,
            ease: EASE,
            scrollTrigger: { trigger: el, start: "top 88%", once: true }
          });
        });
      });

      // ── Scroll-linked (scrubbed) entry AND exit for every tile/box ──
      // Instead of firing once at a threshold, each tile's opacity/position
      // is tied directly to how far it has travelled through the viewport:
      // it fades and rises in as it comes up from the bottom, sits fully
      // visible through the middle, then fades and drifts out as it leaves
      // through the top. Scrolling back up replays it exactly in reverse,
      // because nothing here is a one-shot trigger.
      //
      // One timeline per element, not two triggers - two separate triggers
      // both writing opacity/y to the same element fight each other wherever
      // their ranges overlap. The single timeline spans the element's whole
      // traversal (top-hits-viewport-bottom -> bottom-hits-viewport-top) and
      // splits it into fade-in / hold / fade-out phases, so the states can
      // never contradict.
      //
      // scrub:0.6 rather than `true` adds a little catch-up easing, which
      // keeps fast trackpad flicks from looking jittery.
      var SCRUB_SELECTORS = [
        ".stats-bar-item",
        ".trust-bar-item",
        ".overview-details",
        ".slider-wrap",
        ".overview-story-card",
        ".layout-cards .levels-card",
        ".room-list .room-accordion-wrap",
        ".stay-media",
        ".experience-cards .experience-card",
        ".instructors-benefits .instructors-benefit",
        ".partner-banner",
        ".awards-marquee",
        ".section-cta .cta-content"
      ];

      var scrubEls = [];
      SCRUB_SELECTORS.forEach(function (sel) {
        gsap.utils.toArray(sel).forEach(function (el) {
          // Never the hero (see the note above), and never twice.
          if (el.closest(".hero-content, .hero-stats")) return;
          if (scrubEls.indexOf(el) === -1) scrubEls.push(el);
        });
      });

      // Each tile swings in from whichever side of the page it actually sits
      // on - left-hand tiles arrive from the left, right-hand ones from the
      // right - rotating flat as they land and receding back out as they
      // leave. Direction comes from the element's own horizontal position, so
      // a 3-up grid, a 4-up grid and a full-width row all organise themselves
      // without any per-section configuration.
      //
      // Full-width blocks (accordion rows, banners) sit dead centre, so their
      // offset is meaningless - those alternate side by index instead, which
      // gives a left/right zig-zag down the column.
      //
      // The perspective is applied per-element via GSAP's transformPerspective
      // rather than as CSS `perspective` on a parent. That is deliberate: CSS
      // perspective on an ancestor turns it into the containing block for its
      // absolutely-positioned descendants, which is exactly the bug that once
      // knocked the hero photo out of full-bleed (see samhita-theme.css's note
      // on .section-hero). Keeping perspective on the element itself has no
      // such side effect on anything around it.
      var SWING_X = 90;      // px the tile starts/ends off to its own side
      var SWING_ROTY = 14;   // deg of Y-rotation, i.e. how "hinged" it looks
      var SWING_Z = 160;     // px it starts/ends pushed back into the screen
      var SWING_PERSPECTIVE = 900;

      scrubEls.forEach(function (el, i) {
        var rect = el.getBoundingClientRect();
        var offset = rect.left + rect.width / 2 - window.innerWidth / 2;
        // > 8% of the viewport off-centre counts as "genuinely on that side"
        var dir = Math.abs(offset) > window.innerWidth * 0.08
          ? (offset > 0 ? 1 : -1)
          : (i % 2 === 0 ? -1 : 1);

        // Never swing a tile past the edge of the viewport. Tiles that sit
        // near an edge (the outer stats figures, and any full-width row) have
        // very little lateral room, and pushing them the full SWING_X shoved
        // them off-screen: with html{overflow-x:hidden} that reads as the tile
        // being clipped rather than as deliberate motion, and it left the
        // document horizontally scrollable by ~80px. Clamping to the room the
        // tile actually has keeps the travel on-screen; those tiles still get
        // the full rotation, depth and fade, so the 3D entrance still reads.
        var room = dir < 0 ? rect.left : window.innerWidth - rect.right;
        var swingX = Math.max(0, Math.min(SWING_X, room));

        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6
            }
          })
          // Entering: swings in from its own side, angled and set back.
          .fromTo(
            el,
            {
              opacity: 0,
              x: dir * swingX,
              y: 24,
              z: -SWING_Z,
              rotateY: dir * SWING_ROTY,
              transformPerspective: SWING_PERSPECTIVE,
              transformOrigin: "center center"
            },
            { opacity: 1, x: 0, y: 0, z: 0, rotateY: 0, duration: 0.3 }
          )
          // Held flat and square on while it crosses the middle of the screen.
          .to(el, { opacity: 1, x: 0, y: 0, z: 0, rotateY: 0, duration: 0.42 })
          // Leaving: rotates away and recedes back toward the same side.
          .to(
            el,
            {
              opacity: 0,
              x: dir * (swingX * 0.65),
              y: -24,
              z: -SWING_Z * 0.75,
              rotateY: dir * (SWING_ROTY * 0.8),
              duration: 0.28
            }
          );
      });
      // Failsafe: if any animated element is still invisible after 3 seconds
      // (e.g. ScrollTrigger miscalculated positions, rAF was throttled, or a
      // race condition left gsap.from()'s initial inline styles stranded),
      // force every targeted element back to full visibility. Better to skip
      // the entrance animation than to leave real content permanently hidden.
      // Also covers the check-mark pop-in the same way, for the same reason.
      setTimeout(function () {
        var allAnimated = gsap.utils.toArray(
          groupSelectors.join(", ") + ", " + soloSelectors.join(", ") +
          ", .gsap_split_line, .gsap_split_word, .tag-list .check-icon"
        );
        allAnimated.forEach(function (el) {
          if (el.closest(".hero-content, .hero-stats")) return;
          var s = el.style;
          if (s.opacity === "0" || parseFloat(getComputedStyle(el).opacity) < 0.1) {
            gsap.set(el, { clearProps: "all" });
          }
        });

        // The scrubbed tiles above need a different test: for them opacity 0
        // is a legitimate state (they really are meant to be invisible while
        // off-screen), so "invisible" alone can't mean "broken". What the
        // timeline does guarantee is that anything sitting in the middle band
        // of the viewport is inside its `hold` phase and therefore fully
        // opaque - so an element that is centred on screen and still
        // transparent is the one case that can only be a failure.
        var bandTop = window.innerHeight * 0.25;
        var bandBottom = window.innerHeight * 0.75;
        scrubEls.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var centre = r.top + r.height / 2;
          var inBand = centre > bandTop && centre < bandBottom;
          if (inBand && parseFloat(getComputedStyle(el).opacity) < 0.1) {
            gsap.set(el, { clearProps: "all" });
          }
        });
      }, 3000);

    } catch (err) {
      if (window.console) console.error("samhita-motion.js:", err);
    }
  });
})();
