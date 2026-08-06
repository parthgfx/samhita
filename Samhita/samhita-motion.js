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

      // Repeating card/item groups: fade + rise, staggered
      var groupSelectors = [
        ".layout-cards .levels-card",
        ".experience-cards .experience-card",
        ".instructors-benefits .instructors-benefit",
        ".room-list .room-accordion-wrap",
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

      // Standalone blocks: sliders, story card, stat groups, CTA content
      var soloSelectors = [
        ".slider-wrap",
        ".overview-story-card",
        ".overview-details",
        ".section-cta .cta-content",
        ".stay-media",
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
      }, 3000);

    } catch (err) {
      if (window.console) console.error("samhita-motion.js:", err);
    }
  });
})();
