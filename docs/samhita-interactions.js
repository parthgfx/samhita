/*
  Samhita adaptation: small vanilla-JS enhancements.

  Why this file exists: the original Waveyu page's accordion open/close and
  "open popup" behavior were wired through Webflow's compiled Interactions 2
  (IX2) engine, bound to this exact page's element IDs (data-w-id
  attributes). Those IDs were intentionally stripped when this page's
  content was adapted (see HANDOVER.md), so the IX2 bindings would not
  reconnect to the new elements.
  This script replaces those ID-bound behaviors: room-style accordions and
  the "open contact popup" buttons. (An earlier version also drove a
  transparent-over-hero -> solid-on-scroll navbar color transition; the
  navbar is now permanently solid by request, so that scroll listener was
  removed — see samhita-theme.css.) Scroll-reveal entrance animations
  (fade/rise-in on headings and cards) are handled separately in
  samhita-motion.js, since those need GSAP/ScrollTrigger.

  IMPORTANT correction to an earlier assumption in this file: it used to
  claim the *generic*, class-driven Webflow behaviors (.w-nav mobile menu,
  .w-dropdown hover menus, .w-slider carousels) "still work untouched via
  the original webflow.js bundle." That was never actually verified against
  real interaction and turned out to be wrong - webflow.85a1c9ed....js in
  this exported project is only a small ~5KB loader stub that lazy-fetches
  its real interaction code as separate "achunk" files at runtime, and none
  of those achunk files exist in this project's file tree. Every one of
  those fetches 404s (confirmed via the browser's network tab), so .w-nav/
  .w-dropdown/.w-slider's real click/hover behavior silently never runs -
  see HANDOVER.md "Navbar dropdown + mobile menu were non-functional" for
  the full writeup. This file now also replaces the navbar dropdown
  (About/Impact), the mobile hamburger menu, and (below) the .w-slider
  carousels (the "Our Story" ladder slider, the partners slider) - same
  root cause, same fix pattern, see HANDOVER.md "Fixed bug: slider
  carousels were non-functional" for that writeup specifically.
  Also handles the hero stat count-up (0 -> 654,568): kept here rather
  than in samhita-motion.js since it's plain rAF with no GSAP dependency,
  and unlike the motion.js hero exclusion, this one is safe to be
  JS-driven because the static HTML already contains the correct final
  number - JS only ever overwrites it progressively, so a JS failure just
  means the number never counts up, never that it's missing or wrong.
*/
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    // --- Page loader (real image-load percentage) ---
    // See HANDOVER.md "Page loader" for the full brief and the site-wide
    // pattern to carry onto every future page. Percentage is real, not
    // simulated: every <img> on the page, plus any element carrying a
    // data-bg-src attribute (for CSS background-image photos that aren't
    // <img> tags, like the hero - see samhita-home.html), counts as one
    // unit; the bar/percentage advance as each one settles (loads OR
    // errors - a broken image still counts as "settled" so it can never
    // block the counter forever). A hard timeout is the final safety net:
    // no visitor should ever be stuck looking at the loader indefinitely,
    // regardless of what a slow/failed asset does.
    // Deliberately does NOT lock body scroll while showing (an earlier
    // version did) - the loader already visually covers the entire page at
    // the highest z-index on the page, so a scroll lock added no real
    // benefit, only risk: if the settle-counting ever stalled for any
    // visitor (slow connection, an image that never fires load/error),
    // scroll would stay blocked until the 8s safety timeout. Not locking it
    // removes that failure mode entirely, at no visible cost.
    var pageLoader = document.getElementById("page-loader");
    if (pageLoader) {
      var loaderBarFill = document.getElementById("page-loader-bar-fill");
      var loaderPercentText = document.getElementById("page-loader-percent");
      var loaderHidden = false;

      function hidePageLoader() {
        if (loaderHidden) return;
        loaderHidden = true;
        setTimeout(function () {
          pageLoader.classList.add("is-loaded");
          setTimeout(function () {
            pageLoader.style.display = "none";
          }, 450);
        }, 200);
      }

      var bgAssets = Array.prototype.slice
        .call(document.querySelectorAll("[data-bg-src]"))
        .map(function (el) {
          return el.getAttribute("data-bg-src");
        });
      // Exclude loading="lazy" images: the browser doesn't fetch them until
      // they scroll near the viewport, so they never fire load/error while the
      // page sits at the top - counting them parked the bar at (total - lazy)
      // (~93%) until the 8s safety net. They're below the fold by design, so
      // the loader has no business waiting on them.
      var imgAssets = Array.prototype.slice
        .call(document.images)
        .filter(function (img) {
          return (img.getAttribute("loading") || "").toLowerCase() !== "lazy";
        });
      var total = imgAssets.length + bgAssets.length;

      if (total === 0) {
        hidePageLoader();
      } else {
        var settled = 0;

        function updateLoaderProgress() {
          settled = Math.min(settled + 1, total);
          var pct = Math.round((settled / total) * 100);
          if (loaderBarFill) loaderBarFill.style.width = pct + "%";
          if (loaderPercentText) loaderPercentText.textContent = pct + "%";
          if (settled >= total) hidePageLoader();
        }

        imgAssets.forEach(function (img) {
          if (img.complete) {
            updateLoaderProgress();
          } else {
            img.addEventListener("load", updateLoaderProgress);
            img.addEventListener("error", updateLoaderProgress);
          }
        });

        bgAssets.forEach(function (src) {
          var preload = new Image();
          preload.addEventListener("load", updateLoaderProgress);
          preload.addEventListener("error", updateLoaderProgress);
          preload.src = src;
        });

        // Safety net: force-hide after 8s no matter what's still pending.
        setTimeout(hidePageLoader, 8000);
      }
    }

    // --- Accordion toggle (Who We Work With) ---
    var headers = document.querySelectorAll(".room-accordion-header");
    headers.forEach(function (header) {
      header.addEventListener("click", function () {
        var wrap = header.closest(".room-accordion");
        if (!wrap) return;
        var body = wrap.querySelector(".room-accordion-body");
        var chevron = wrap.querySelector(".chevron-button");
        var isOpen = body.classList.contains("is-active");

        // Close every other accordion item in the same list
        var list = header.closest(".room-list");
        if (list) {
          list.querySelectorAll(".room-accordion-body.is-active").forEach(function (openBody) {
            if (openBody !== body) openBody.classList.remove("is-active");
          });
          list.querySelectorAll(".chevron-button.is-active").forEach(function (openChevron) {
            if (openChevron !== chevron) openChevron.classList.remove("is-active");
          });
        }

        body.classList.toggle("is-active", !isOpen);
        if (chevron) chevron.classList.toggle("is-active", !isOpen);

        // Sweep the accent fill-line in under the opened item's content
        var fill = wrap.querySelector(".line-fill-color");
        if (fill) fill.style.transform = isOpen ? "scaleX(0)" : "scaleX(1)";
      });
    });

    // --- Slider carousels (Our Story ladder slider, partners slider, the
    // "Who We Work With" room-media sliders) ---
    // Same root cause as the navbar dropdown/mobile menu above (see this
    // file's top comment) - the arrow clicks and pagination dots were
    // silent no-ops. Each .w-slide already sits full-width, inline-block,
    // side by side in a row inside its .w-slider-mask (white-space:nowrap,
    // overflow:hidden - standard Webflow slider markup, untouched here).
    //
    // IMPORTANT correction to an earlier version of this fix: it
    // transformed the .w-slider-mask element itself to advance slides.
    // That was a real, confirmed bug - .w-slider-mask is the fixed-size
    // *viewport* (its own overflow:hidden is what's supposed to clip the
    // oversized row of slides down to one slide's width). A CSS transform
    // moves an element as a rigid unit *relative to its own ancestors* -
    // it does not shift that element's children relative to the element
    // itself. So translating the mask didn't reveal slide 2 by shifting
    // the row within a fixed window; it moved the entire window (mask +
    // whatever was already painted inside it) sideways, straight out from
    // under the outer .slider's own separate overflow:hidden clip - which
    // then clipped the *whole mask* away, rendering nothing. Confirmed via
    // `document.elementsFromPoint()` at the slider's own center: the mask
    // and its slide/image children were completely absent from the hit-
    // test stack once any slide past the first was selected, despite each
    // image's own computed style being entirely correct (opacity:1, real
    // decoded pixel dimensions, plausible-looking coordinates) - the images
    // were loading and positioned fine, just rendered entirely outside
    // every visible clipping box on the page.
    //
    // Fixed by inserting a "track" wrapper *inside* the mask, moving the
    // .w-slide elements into it, and transforming the track instead. The
    // mask keeps its own fixed position and overflow:hidden (the real,
    // never-moving viewport); the track is what's allowed to overflow to
    // slide-count x 100% width and slide left/right within that fixed
    // window - the standard structure this kind of transform-based slider
    // actually needs.
    document.querySelectorAll(".slider.w-slider").forEach(function (slider) {
      var mask = slider.querySelector(".w-slider-mask");
      var slides = slider.querySelectorAll(".w-slide");
      var leftArrow = slider.querySelector(".w-slider-arrow-left");
      var rightArrow = slider.querySelector(".w-slider-arrow-right");
      var dots = slider.querySelectorAll(".w-slider-dot");
      var ariaLabel = slider.querySelector(".w-slider-aria-label");
      if (!mask || slides.length < 2) return;

      var track = document.createElement("div");
      track.className = "slider-track";
      slides.forEach(function (slide) {
        track.appendChild(slide);
      });
      mask.insertBefore(track, mask.firstChild);

      var current = 0;
      var reduceMotionSlider =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.style.transition = reduceMotionSlider
        ? "none"
        : "transform 0.5s cubic-bezier(0.65, 0, 0.35, 1)";

      function goToSlide(index) {
        current = ((index % slides.length) + slides.length) % slides.length;
        track.style.transform = "translateX(-" + current * 100 + "%)";
        dots.forEach(function (dot, i) {
          dot.classList.toggle("w-active", i === current);
        });
        if (ariaLabel) {
          ariaLabel.textContent = "Slide " + (current + 1) + " of " + slides.length + ".";
        }
      }

      if (leftArrow) {
        leftArrow.addEventListener("click", function () {
          goToSlide(current - 1);
        });
      }
      if (rightArrow) {
        rightArrow.addEventListener("click", function () {
          goToSlide(current + 1);
        });
      }
      dots.forEach(function (dot, i) {
        dot.addEventListener("click", function () {
          goToSlide(i);
        });
      });

      goToSlide(0);

      // Auto-slide (the "Our Story" ladder-story slider only, per request) -
      // pauses on hover/focus so a reader lingering on a slide isn't
      // interrupted mid-read, and resumes from wherever it left off once
      // they move away. Skipped entirely under prefers-reduced-motion,
      // same as every other timed animation in this file.
      if (slider.classList.contains("is-overview") && !reduceMotionSlider) {
        var AUTO_SLIDE_INTERVAL = 5000;
        var autoSlideTimer = null;

        function startAutoSlide() {
          stopAutoSlide();
          autoSlideTimer = setInterval(function () {
            goToSlide(current + 1);
          }, AUTO_SLIDE_INTERVAL);
        }
        function stopAutoSlide() {
          if (autoSlideTimer) {
            clearInterval(autoSlideTimer);
            autoSlideTimer = null;
          }
        }

        startAutoSlide();
        slider.addEventListener("mouseenter", stopAutoSlide);
        slider.addEventListener("mouseleave", startAutoSlide);
        slider.addEventListener("focusin", stopAutoSlide);
        slider.addEventListener("focusout", startAutoSlide);
      }
    });

    // --- Popup open/close (Connect / inquiry form) ---
    // Includes a focus trap (Tab/Shift+Tab cycle within the popup while
    // open, never escaping to the page behind it) and focus restoration
    // (closing returns focus to whichever "Connect Now" trigger opened it) -
    // both standard expectations for an ARIA dialog, and previously missing.
    var popup = document.getElementById("popup-form");
    var lastTrigger = null;

    function getFocusableElements() {
      if (!popup) return [];
      return Array.prototype.slice
        .call(
          popup.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        )
        .filter(function (el) {
          return el.offsetParent !== null;
        });
    }

    function trapFocus(e) {
      if (e.key !== "Tab" || !popup || popup.style.display === "none") return;
      var focusable = getFocusableElements();
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function openPopup(trigger) {
      if (!popup) return;
      lastTrigger = trigger || document.activeElement;
      popup.style.display = "flex";
      requestAnimationFrame(function () {
        popup.style.opacity = "1";
      });
      document.body.style.overflow = "hidden";
      var focusable = getFocusableElements();
      if (focusable.length) focusable[0].focus();
    }

    function closePopup() {
      if (!popup) return;
      popup.style.opacity = "0";
      document.body.style.overflow = "";
      setTimeout(function () {
        popup.style.display = "none";
      }, 200);
      if (lastTrigger && typeof lastTrigger.focus === "function") {
        lastTrigger.focus();
      }
      lastTrigger = null;
    }

    document.querySelectorAll("[data-open-popup]").forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        openPopup(trigger);
      });
    });

    if (popup) {
      popup.querySelectorAll(".close-button").forEach(function (btn) {
        btn.addEventListener("click", closePopup);
      });
      popup.addEventListener("click", function (e) {
        if (e.target === popup) closePopup();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePopup();
      trapFocus(e);
    });

    // --- Navbar dropdowns (About / Impact) ---
    // These were completely non-functional: the compiled webflow.js in this
    // exported project is only a small loader stub whose actual interaction
    // code ("achunk" files it fetches at runtime) was never included in the
    // export, so every one of its network requests 404s and .w-dropdown's
    // real click-to-open behavior never runs (confirmed via the browser's
    // network tab - see HANDOVER.md "Navbar dropdown + mobile menu were
    // non-functional" for the full writeup). Reimplemented in plain JS here,
    // same exclusive-open/close-on-outside-click/Escape pattern as the
    // accordion above.
    var navDropdowns = document.querySelectorAll(".navbar-dropdown");
    function closeAllNavDropdowns(except) {
      navDropdowns.forEach(function (dd) {
        if (dd === except) return;
        var list = dd.querySelector(".navbar-dropdown-list");
        var toggle = dd.querySelector(".navbar-dropdown-toggle");
        if (list) list.classList.remove("w--open");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      });
    }
    navDropdowns.forEach(function (dd) {
      var toggle = dd.querySelector(".navbar-dropdown-toggle");
      var list = dd.querySelector(".navbar-dropdown-list");
      if (!toggle || !list) return;
      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        var isOpen = list.classList.contains("w--open");
        closeAllNavDropdowns(dd);
        list.classList.toggle("w--open", !isOpen);
        toggle.setAttribute("aria-expanded", String(!isOpen));
      });
      list.querySelectorAll(".navbar-dropdown-link").forEach(function (link) {
        link.addEventListener("click", function () {
          closeAllNavDropdowns();
        });
      });

      // Open on hover as well as click, but only on the horizontal desktop
      // bar. Below 1200px the navbar is the collapsed burger panel, where the
      // menus are stacked and a pointer crossing one on its way to another
      // would flap them open and shut; and on touch there is no hover at all,
      // so the click handler above stays the only way in. Listening on the
      // whole .navbar-dropdown (not the toggle) means moving down from the
      // label into the panel does not count as leaving.
      var canHover = window.matchMedia(
        "(min-width: 1200px) and (hover: hover) and (pointer: fine)"
      );
      var closeTimer = null;
      dd.addEventListener("mouseenter", function () {
        if (!canHover.matches) return;
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
        closeAllNavDropdowns(dd);
        list.classList.add("w--open");
        toggle.setAttribute("aria-expanded", "true");
      });
      dd.addEventListener("mouseleave", function () {
        if (!canHover.matches) return;
        // Small grace period so a pointer clipping the gap between the label
        // and the panel below it does not snap the menu shut mid-move.
        closeTimer = setTimeout(function () {
          list.classList.remove("w--open");
          toggle.setAttribute("aria-expanded", "false");
        }, 120);
      });
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".navbar-dropdown")) closeAllNavDropdowns();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAllNavDropdowns();
    });

    // --- Mobile menu (hamburger) ---
    // Same root cause as the dropdowns above: the burger button's real
    // open/close behavior lives in the same missing webflow.js chunk, so it
    // was a silent no-op - on any viewport narrow enough to collapse the
    // navbar, there was previously no way at all to reach About/Impact/
    // Careers/Connect Now. Reimplemented here: toggles a "w--open" class the
    // CSS uses to reveal the panel (see samhita-theme.css), animates the
    // burger icon into an X, locks body scroll while open (a real full-
    // screen overlay panel, unlike the page loader - see HANDOVER.md "Page
    // loader" for why a scroll lock was wrong there but is the expected,
    // reversible behavior here), and closes on: clicking any link inside,
    // Escape, or clicking the burger again.
    var burgerButton = document.querySelector(".burger-button");
    var mobileMenu = document.querySelector(".navbar-menu-wrap");
    if (burgerButton && mobileMenu) {
      function closeMobileMenu() {
        burgerButton.classList.remove("w--open");
        mobileMenu.classList.remove("w--open");
        burgerButton.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
      function openMobileMenu() {
        closeAllNavDropdowns();
        burgerButton.classList.add("w--open");
        mobileMenu.classList.add("w--open");
        burgerButton.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
      }
      burgerButton.addEventListener("click", function () {
        if (mobileMenu.classList.contains("w--open")) {
          closeMobileMenu();
        } else {
          openMobileMenu();
        }
      });
      mobileMenu
        .querySelectorAll(".navbar-link, .navbar-dropdown-link, .primary-button")
        .forEach(function (link) {
          link.addEventListener("click", closeMobileMenu);
        });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeMobileMenu();
      });
    }

    // --- Stat count-up animations (hero + "Our Story" + partner stats) ---
    // Originally just the hero's own counter (class was ".hero-counter");
    // renamed to the generic ".count-up" and reused across every other
    // numeric stat on the page (Lives Impacted, CSR Clients/Foundations/
    // Partners/Donors, Impact Partners, Government Partnerships, the
    // 654,568-citizens and 90%-job-placement partner stats) - same
    // data-count-to/data-count-suffix attributes, same behavior, just no
    // longer hero-specific. Re-triggers every time a stat re-enters the
    // viewport (reset to 0 on exit), not just once, since the hero is
    // visible immediately on load and the original ask was for the
    // count-up to replay "every time it is displayed on the screen" - kept
    // that same behavior for the newly-added counters too, for consistency
    // rather than having some stats replay on every scroll and others not.
    var counters = document.querySelectorAll(".count-up");
    if (counters.length && "IntersectionObserver" in window) {
      var COUNT_DURATION = 1000;
      var reduceMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      function animateCounter(el) {
        var target = parseInt(el.getAttribute("data-count-to"), 10);
        var suffix = el.getAttribute("data-count-suffix") || "";
        if (isNaN(target)) return;
        if (reduceMotion) {
          el.textContent = target.toLocaleString("en-US") + suffix;
          return;
        }
        var start = null;
        function tick(timestamp) {
          if (start === null) start = timestamp;
          var progress = Math.min((timestamp - start) / COUNT_DURATION, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent =
            Math.round(target * eased).toLocaleString("en-US") + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }

      var counterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
            } else {
              entry.target.textContent = "0" + (entry.target.getAttribute("data-count-suffix") || "");
            }
          });
        },
        { threshold: 0.4 }
      );

      counters.forEach(function (el) {
        counterObserver.observe(el);
      });
    }

    // --- Back-to-top button ---
    // Visible as soon as the hero (first fold, .section-hero) scrolls out of
    // the viewport; hidden again if the user scrolls back up into it. See
    // HANDOVER.md "Back-to-top button" - this same button/CSS/JS trio is
    // meant to be added to every future page built from this template, each
    // one watching that page's own first-fold section.
    var backToTop = document.getElementById("back-to-top");
    var hero = document.querySelector(".section-hero");
    if (backToTop && hero && "IntersectionObserver" in window) {
      var heroObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            backToTop.classList.toggle("is-visible", !entry.isIntersecting);
          });
        },
        { threshold: 0 }
      );
      heroObserver.observe(hero);

      backToTop.addEventListener("click", function () {
        var reduceMotion =
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      });
    }

    // --- Testimonials ticker (auto-scroll + working prev/next arrows) ---
    // The track holds two copies of the cards; the container scrolls slowly and
    // wraps at the halfway point for a seamless loop. The arrows scroll it a
    // card at a time; hovering pauses the drift. Driven by scrollLeft (not a CSS
    // transform) so the arrows and the auto-drift share one mechanism.
    var tMarquee = document.querySelector("[data-testimonial-marquee]");
    if (tMarquee) {
      var tTrack = tMarquee.querySelector(".testimonial-marquee-track");
      var tPrev = document.querySelector("[data-testimonial-prev]");
      var tNext = document.querySelector("[data-testimonial-next]");
      var tReduce =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var tPaused = false;

      var tHalf = function () { return tTrack.scrollWidth / 2; };
      var tStep = function () {
        var card = tTrack.querySelector(".testimonial-card");
        var styles = getComputedStyle(tTrack);
        var gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
        return card ? card.getBoundingClientRect().width + gap : 320;
      };
      // Keep scrollLeft within the first copy; the reset lands on the identical
      // card in the other copy, so it's visually seamless.
      var tWrap = function () {
        var h = tHalf();
        if (h <= 0) return;
        if (tMarquee.scrollLeft >= h) tMarquee.scrollLeft -= h;
        else if (tMarquee.scrollLeft < 0) tMarquee.scrollLeft += h;
      };

      if (tPrev) tPrev.addEventListener("click", function () {
        tMarquee.scrollBy({ left: -tStep(), behavior: "smooth" });
      });
      if (tNext) tNext.addEventListener("click", function () {
        tMarquee.scrollBy({ left: tStep(), behavior: "smooth" });
      });
      tMarquee.addEventListener("mouseenter", function () { tPaused = true; });
      tMarquee.addEventListener("mouseleave", function () { tPaused = false; });
      tMarquee.addEventListener("focusin", function () { tPaused = true; });
      tMarquee.addEventListener("focusout", function () { tPaused = false; });

      if (!tReduce) {
        var tAuto = function () {
          if (!tPaused) {
            tMarquee.scrollLeft += 0.4; // slow drift
            tWrap();
          }
          requestAnimationFrame(tAuto);
        };
        requestAnimationFrame(tAuto);
      }
    }

    // --- Partner logo strips: guarantee a seamless (endless) loop ---
    // The CSS animates each .partner-marquee-track by -50%, which only reads as
    // an endless circular strip when the track is at least as wide as its frame
    // (otherwise a short strip - e.g. two logos - scrolls off and leaves an
    // empty gap before it restarts). The markup already ships two copies of each
    // set; here we clone those current children (always an even number of sets,
    // so the -50% boundary stays identical) until the track is >= 2x its frame,
    // so there is never a visible start or end point regardless of logo count.
    document.querySelectorAll(".partner-marquee").forEach(function (marq) {
      var track = marq.querySelector(".partner-marquee-track");
      if (!track) return;
      var originals = Array.prototype.slice.call(track.children);
      if (!originals.length) return;
      var guard = 0;
      while (track.scrollWidth < marq.clientWidth * 2 && guard < 30) {
        originals.forEach(function (node) {
          track.appendChild(node.cloneNode(true));
        });
        guard++;
      }
    });

    // --- "This is the ladder": make all three columns the same height ---
    // Three columns sit side by side: the heading+ticks (left), the 3:4 image
    // carousel (centre), and the "17 years" story card (right). They must end up
    // the same height. The carousel's height is derived from its width via the
    // CSS aspect-ratio, so it can't simply stretch; we drive everything from a
    // single measured target instead.
    //
    // Target = the tallest of the two text columns' *content* heights (measured,
    // not their grid-stretched box heights - stretching is exactly what we're
    // trying to compute). The carousel is then sized to that height at 3:4
    // (width = target x 3/4), and both text columns are pinned to it with a
    // min-height. Portrait 3:4 is why this is possible at all: at the target
    // height its width (~target x 0.75) still fits the centre track. Runs after
    // fonts load, because web-font swap changes the text columns' heights and an
    // early measurement (the old bug) left the carousel undersized.
    var ladderStory = document.querySelector("#section-story");
    if (ladderStory) {
      var ladderHeader = ladderStory.querySelector(".overview-header");
      var ladderTitle = ladderStory.querySelector(".overview-header .title-wrap");
      var ladderCarousel = ladderStory.querySelector(".slider-wrap");
      var ladderCard = ladderStory.querySelector(".overview-story-card");
      if (ladderHeader && ladderCarousel && ladderCard) {
        var equalizeLadder = function () {
          // Reset so every measurement is of natural content, not a prior pass.
          ladderCarousel.style.height = "";
          ladderCard.style.minHeight = "";
          ladderHeader.style.minHeight = "";
          if (window.innerWidth < 992) return;
          // Height comes from the taller of the two text columns' content; the
          // image has no fixed aspect, so it just fills its column's width (CSS)
          // and takes this height. The nested Webflow slider carries its own
          // height, so the explicit height here is what actually sizes the tile.
          //
          // The card is a stretch grid item, so its scrollHeight would report the
          // row height, not its own content - a feedback loop. Un-stretch it
          // (align-self:start) just for the measurement, then restore.
          var headerH = ladderTitle ? ladderTitle.offsetHeight : ladderHeader.scrollHeight;
          ladderCard.style.alignSelf = "start";
          var cardH = ladderCard.offsetHeight;
          ladderCard.style.alignSelf = "";
          var contentH = Math.max(headerH, cardH);
          // Floor the tile at a 16:9 box (height = width x 9/16) so its slide,
          // badge and arrows stay visible at tablet widths, where the adjacent
          // text columns can be shorter than that. All three columns take the
          // larger of the two so they stay equal.
          var floor = Math.round(ladderCarousel.offsetWidth * 9 / 16);
          var target = Math.max(contentH, floor);
          if (target <= 0) return;
          ladderCarousel.style.height = target + "px";
          ladderCard.style.minHeight = target + "px";
          ladderHeader.style.minHeight = target + "px";
        };
        equalizeLadder();
        window.addEventListener("resize", equalizeLadder);
        window.addEventListener("load", equalizeLadder);
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(equalizeLadder);
        }
      }
    }

    // --- Scroll progress bar ---
    // Fills 0-100% left-to-right as the page scrolls. See HANDOVER.md
    // "Scroll progress bar" - site-wide component, add to every future page.
    // Unlike the back-to-top button, this needs no per-page selector: it
    // reads the whole document's scroll position, not any specific section.
    var progressBar = document.getElementById("scroll-progress-bar");
    if (progressBar) {
      var progressTicking = false;
      function updateScrollProgress() {
        var scrollTop = window.scrollY || document.documentElement.scrollTop;
        var docHeight =
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight;
        var pct = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
        progressBar.style.width = pct + "%";
        progressBar.setAttribute("aria-valuenow", Math.round(pct));
        progressTicking = false;
      }
      window.addEventListener(
        "scroll",
        function () {
          if (!progressTicking) {
            requestAnimationFrame(updateScrollProgress);
            progressTicking = true;
          }
        },
        { passive: true }
      );
      window.addEventListener("resize", updateScrollProgress);
      updateScrollProgress();
    }

    // --- Cursor-driven micro-interactions (magnetic buttons, card
    // spotlight, hero tilt) ---
    // All three need a real, persistent mouse cursor to make sense - none
    // of them are wired up at all on touch devices (rather than being
    // wired up and silently doing nothing there), and all three are
    // skipped under prefers-reduced-motion since they're purely decorative
    // motion, not something conveying state the way the burger-to-X
    // animation above does.
    var reduceMotionCursor =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var hasFinePointer =
      window.matchMedia &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // --- Hero banner text: fixed line counts on every banner and viewport ---
    // Each banner's heading must always read as exactly one line, and its
    // sub-heading as exactly two, on any screen size - the three banners have
    // different copy lengths and the same font-size can't hit that target for
    // all of them at every viewport, so each element's own font-size is
    // solved for independently.
    //
    // Inactive banners are visibility:hidden, not display:none (see
    // .hero-slide below), so they still lay out and can be measured/sized -
    // this runs across all three regardless of which is currently shown.
    var fitTextLines = function (el, targetLines, minPx, maxPx) {
      if (!el || !el.textContent.trim()) return;
      var countLines = function (px) {
        el.style.fontSize = px + "px";
        // Measured fresh at each size, not cached once before the loop: with a
        // unitless line-height this is genuinely a different pixel value at
        // every font-size, so a value captured up front would go stale the
        // moment the first candidate size is tried.
        var lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        if (!lineHeight) return targetLines;
        return Math.round(el.scrollHeight / lineHeight);
      };
      // Binary search for the LARGEST font-size at which the element wraps to
      // at most targetLines. Line count only grows as font-size grows (same
      // width, bigger glyphs), so that boundary is single and monotonic.
      var lo = minPx, hi = maxPx, best = minPx;
      for (var i = 0; i < 16; i++) {
        var mid = (lo + hi) / 2;
        if (countLines(mid) <= targetLines) { best = mid; lo = mid; } else { hi = mid; }
      }
      el.style.fontSize = best + "px";
    };

    var fitHeroText = function () {
      var slides = document.querySelectorAll(".hero-slide");
      slides.forEach(function (slide) {
        var heading = slide.querySelector(".hero-slide__heading");
        var sub = slide.querySelector(".hero-slide__sub");
        // Headings target 1 line via a different technique: measure the
        // unwrapped width (nowrap) against the available width, rather than
        // scrollHeight/lineHeight - a single line's own line-count is always 1
        // by definition, so the earlier line-counting method can't detect
        // "would this wrap" the way it can for 2+ lines.
        if (heading && heading.textContent.trim()) {
          var container = heading.closest(".hero-slides") || heading.parentElement;
          // -2px safety margin: scrollWidth is reported as an integer, rounded
          // from the element's true fractional layout width. A search that
          // targets the exact boundary (scrollWidth <= available) can land on
          // a size whose rounded-down scrollWidth just barely passes while its
          // true width is a hair over - enough to still force a wrap once
          // white-space goes back to normal. The margin keeps the chosen size
          // clear of that edge.
          var available = container.clientWidth - 2;
          var prevWhiteSpace = heading.style.whiteSpace;
          heading.style.whiteSpace = "nowrap";
          // Floor of 12px (not 20px): on the narrowest phones the longest
          // banner heading doesn't fit on one line even at 20px, and staying
          // single-line is the explicit requirement - so the search is allowed
          // to go smaller rather than give up and wrap.
          var lo = 12, hi = 52, best = 12;
          for (var i = 0; i < 16; i++) {
            var mid = (lo + hi) / 2;
            heading.style.fontSize = mid + "px";
            if (heading.scrollWidth <= available) { best = mid; lo = mid; } else { hi = mid; }
          }
          heading.style.fontSize = best + "px";
          heading.style.whiteSpace = prevWhiteSpace;
        }
        // Max lowered from 32 to 24: at the old cap the auto-fit (which picks
        // the LARGEST size that still wraps to exactly 2 lines) was landing on
        // a subheading that read too big/heavy against the heading above it.
        if (sub) fitTextLines(sub, 2, 12, 24);
      });
    };

    if (document.querySelector(".hero-slides")) {
      fitHeroText();
      window.addEventListener("resize", fitHeroText);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(fitHeroText);
      }
    }

    // --- Hero banner rotation ---
    // Three text banners cycle in the same spot. Deliberately plain CSS class
    // toggling plus a CSS transition rather than a GSAP tween: the hero must
    // never depend on a JS animation library to be readable (see the note in
    // samhita-motion.js about the hero getting no scroll-driven entrance), so
    // if this script fails the first banner simply stays put, fully visible,
    // because .is-active is already in the HTML.
    //
    // Pauses while hovered or focused so a banner can't change out from under
    // someone mid-sentence, and does not rotate at all under reduced motion.
    var heroSlidesRoot = document.querySelector("[data-hero-slides]");
    if (heroSlidesRoot) {
      var heroSlides = Array.prototype.slice.call(
        heroSlidesRoot.querySelectorAll(".hero-slide")
      );
      var heroBars = Array.prototype.slice.call(
        document.querySelectorAll("[data-hero-dots] .hero-slide-bar")
      );
      var heroFills = heroBars.map(function (b) {
        return b.querySelector(".hero-slide-bar__fill");
      });
      // The per-banner tick sets pinned to the bottom of the fold; swapped in
      // lockstep with the banner so the bottom row always matches what's shown.
      var heroTickSets = Array.prototype.slice.call(
        document.querySelectorAll("[data-hero-ticks] .hero-ticks__set")
      );
      // Each slide carries its own CTA label (data-cta); the button itself is
      // one shared element outside the rotation (it opens the same popup
      // regardless of banner), so only its text swaps.
      var heroCtaText = heroSlidesRoot.parentElement.querySelector(
        ".primary-button .button-text"
      );
      var reduceMotionHero =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      var heroIndex = 0;
      var setHeroActive = function (next) {
        heroSlides.forEach(function (el, i) {
          el.classList.toggle("is-active", i === next);
        });
        heroBars.forEach(function (b, i) {
          b.classList.toggle("is-active", i === next);
          b.setAttribute("aria-selected", i === next ? "true" : "false");
        });
        heroTickSets.forEach(function (s, i) {
          s.classList.toggle("is-active", i === next);
        });
        if (heroCtaText) {
          var cta = heroSlides[next].getAttribute("data-cta");
          if (cta) heroCtaText.textContent = cta;
        }
        // Reset every bar's fill; the active one refills from 0 (driven by the
        // rAF loop, or set full immediately under reduced motion).
        heroFills.forEach(function (f) {
          if (f) f.style.transform = "scaleX(0)";
        });
        heroIndex = next;
      };

      if (heroSlides.length > 1 && !reduceMotionHero) {
        var HERO_SLIDE_MS = 6000;
        var heroPaused = false;
        var progress = 0; // ms elapsed on the current banner
        var lastTs = null;

        // One rAF loop drives BOTH the auto-advance and the bar fill, so the
        // fill can never drift out of sync with the rotation, and pausing
        // freezes the fill exactly where it is (a CSS transition couldn't).
        var heroFrame = function (ts) {
          if (lastTs === null) lastTs = ts;
          // Clamp dt so a backgrounded tab returning can't skip banners.
          var dt = Math.min(ts - lastTs, 100);
          lastTs = ts;
          if (!heroPaused) {
            progress += dt;
            if (progress >= HERO_SLIDE_MS) {
              progress = 0;
              setHeroActive((heroIndex + 1) % heroSlides.length);
            }
          }
          var fill = heroFills[heroIndex];
          if (fill) {
            fill.style.transform =
              "scaleX(" + Math.min(progress / HERO_SLIDE_MS, 1) + ")";
          }
          requestAnimationFrame(heroFrame);
        };

        // Bars jump straight to a banner and restart its progress from 0.
        heroBars.forEach(function (bar, i) {
          bar.addEventListener("click", function () {
            progress = 0;
            setHeroActive(i);
          });
        });

        setHeroActive(0);
        requestAnimationFrame(heroFrame);

        // Deliberately no pause-on-hover/focus: the bars keep advancing while
        // the pointer is over the hero, and a click just jumps to that banner
        // and lets its progress run from 0 (per request).
        // Still pause accrual while the tab is hidden; lastTs advances each
        // frame regardless, so there's no jump on return.
        document.addEventListener("visibilitychange", function () {
          heroPaused = document.hidden;
        });
      } else {
        // Reduced motion (or a single banner): no auto-advance. Show banner 1
        // with its bar filled, and let clicks switch banners.
        setHeroActive(0);
        if (heroFills[heroIndex]) heroFills[heroIndex].style.transform = "scaleX(1)";
        heroBars.forEach(function (bar, i) {
          bar.addEventListener("click", function () {
            setHeroActive(i);
            if (heroFills[i]) heroFills[i].style.transform = "scaleX(1)";
          });
        });
      }
    }

    // Hero background video: paused (and, via CSS, hidden) for anyone who has
    // asked for reduced motion, leaving the still image behind it. The pause
    // matters on top of the CSS `display:none` because a display:none video
    // still plays - it would keep a decode loop running for something nobody
    // can see. Autoplay stays declared in the HTML rather than being started
    // here, so the video does not depend on this script having run.
    var heroVideo = document.querySelector(".hero-bg-video");
    if (heroVideo && reduceMotionCursor) {
      heroVideo.autoplay = false;
      heroVideo.pause();
      heroVideo.removeAttribute("autoplay");
    }

    // Hero photo stays put while the page scrolls: the heading/CTA and every
    // section below scroll normally, but the photo itself does not move at
    // all - the hero section's own overflow:hidden turns it into a shrinking
    // window onto a stationary image.
    //
    // Done with a scroll-linked transform rather than CSS
    // `background-attachment: fixed` or `position: fixed`, both of which fail
    // here: iOS Safari silently ignores background-attachment:fixed, and
    // .section-hero already sets `perspective` for the cursor tilt, which
    // makes it the containing block for any position:fixed descendant (so a
    // fixed photo would scroll with the section anyway). Translating the
    // photo down by exactly the distance the section has scrolled up
    // (parallaxY = -rect.top) cancels the scroll out exactly, and works
    // identically on every browser including iOS.
    //
    // Shares one transform-state object + apply function with the cursor
    // tilt below (both target the same .hero-bg-fixed element) so the two
    // handlers compose into a single transform string instead of each
    // stomping the other's inline style. HERO_BASE_SCALE overscales the photo
    // slightly so the tilt's rotation always has edge to spare.
    var heroSection = document.querySelector(".section-hero");
    var heroBg = document.querySelector(".hero-bg-fixed");
    if (heroSection && heroBg) {
      var HERO_BASE_SCALE = 1.06;
      var heroTransformState = { tiltX: 0, tiltY: 0, parallaxY: 0 };

      var applyHeroTransform = function () {
        heroBg.style.transform =
          "translateY(" + heroTransformState.parallaxY.toFixed(1) + "px) " +
          "rotateX(" + heroTransformState.tiltX.toFixed(2) + "deg) " +
          "rotateY(" + heroTransformState.tiltY.toFixed(2) + "deg) " +
          "scale(" + HERO_BASE_SCALE + ")";
      };

      if (!reduceMotionCursor) {
        var heroParallaxTicking = false;

        var updateHeroParallax = function () {
          heroParallaxTicking = false;
          var rect = heroSection.getBoundingClientRect();
          // Only bother once the hero is at least partly on screen - skips
          // work for every scroll event on the rest of the page.
          if (rect.bottom < 0 || rect.top > window.innerHeight) return;
          // 1:1 with the scroll, so the photo is visually stationary.
          heroTransformState.parallaxY = -rect.top;
          applyHeroTransform();
        };

        window.addEventListener(
          "scroll",
          function () {
            if (!heroParallaxTicking) {
              heroParallaxTicking = true;
              requestAnimationFrame(updateHeroParallax);
            }
          },
          { passive: true }
        );
        updateHeroParallax();
      }
    }

    if (hasFinePointer && !reduceMotionCursor) {
      // Magnetic CTA buttons: nudges each .primary-button a few px toward
      // the cursor while hovered, capped well short of the button's own
      // edge so it always reads as "attracted," never as sliding away
      // underneath the pointer.
      var MAGNETIC_STRENGTH = 0.25;
      var MAGNETIC_MAX = 10;
      document.querySelectorAll(".primary-button").forEach(function (btn) {
        btn.addEventListener("mousemove", function (e) {
          var rect = btn.getBoundingClientRect();
          var offsetX = e.clientX - (rect.left + rect.width / 2);
          var offsetY = e.clientY - (rect.top + rect.height / 2);
          var x = Math.max(-MAGNETIC_MAX, Math.min(MAGNETIC_MAX, offsetX * MAGNETIC_STRENGTH));
          var y = Math.max(-MAGNETIC_MAX, Math.min(MAGNETIC_MAX, offsetY * MAGNETIC_STRENGTH));
          btn.style.transform = "translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px)";
        });
        btn.addEventListener("mouseleave", function () {
          btn.style.transform = "";
        });
      });

      // Cursor-aware spotlight on card hover: writes the pointer's position
      // within each card to --spot-x/--spot-y (as %), which
      // samhita-theme.css's .levels-card::after / .experience-card::after
      // radial-gradient reads directly - this file only ever tracks the
      // coordinates, all the actual visual (gradient, fade-in/out) lives
      // in CSS.
      document.querySelectorAll(".levels-card, .experience-card").forEach(function (card) {
        card.addEventListener("mousemove", function (e) {
          var rect = card.getBoundingClientRect();
          var xPct = ((e.clientX - rect.left) / rect.width) * 100;
          var yPct = ((e.clientY - rect.top) / rect.height) * 100;
          card.style.setProperty("--spot-x", xPct.toFixed(1) + "%");
          card.style.setProperty("--spot-y", yPct.toFixed(1) + "%");
        });
      });

      // Cursor-tilt parallax on the hero image: a few degrees of
      // rotateX/rotateY tied to pointer position within the hero. Updates
      // the same heroTransformState the scroll parallax above uses, and
      // re-composes the full transform through applyHeroTransform() -
      // this is what keeps the two effects from overwriting each other.
      if (heroSection && heroBg) {
        var HERO_TILT_MAX = 6;
        heroSection.addEventListener("mousemove", function (e) {
          var rect = heroSection.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width - 0.5;
          var py = (e.clientY - rect.top) / rect.height - 0.5;
          heroTransformState.tiltX = -py * HERO_TILT_MAX;
          heroTransformState.tiltY = px * HERO_TILT_MAX;
          applyHeroTransform();
        });
        heroSection.addEventListener("mouseleave", function () {
          heroTransformState.tiltX = 0;
          heroTransformState.tiltY = 0;
          applyHeroTransform();
        });
      }
    }
  });
})();

/* ── Pathways tabs (#section-pathways) ──
   All three panels ship in the DOM so the copy is crawlable and the section is
   fully readable with JS off (every panel just renders stacked). This wires the
   tablist: click or arrow-key to switch, `hidden` toggled on the panels, and
   aria-selected/tabindex kept in step so the roving-tabindex pattern screen
   readers expect actually holds. */
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var section = document.querySelector("#section-pathways");
    if (!section) return;
    var tabs = Array.prototype.slice.call(
      section.querySelectorAll(".pathways-tab")
    );
    var panels = Array.prototype.slice.call(
      section.querySelectorAll(".pathways-panel")
    );
    if (tabs.length === 0 || tabs.length !== panels.length) return;

    function select(index, focusTab) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].classList.toggle("is-active", on);
        if (on) {
          panels[i].removeAttribute("hidden");
        } else {
          panels[i].setAttribute("hidden", "");
        }
      });
      if (focusTab) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        select(i, false);
      });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        select(next, true);
      });
    });
  });
})();
