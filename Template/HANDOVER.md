# Samhita × Waveyu template adaptation — Handover

## What this is

The Waveyu template (`Waveyu - Webflow HTML website template.html`) is a one-page
Webflow export for a surf-camp/retreat business. This handover covers a new file,
**`samhita-home.html`**, which reuses Waveyu's design system (layout, components,
CSS, JS, animations) but carries **Samhita's homepage content and brand colors**
instead. Scope was explicitly the homepage only — see "What's next" below for
how to extend this to other Samhita pages.

**The original template file was never edited.** Everything Samhita-specific
lives in four new files, all in this same folder:

| File | Purpose |
|---|---|
| `samhita-home.html` | The adapted homepage. Open this one. |
| `samhita-theme.css` | Color overrides (CSS custom properties + a few hardcoded exceptions) *and* the CSS-driven hover/focus micro-interactions. Linked after the two original stylesheets. |
| `samhita-interactions.js` | Vanilla JS for accordion toggle, popup open/close, and the navbar scroll-color-invert (see "Why a custom JS file" below). |
| `samhita-motion.js` | GSAP/ScrollTrigger scroll-reveal entrance animations for headings and cards (see "Micro-interactions" below). |
| `samhita-logo.png` | The real Samhita logo, downloaded and self-hosted (see "Images" below). |

`samhita-home.html` links to the original, untouched CSS/JS files inside
`Waveyu - Webflow HTML website template_files/` via relative paths, so that
folder must stay where it is relative to `samhita-home.html`.

## How to view it

Open `samhita-home.html` directly in a browser (double-click, or
`open samhita-home.html` on macOS). No build step, no server required —
though a local server (`python3 -m http.server`) also works if you prefer.

## Color palette — where it came from

Colors were extracted from the **live samhita.org homepage** by sampling
`getComputedStyle` across the rendered page (not guessed from the logo).
Most-used colors, in order of frequency:

| Hex | Role on samhita.org | Used for |
|---|---|---|
| `#ef4266` | Primary brand coral — buttons, backgrounds, links | Replaces Waveyu's lime accent (`--color--base--accent`) |
| `#111827` | Primary heading/body text | Replaces Waveyu's near-black (`--color--base--black`) |
| `#041c33` | Dark navy — nav text ink | Replaces Waveyu's dark-green contrast sections (`--color--backgrounds--bg-green`, footer blur, popup overlay) |
| `#6b7280` | Muted body text | Replaces Waveyu's muted gray |
| `#42aaaa` / `#2d9b9b` | Secondary teal accent | **Additive** — not in the original template, added as `--color--base--accent-teal` for optional future use, unused by default |
| `#ebf5f8` | Pale blue-tinted section background | Replaces Waveyu's neutral gray subtle-bg |
| `#f9fafb` | Page background | Replaces Waveyu's off-white page bg |

All of this lives in `samhita-theme.css` as `:root` custom-property overrides,
because the original stylesheets already route ~100+ button/text/background
declarations through `var(--color--base--accent)` etc. — overriding the
variables recolors the whole page without touching a single selector in the
original CSS.

**Two things a variable override can't reach** (hardcoded hex values in the
original CSS, not `var()` references) were re-declared as specific selector
overrides in `samhita-theme.css`, also documented inline there:
- `.success-message` background (form success state, was lime)
- `.footer-bg-blur` / `.popup-form` overlay tint (was dark green, now navy)

Typography now uses `--font--primary: "Suisse Int'l", "Open Sans", sans-serif;`
(overridden in `samhita-theme.css`, was `"Bricolage Grotesque", Arial, sans-serif`)
— see "Typography" further below for the full detail on why Suisse Int'l
won't actually render without licensed font files.

## Content mapping — Waveyu section → Samhita section

The template has 17 stacked `<section>`s. Sections with no honest Samhita
equivalent were dropped rather than filled with invented copy (day-by-day
camp itinerary, pricing tiers, camper testimonials, FAQ, team bios). What's
kept, and what real Samhita copy/data it carries:

| Waveyu section | Now | Content source |
|---|---|---|
| `section-hero` | Hero | Real headline theme + real stat (654,568+ citizens) from samhita.org |
| `section-overview` | **Our Story** (`#section-story`) | The "ladder" narrative (skilling → jobs → credit → healthcare), real impact stats, real ladder imagery (`Cropped_Ladder-Pink.png` / `-Broken.png`) |
| `section-levels` (4 cards) | **Who We Serve** (`#section-audiences`) | The 4 real audience segments: CSR Clients / Foundations / Government / Financial Institutions, each with their real one-line pitch |
| `section-stay` (accordion) | **Who We Work With** (`#section-partners`) | The 5 real stakeholder groups from samhita.org ("Who We Work With"), expanded from 4 accordion slots to 5 |
| `section-experience` (4 cards) | **Catalytic Initiatives** (`#section-initiatives`) | The 3 real programs: Samyak, OneTAC, CPMH (4th card slot dropped, only 3 exist) |
| `section-cta-1` | Mid-page CTA | Real "₹1 → ₹3–30" catalytic-finance stat |
| `section-instructors` (2-slide bio slider) | **The Architects of the Ladder** (`#section-partners-logos`) | Repurposed as a 2-slide partner showcase (corporates vs. institutions/govt) + 2 real capability stats (654,568 citizens skilled, 90% placement) |
| `section-cta-2` | **Catalytic Finance teaser** (`#section-catalytic`) | Real headline from the `/catalytic-finance` page |
| `popup-form` | **Connect / inquiry form** | Rebuilt fields (Name, Email, Organisation, "I'm interested in", Message) replacing surf-level/package selects |
| `section-final-cta` | Final CTA | Real tagline "Catalysing Prosperity. Together.", real social links |
| footer | Footer | Real Mumbai + Bengaluru addresses, real phone number, real copyright line, real social links |

**Dropped entirely** (no real homepage content to map to them): `popup-about`,
`section-program` (day-by-day itinerary), `section-testimonials` (would have
required inventing fake camper quotes), `section-steps`, `section-pricing`,
`section-faq`, `section-team` (individual bios belong on a future `/teams`
page, not the homepage).

## Nav fix: removed a duplicate CTA

The original template had a quiet "Contact" mailto link sitting next to a
bold "Apply Now" button in the top-right of the navbar — two different
actions. In the first pass here, both got mapped to the same "open the
inquiry popup" action, so the navbar showed "Connect" and "Connect Now"
right next to each other doing the identical thing. Fixed: the redundant
"Connect" text link is removed; the single "Connect Now" button is the only
CTA in that navbar slot. "Connect" still exists as a real nav item elsewhere
in real Samhita nav conventions, and as the popup's own eyebrow label — just
not duplicated right beside an identical button.

## Images

Went through three iterations, worth knowing the history:

1. **Hotlinked from `samhita.org`.** Broke in real browsers — their server
   likely has hotlink/referrer protection (`curl` doesn't send a `Referer`
   header the way a real browser does, so my checks falsely passed), which is
   why the partner logos in "Who We Work With" weren't rendering.
2. **Inline SVG placeholders.** Fixed the reliability problem but left every
   image slot looking like an unstyled wireframe.
3. **Current: real photography, self-hosted, no network dependency.**
   - **The Samhita logo** (navbar brand + footer) is downloaded and
     self-hosted as **`samhita-logo.png`** in this folder, referenced as
     `./samhita-logo.png`. This is the one image that had to be the real
     brand asset rather than a stand-in.
   - **Every other image** (26 slots: hero, ladder/story slider, levels
     cards, room-media, experience-card logos, CTA backgrounds, instructor
     slides, final-cta, footer bg) now reuses an actual photo already bundled
     locally in `Waveyu - Webflow HTML website template_files/` — the same
     files the original template ships, referenced by relative path so there
     is zero network dependency and zero risk of hotlink blocking. These are
     Waveyu's own surf-camp/travel photography (not Samhita's), used purely
     as reliable stand-in imagery until real Samhita photography is sourced
     — pick a section, its heading tells you what real photo should replace
     the placeholder.
   - Wherever possible, each slot reuses the **same photo the original
     template used in that exact structural position** (e.g. the hero uses
     Waveyu's own original hero photo, the story-slider reuses Waveyu's
     original 4 slide images in order, the room-media accordion images reuse
     Waveyu's original twin/double/group/common-area room photos). This
     matters because the original template's designer already made sure
     these specific images have enough contrast for the white text
     overlaid on top of them — reusing them in the same role sidesteps the
     legibility problem the placeholder version had to solve by hand with a
     dark/light variant system.
   - **Social icons** (Facebook, X, YouTube) went back to being **inline
     SVGs**, matching the original template's own icon markup exactly
     (extracted straight from `Waveyu - Webflow HTML website template.html`)
     — vectors, so there's nothing to ever fail to load. Waveyu doesn't ship
     a LinkedIn icon (its set is Facebook/YouTube/Threads/X/Instagram/TikTok),
     so LinkedIn uses a hand-written glyph in the same style (same `viewBox`,
     `fill="currentColor"`, `<title>` pattern) — the standard, ubiquitous
     "in" mark used broadly across the web for linking to a LinkedIn profile.

If you need to swap any of these for real Samhita photography later, each
`<img>`'s `alt` text still describes what belongs there (e.g. `alt="Samyak
initiative"`), unchanged from the placeholder version — just replace the
`src`.

## Why a custom JS file (`samhita-interactions.js`)

Investigated before writing anything: Webflow's compiled `webflow.*.js` bundle
drives two kinds of behavior —

1. **Generic, class-based components** (`.w-nav` mobile menu, `.w-dropdown`
   hover menus, `.w-slider` carousels) — these work automatically on any
   content as long as the class structure is intact. No replacement needed;
   confirmed present throughout `samhita-home.html`.
2. **Per-element animation bindings** (accordion expand/collapse, popup
   open/close) — these are wired via Webflow's Interactions 2 (IX2) system to
   *this specific page's* original `data-w-id` values, compiled into the JS
   bundle at export time. Changing the content (different card counts, dropped
   sections) breaks that binding — it can't reconnect to elements it wasn't
   compiled to look for.

Rather than leave the accordion and the "Connect" popup non-functional,
`samhita-interactions.js` reimplements those behaviors in plain JS (class
toggling, no dependencies): accordion opens exclusively (closes siblings) and
sweeps in its accent fill-line, popup opens/closes via `[data-open-popup]`
triggers, `Escape`, and the close (×) button. The same file also drives the
**navbar scroll-color-invert** (transparent-over-hero → solid-on-scroll,
text fading from white to dark ink) — that was originally IX2-scrubbed via
inline styles the compiled JS mutated live on scroll, another behavior tied
to the source page and not reconnectable to new content. Confirmed working:
scrolling smoothly interpolates the navbar's background/border/text-color
custom properties from transparent-white to solid-dark.

## Micro-interactions: scroll-reveal (`samhita-motion.js`) + hover (CSS)

The original template's heading/card entrance animations (fade + rise in as
you scroll) were, like the accordion, wired through Webflow's compiled IX2
config bound to old element IDs — so the adapted page initially shipped with
*no* animation at all, everything just statically visible. Two different
fixes for two different kinds of interaction:

**Scroll-reveal entrances** — a new `samhita-motion.js`, loaded alongside the
template's own bundled (previously unused) `gsap.min.js` and
`ScrollTrigger.min.js`. It targets classes generically (heading line/word
spans, card grids, sliders, CTA blocks) rather than specific IDs, so it
survives future content edits. Safety principle: every animation is a
`gsap.from()` — the hidden "from" state is only ever set by this script at
runtime, never in static CSS/HTML, so if the script fails to load or throws,
content simply shows normally rather than getting stuck invisible.

**The hero is deliberately excluded from this and gets no JS-driven entrance
at all.** While verifying this, the automated browser tool used for testing
turned out to throttle `requestAnimationFrame` severely (confirmed via
`gsap.ticker.frame` staying at `0` for 5+ real seconds) — a browser-automation
quirk, not something a real user's browser does, but it made concrete
screenshot evidence of the actual risk: the hero heading was invisible for a
very long stretch waiting on a ticker that hadn't ticked yet. Above-the-fold
content that's the first thing anyone sees must never depend on a JS tick to
become visible, so the hero now renders at full opacity immediately from
plain HTML/CSS — only content the user has to scroll to reach (where there's
always been real time for JS to run first) gets the scroll-triggered
treatment.

**Hover/focus interactions** (nav-link underline sweep, footer-link
underline sweep, button arrow nudging toward the top-right on hover, subtle
card lift on `.levels-card` / `.experience-card` / `.overview-story-card` /
`.room-accordion-wrap`) were rebuilt as plain CSS in `samhita-theme.css`
instead — no JS needed, and CSS `:hover`/`:focus-visible` can't get stuck the
way a JS ticker theoretically could. All respect
`prefers-reduced-motion: reduce`.

## Back-to-top button (site-wide component — add to every future page)

A floating "liquid glass" back-to-top button, bottom-right, fixed to the
viewport. **This is a site-wide component, not homepage-specific** — when
building out any other Samhita page from this template (About, Teams, For
CSR Clients, Catalytic Finance, Careers, Connect, etc.), carry this same
button onto that page too, following the pattern below.

**Behavior:** hidden by default. Appears as soon as the page's first fold
(hero) scrolls out of the viewport; hides again if the user scrolls back up
into it. Clicking it smooth-scrolls to the top of the page (instant jump
instead if `prefers-reduced-motion: reduce`).

**Look:** a small circular pill, dark-tinted translucent glass (blur +
saturate, *not* a white/light tint) with a plain white up-arrow stroke, no
fill. The dark tint is deliberate, not a stylistic default — this button has
to float legibly over both the page's light background *and* its dark
hero/footer sections, and a white-tinted glass would wash out and lose
contrast against the light sections. A dark tint holds the white arrow's
contrast everywhere on the page.

**The three pieces to replicate on a new page:**

1. **HTML** — one `<button>`, placed right after the page's `</footer>` (or
   equivalent last element) and before the closing `<script>` tags, so it
   sits outside any section's own stacking/overflow context:
   ```html
   <button type="button" id="back-to-top" class="back-to-top-button" aria-label="Back to top">
     <svg class="back-to-top-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
       <path d="M12 19V5"></path>
       <path d="M5 12l7-7 7 7"></path>
     </svg>
   </button>
   ```
2. **CSS** — the `.back-to-top-button` / `.back-to-top-icon` rules (plus
   their `prefers-reduced-motion` overrides) already live in
   `samhita-theme.css`, shared across every page that links that stylesheet.
   Nothing to duplicate here as long as the new page also links
   `samhita-theme.css`.
3. **JS** — the observer logic already lives in `samhita-interactions.js`,
   also shared automatically via the `<script>` include. **The only thing
   that changes per page** is which element counts as "the first fold": the
   script looks for `document.querySelector(".section-hero")` specifically.
   If a new page's first-fold section uses a different class, either give
   it the `section-hero` class too, or update that one selector in
   `samhita-interactions.js` to match (e.g. a page-specific first-fold class)
   — everything else (the observer, the click handler, the visibility
   toggle) needs no change.

**Why an `IntersectionObserver` on the hero rather than a scroll-position
threshold (e.g. "show after 600px"):** ties the button's appearance to an
actual layout landmark instead of a magic pixel number, so it keeps working
correctly regardless of how tall a given page's hero is — including across
breakpoints, where a hero's height (and therefore where "the first fold
ends") changes.

**Verified:** hidden at page load (hero in view); confirmed to flip
`is-visible` on/off correctly via direct DOM inspection immediately after
scrolling past/back into the hero; confirmed the click handler calls
`window.scrollTo({ top: 0, behavior: 'smooth' })` (intercepted the call
directly). The smooth-scroll animation itself didn't visibly progress inside
the automated test tool used for this session — consistent with the same
`requestAnimationFrame`-throttling tooling quirk already documented below
under "Known tooling caveats" (smooth-scroll's animation loop rides the same
per-frame tick GSAP's ticker uses); a real user's browser tab runs this at
full rate.

## Page loader (site-wide component — add to every future page)

A full-screen overlay shown while the page's images load, with a **real
(not simulated) percentage**: the Samhita logo (white variant), a thin
progress bar, and a live "N%" readout, centered. Fades out (opacity +
visibility) once every image has settled, then set to `display:none`.
**Site-wide, same rule as the back-to-top button and scroll progress bar** —
carry it onto every future page built from this template.

**Background: deliberately identical to the footer's, not just similar.**
The loader reuses the footer's own `.image-wrap.u-absolute-full` +
`.footer-bg-blur` structure and classes verbatim (the same photo, the same
`backdrop-filter: blur(50px)` frosted navy tint) rather than approximating
the look with separate new CSS — see "Verified" below for why this
guarantees the two stay visually identical, including automatically, if the
footer's own version of this look is ever tweaked later. `background-color:
var(--color--backgrounds--bg-green)` stays on `.page-loader` itself too, as
a solid-navy fallback for the moment before the background photo has
loaded (the exact same fallback role `.footer`'s own background-color
serves — see "Fixed bug: white patch below the footer" above).

**The three pieces to replicate on a new page:**

1. **HTML** — placed as the very first thing inside `<body>` (before even
   the scroll progress bar), so it visually covers everything from the
   earliest possible moment:
   ```html
   <div id="page-loader" class="page-loader" role="status" aria-live="polite" aria-label="Page loading">
     <div class="image-wrap u-absolute-full">
       <div class="footer-bg-blur"></div>
       <img src="./Waveyu - Webflow HTML website template_files/6984f476176be0064e11ac20_aec255993fec0c4222fbfae5aa8d0d1e_surfers.avif" alt="">
     </div>
     <img src="./samhita-logo white.png" alt="" class="page-loader-logo">
     <div class="page-loader-bar-track">
       <div id="page-loader-bar-fill" class="page-loader-bar-fill"></div>
     </div>
     <div id="page-loader-percent" class="page-loader-percent">0%</div>
   </div>
   ```
   The background photo doesn't need `data-bg-src` even though it's a
   "background" visually — it's a real `<img>` tag (unlike the hero's CSS
   `background-image`), so it's already counted automatically via
   `document.images` like any other image on the page. Adding `data-bg-src`
   to it too would double-count it.
2. **CSS** — `.page-loader` and its children (plus the
   `prefers-reduced-motion` override) already live in `samhita-theme.css`,
   shared automatically. `z-index: 1000` is deliberately higher than every
   other fixed overlay on the page (the popup's 101, the scroll progress
   bar's 105) since the loader must cover literally everything, including
   the navbar, while active. The background layer gets an explicit
   `z-index: 0`, and the logo/bar-track/percentage get `position: relative;
   z-index: 1;` — this guarantees the text content always renders above the
   background regardless of default paint-order edge cases, rather than
   relying on whatever makes the footer's own version of this same nesting
   work out visually.
3. **JS** — the tracking/fade-out logic already lives in
   `samhita-interactions.js`, shared automatically. **Nothing to change per
   page** for the `<img>` half of the counting — it automatically counts
   every `<img>` on whatever page it runs on (including the loader's own
   background photo, and the footer's identical one, as two separate
   `<img>` tags). **One thing to remember per page**: any CSS
   `background-image` used for content photos (not `<img>` tags) needs a
   matching `data-bg-src="..."` attribute on that element for the loader to
   count it — see the hero in `samhita-home.html` for the pattern:
   ```html
   <div class="... hero-bg-fixed" style="background-image: url('./photo.webp')" data-bg-src="./photo.webp"></div>
   ```
   Without that attribute, a CSS background photo is invisible to the
   loader's counting (it isn't in `document.images`), so the percentage
   would reach 100% without actually having waited for that photo.

**How the percentage is calculated:** every `<img>` on the page, plus every
element carrying `data-bg-src`, counts as one unit toward the total. Each
unit "settles" — and the percentage advances — on either its `load` or its
`error` event (a broken image still counts as settled, specifically so a
single broken asset can never block the counter forever). Images already
`.complete` by the time the script runs count immediately. A hard 8-second
timeout is the final backstop: no visitor should ever be stuck looking at
the loader indefinitely, regardless of what a slow or hung request does.

**Does not lock body scroll while visible** (an earlier version did, via
`document.body.style.overflow = "hidden"`). Removed after a real report of
"cannot scroll the page" — the loader already visually covers the entire
page at the highest z-index on the page, so there was nothing beneath it a
locked scroll was actually protecting; the lock only added a failure mode
(if the settle-counting ever stalled — a slow connection, or an image that
never fires `load`/`error` for some reason — scroll stayed blocked for that
visitor until the 8s safety timeout). Removing it eliminates that failure
mode entirely at no visible cost, since a fully-covering, non-scrollable-
looking overlay was already the actual visual experience either way.

**Why a real percentage instead of a fake/simulated one** (a common
pattern: animate a bar from 0→90% on a timer, snap to 100% on `window.load`):
a real, countable signal (images settling) was already available and cheap
to compute here, and is more honest — the percentage always reflects actual
loading progress rather than an arbitrary animation curve tuned to feel
right on one particular connection speed.

**Verified:** total asset count confirmed correct (29 `<img>` elements —
the original 28 plus the loader's own background photo — + 1 `data-bg-src`
hero photo = 30); full lifecycle confirmed end-to-end — loader visible at
`0%` on load, `is-loaded` class and `display:none` correctly applied once
all 30 assets settled. Confirmed `document.body.style.overflow` is never
set at all now (checked immediately on page load, before the loader had a
chance to finish) — the page is scrollable from the very first instant,
regardless of how long the loader itself takes to finish. Background layer
confirmed `z-index: 0` / `position: absolute` and the logo confirmed
`z-index: 1` / `position: relative` (i.e. correctly stacked, not relying on
assumption). Visually confirmed via screenshot (manually held at a
mid-progress state) that the logo/bar/percentage render correctly and
legibly on top of the same blurred-photo-plus-navy-tint background the
footer uses.

## Scroll progress bar (site-wide component — add to every future page)

A thin (3px) bar fixed to the very top edge of the viewport, above the
navbar, filling left-to-right from 0% to 100% as the page scrolls from top
to bottom. **Site-wide, same rule as the back-to-top button** — carry it
onto every future page built from this template.

**The three pieces to replicate on a new page:**

1. **HTML** — one `<div>`, placed as the very first thing inside `<body>`
   (before the navbar), since as a `position: fixed` element its DOM
   position doesn't affect where it renders — this placement is just for
   readability, so it's the first thing a reader of the file's source sees:
   ```html
   <div id="scroll-progress-bar" class="scroll-progress-bar" role="progressbar" aria-label="Page scroll progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>
   ```
2. **CSS** — `.scroll-progress-bar` (plus its `prefers-reduced-motion`
   override) already lives in `samhita-theme.css`, shared automatically.
3. **JS** — the scroll listener already lives in `samhita-interactions.js`,
   shared automatically. **Nothing to change per page** — unlike the
   back-to-top button, this tracks `document.documentElement.scrollHeight`
   for the whole page, not any specific section, so no selector needs
   updating when adding a new page.

**Implementation notes:** the scroll handler is wrapped in a
`requestAnimationFrame` throttle (only schedules one pending update per
frame, via a `progressTicking` flag) rather than running on every raw
`scroll` event, which fires far more often than the screen can repaint.
`aria-valuenow` is kept in sync alongside the visual width for screen reader
users tracking progress through a long page.

**Verified:** width calculation confirmed correct (50.0% at exactly
half-scrolled, checked directly against `scrollTop`/`scrollHeight`), and
visually confirmed rendering as a pink strip above the navbar. Same caveat
as the back-to-top button: this automated test tool's `requestAnimationFrame`
throttling meant the bar's width didn't visibly update within a live
scroll-and-check test — the underlying math/DOM-update logic was confirmed
directly instead. A real user's browser ticks `requestAnimationFrame` on
every scroll frame.

## Favicon + social preview meta (site-wide — add to every future page)

Sourced directly from the live samhita.org (not invented): their favicon and
Open Graph/Twitter preview image are literally the same 251×249px file (the
colored-triangle icon mark from the logo), self-hosted here as
**`samhita-favicon.png`**.

**What's sitewide-constant vs. per-page** when adding a new page:

| Tag | Scope | Value |
|---|---|---|
| `<link rel="icon">` / `apple-touch-icon` | constant | `./samhita-favicon.png` |
| `theme-color` | constant | `#041c33` (our own navy, *not* the live site's current `#1a365d` meta value — chosen for internal consistency with the rest of this page's own dark chrome; see reasoning below) |
| `og:image` / `twitter:image` | constant | `./samhita-favicon.png`, `251`×`249` |
| `og:site_name`, `og:locale` | constant | `Samhita`, `en_US` |
| `og:title` / `twitter:title` | **per-page** | that page's own `<title>` |
| `og:description` / `twitter:description` | **per-page** | that page's own `<meta name="description">` |
| `og:url` | **per-page** | that page's real intended canonical path once deployed (e.g. `https://samhita.org/about`) |

**Why `theme-color` doesn't copy the live site's `#1a365d` verbatim:** that
value only exists in a `<meta>` tag on the live site — it's not a color that
actually appears anywhere in their visible design, and doesn't match any
other navy already established across this project's own color audit
(`#041c33`, used throughout `samhita-theme.css`). Using our own already-
consistent navy here avoids introducing a second, slightly-different
"navy" into the project for no visible benefit.

**Why `twitter:card` is `summary` here, not `summary_large_image`
(which the live site itself uses):** Twitter/X's large-image card format
expects a landscape image at least 300px wide; the real asset both sites
share is a small square icon (251×249), below that minimum. `summary` is
the card format actually designed for a small square image + title/
description, so it was chosen for correctness rather than copying the live
site's card type, which is arguably already a minor mismatch on their end
(their `og:image:width`/`height` meta claims `1200`×`630` while the file
actually served is `251`×`249` — an inconsistency on the live site itself
we shouldn't replicate here).

**MUST be fixed before deployment:** `og:url`, `og:image`, and
`twitter:image` are currently relative paths (`./samhita-favicon.png`,
`https://samhita.org/` as a placeholder homepage URL). Browser-rendered
previews resolve relative paths fine, but server-side link-unfurl bots
(Slack, LinkedIn, WhatsApp, X) require fully-qualified absolute URLs to
fetch the preview image — a relative `og:image` will simply fail to show a
preview image once this goes live on a real domain. Swap these three values
for the real absolute production URLs at deployment time, once the final
hosting domain/path structure is known.

**Verified:** favicon downloaded directly from `https://samhita.org/favicon.png`
(HTTP 200, confirmed identical file — same `content-length`/`etag` — to their
own `og:image` at `/assets/images/logo.png`, so both site favicon and OG
image are genuinely the same real asset, not two different downloads).
Confirmed `<link rel="icon">` and all `og:`/`twitter:` meta tags present and
correctly valued via direct DOM inspection after page load.

## Typography — Suisse Int'l with Open Sans fallback

`--font--primary` (the single variable that governs every font on the page —
see the note under "Color palette" above for why one variable reaches
everything) is now:
```css
--font--primary: "Suisse Int'l", "Open Sans", sans-serif;
```
replacing the Waveyu template's own default, `"Bricolage Grotesque", Arial, sans-serif`.
`Bricolage Grotesque` itself is no longer referenced anywhere and its
`@font-face` declarations in the original (untouched) template CSS simply go
unused now.

**Suisse Int'l will not actually render for most visitors.** It's
samhita.org's real, licensed brand typeface (Swiss Typefaces) — no font
files are bundled in this project, so the browser can only use it if a
visitor already has it installed locally (rare outside of Samhita's own
design team). This is expected, not a bug: the `font-family` chain is
written exactly like samhita.org's own CSS does it — name the real brand
font first, then a real, loadable fallback — so the declaration is already
future-proof. **If licensed Suisse Int'l font files (`.woff2`) become
available**, self-host them with an `@font-face` block added to
`samhita-theme.css`, following the exact same pattern the original template
already uses for Bricolage Grotesque (see its `@font-face` rules in
`waveyu.webflow.shared.64b6c47da.min.css` for the shape to copy) — the
`--font--primary` variable itself needs no further change once those files
exist, since it already names `"Suisse Int'l"` first.

**Open Sans is the fallback that actually renders for everyone else** (i.e.
effectively everyone, today). Unlike Suisse Int'l, it's free, and is loaded
for real via Google Fonts — `<link rel="preconnect">` + a `css2` stylesheet
link in `samhita-home.html`'s `<head>`, requesting weights 400/500/600/700
plus italic 400 (covering the range Bricolage Grotesque needed: buttons,
headings, body copy, the accordion's muted label text). This is the one
external (non-self-hosted) font dependency in the project — a deliberate
exception to the "self-host everything" pattern used for images, since
Google Fonts' CDN is reliable enough that this template lineage (Webflow
exports generally, and even this page's own Bricolage Grotesque font)
already assumes CDN-hosted fonts are fine.

**Site-wide, not homepage-specific**: both the `--font--primary` override
and the Google Fonts `<link>` tags need to carry over to every future page
built from this template, the same as the color palette overrides.

**Verified**: `getComputedStyle(document.body).fontFamily` confirmed to
report `"Suisse Int'l", "Open Sans", sans-serif` exactly; `document.fonts`
confirmed multiple Open Sans weights reach `status: "loaded"` (fetched
successfully from Google Fonts); screenshot confirms the page visibly
renders in Open Sans (distinctly different letterforms from the previous
Bricolage Grotesque, more neutral/grotesque in character — closer to Suisse
Int'l's own style, which was the point of choosing it as the fallback over
keeping Bricolage Grotesque).

## Deferred improvements (flagged now, revisit later — not yet actioned)

One suggestion came out of a broader page-quality review that is
deliberately **not implemented yet**, because doing it properly needs
assets this pass doesn't have:

- **`loading="lazy"` on below-fold images.** Right now only the hero image
  is `eager` (correct — it's above the fold and should start loading
  immediately); the other 26 images (all Waveyu stand-in photography, not
  final Samhita photography — see "Images" above) have no `loading`
  attribute at all, so they load with the browser's default eager-ish
  behavior. Adding `loading="lazy"` to all of them is cheap and easy, but
  the natural moment to do it is **when the stand-in photos are swapped for
  final Samhita photography** — do both in the same pass rather than
  touching every `<img>` tag twice.

## Fixed bug: "Who We Serve" cards misaligned at some mobile widths

The four cards (For CSR Clients / Foundations / Government / Financial
Institutions) could end up different heights once stacked in a single
column on mobile — three uniform, one (Financial Institutions) visibly
shorter, breaking the vertical rhythm between them.

**Root cause:** the original template gives `.levels-card` a fixed
`height: 26rem` at wide breakpoints, but switches to `height: auto` below
767px so each card sizes to its own content instead — a reasonable idea in
general (avoids forcing extra whitespace into a short card on a narrow
screen), but it interacts badly with *this page's own copy* specifically:
the four paragraphs are noticeably different lengths ("Financial
Institutions"'s is the shortest of the four), and at some widths within
that auto-height range, three of the four paragraphs wrap to one more line
than the shortest one — three cards grow a line taller, the fourth doesn't,
and the mismatch reads as "everything lines up except the last one."

**Confirmed reproduced at exactly 600px width** (heights 296px / 296px /
296px / 276px) — notably, at 767px itself (the breakpoint boundary) all
four happened to already match by coincidence of where their specific text
wrapped, which is why this was easy to miss during earlier responsive
checks that only sampled the standard breakpoint values rather than the
range between them.

**Judged not intentional**, not a "the last one is deliberately different"
design choice — nothing else about that card (badge, icon, structure)
marks it as meant to stand apart, and the wide-breakpoint version of this
same design uses a fixed, uniform height for all four. Fixed all four
rather than special-casing the last one.

**The fix** (`samhita-theme.css`):
```css
@media screen and (max-width: 767px) {
  .levels-card {
    min-height: 26rem;
  }
}
```
`min-height` rather than a rigid `height` — restores the same uniform
416px (26rem) the wide-breakpoint design already uses as the *floor*, while
still letting a card grow taller without clipping if some future copy
change makes one paragraph genuinely need more than 4 lines at a given
width (a rigid `height` would have silently clipped overflow text instead).

**Verified:** confirmed uniform 416px height across the full affected
range — 600px (where the bug reproduced), 375px (narrowest common phone
width, also checked for text overflow: none), and 767px (the breakpoint
boundary) — plus re-confirmed no regression at 991px, 1440px, and 1920px
(all already-uniform tiers this fix doesn't touch, since the
`@media (max-width: 767px)` guard only applies within the affected range).

## Fixed bug: white patch below the footer

There was a genuine (now-fixed) rendering bug, not a false alarm: a white
strip of the page's own light background color was visible right after the
footer ended, at the very bottom of the page.

**Root cause:** the "Our Story" slider's off-screen carousel slides (a
completely standard Webflow slider structure — every slide sits side by
side in a row, and only one is shown at a time via the slider mask's own
`overflow: hidden`) were inflating `document.documentElement.scrollHeight`
— the page's *true* scrollable height — by about 25-30px beyond the actual
rendered content, even though those slides were already correctly visually
clipped and never reachable by scrolling or visible to a user. That extra
invisible ~30px of "phantom" scrollable space rendered as a strip of the
page's own light `bg-page` background color below the footer, since nothing
was there to paint over it.

**Confirmed via direct measurement**, not guesswork: `document.documentElement.scrollHeight`
read 7366px while the tallest actual element on the page (the footer's own
background image) ended at 7340px — a persistent ~26-30px gap unaccounted
for by any real element, reproducible across reloads. Setting `overflow-x: hidden`
on *both* `html` and `body` together (confirmed necessary — setting it on
only one of the two did not reproduce the fix) dropped `scrollHeight` to
exactly match the real content height, and eliminated a related ~64px of
horizontal overflow (`scrollWidth` vs `clientWidth`) from the same
off-screen slides at the same time.

**The fix** (in `samhita-theme.css`, near the top, applies sitewide):
```css
html,
body {
  overflow-x: hidden;
}
```
This page never needs horizontal scroll, so hiding `overflow-x` is a safe,
common, standard defensive rule regardless of what triggers the underlying
issue. Verified this doesn't break anything else that depends on ancestor
`overflow` behavior — specifically checked the Catalytic Initiatives
section's `.experience-header.is-sticky` (a `position: sticky` element),
confirmed still `position: sticky` and functioning correctly, since
`overflow-x` (unlike `overflow-y`) doesn't interfere with sticky
positioning on an ancestor.

**Note for a previous, narrower fix in this same area:** `.footer`'s own
`background-color` was separately changed from fully transparent to a solid
navy (see the footer entry in "Images" / theme CSS) — that was a real,
worthwhile defensive fix in its own right (the footer's dark look depended
entirely on an inner absolutely-positioned photo+blur layer with zero
fallback color), but it did **not** fix this specific bug, since the
phantom scrollable space was *outside* the footer's own box, not a gap
within it. Both fixes are independently correct and now both in place.

**A second, different-looking version of the same symptom can still occur
after this fix — and isn't a page bug.** Re-verified after the
`overflow-x: hidden` fix above (at both 1440px and 1920px viewport widths)
that `document.documentElement.scrollHeight` exactly matches the footer's
real bottom edge, with zero phantom gap — the document-level bug is
confirmed gone. If a white strip still appears below the footer after this,
the far more likely explanation is the browser's own **elastic/rubber-band
overscroll "bounce"** — most visible on macOS trackpads, in both Safari and
Chrome — which reveals blank space beyond the page's true top/bottom edge
when a user scrolls with momentum past either end. This is OS/browser
scroll physics acting on a correctly-sized page, not page content, so it
can look identical to a real layout gap but no page CSS can remove its
*cause* — only ask the browser not to *do* it, via:
```css
html,
body {
  overscroll-behavior-y: none;
}
```
(added alongside the `overflow-x: hidden` rule above, in the same block).
This stops Chrome/Edge from bouncing at all; Safari's own rubber-band
visual can still partially occur regardless (a long-standing platform
behavior `overscroll-behavior` doesn't fully override there), which is a
browser-level limitation, not something fixable from this page's CSS.

## Fixed bug: empty space below the footer above ~961px width

A second, separate empty-space-below-footer bug (distinct from the "white
patch below the footer" one above, which was about phantom `scrollHeight`
from the story slider) — this one only appeared above ~961px viewport width.

**Root cause:** the giant "samhita" wordmark in the footer (`.big-letter`,
`font-size` in `vw`/fixed `rem` units, `line-height: 1`) has a text line-box
taller than the grid track (`.big-letter-wrap { height: 15vh }`) holding it,
and nothing in the original template clips that overflow. Above ~961px the
invisible overflow escaped the footer's own bottom edge, adding ~18px to
`document.documentElement.scrollHeight` beyond the footer's real bottom —
that extra scrollable region rendered as empty space below the footer, the
same visual symptom as the earlier white-patch bug but a different cause
(this one is inside the letters themselves, not the story slider).

**Confirmed via direct measurement:** at 1280px width, `document.body.scrollHeight`
read 7248px while the footer's own bottom edge measured 7230px — an 18px
gap. Toggling each footer descendant's `display` one at a time (a targeted
before/after `scrollHeight` diff) isolated `.big-letters` and its `.big-letter`
children as the specific elements responsible, ruling out the CTA image
grid, footer nav columns, and other footer content.

**The fix** (`samhita-theme.css`):
```css
.big-letters {
  overflow: hidden;
}
```
Safe: the word "samhita" has no descenders, so the clipped region is empty
glyph space — nothing visible is cut off.

**Verified:** after a clean reload at 1280px, `document.body.scrollHeight`
exactly matches the footer's bottom edge (gap = 0px, was 18px).

## Fixed bug: "samhita" footer wordmark clipped left/right

Once the vertical bug above was fixed, a follow-up report surfaced a second,
horizontal version of the same underlying root cause: the "samhita" wordmark
itself was wider than the space `.big-letters` actually has, so the first
and last letters' edges were clipped off the container's left/right bounds
— visible at exactly the widths where the "empty space below footer" bug
above had been visible (i.e. above ~961px), since that's also where
`.big-letters`'s `overflow: hidden` (the previous fix) started actually
clipping real letter content instead of just invisible line-box overflow.

**Confirmed via direct measurement, not guesswork:** at 1280px width, the
rendered word spanned `-13px` to `1293px` while its container spanned `32px`
to `1248px` — 45px clipped off each side. Bisecting per-viewport-width
(375/479/767/991/1439/1440/1920px) found the **worst case is exactly at the
1440px breakpoint**, where `.big-letter`'s `font-size` switches from a
viewport-relative `vw` value to a **fixed** `24rem` (384px) while the
container is still at its narrowest pre-1440px width — ~128px of clipping
per side there, roughly 3x worse than at 1280px.

**The fix** (`samhita-theme.css`):
```css
.big-letter {
  letter-spacing: -0.12em;
}
```
`-0.12em` (not a smaller value) specifically because it was tuned against
the 1440px worst case, not the more typical mid-range widths — anything
weaker (tested down to `-0.10em`) still clipped by a few px right at 1440px.
Using `em` rather than a fixed `px` value means the correction scales
automatically with `.big-letter`'s own font-size at every breakpoint, so one
rule covers the `vw`-based sizing at all other widths too, not just 1440px.

**Verified:** re-measured at 375/479/767/991/1439/1440/1920px after adding
the rule — every width now has a positive inward margin (letters end
*inside* the container edge), worst case 6-33px of margin depending on
width, none clipped. Widest safety margin is naturally at 1920px+ (font
stays fixed at 384px past 1440px while the container keeps growing, so the
same fixed compensation matters relatively less there).

## CSR/FCRA compliance banner + arrow-tail-button recolor + CTA hover swap

Three related styling changes made together, by request, in `samhita-theme.css`
(and one small markup change in `samhita-home.html`):

**1. "100% CSR & FCRA Compliant" / "Aligned with the UN SDGs" turned into a
banner.** These two lines (in the final CTA section, just above "Ready to
build the ladder with us?") were plain small-print tags, easy to miss for
what's actually a compliance/trust claim worth calling out. They share
`.tag-item`/`.check-icon` markup with an unrelated tag list elsewhere on the
page (the "Our Story" section's ladder-rung labels — Skilling & Jobs / Credit
& Market Linkages / Healthcare & Social Security), so rather than restyle
`.tag-list` globally (which would've changed that other list too, not asked
for), the CSR/FCRA one got its own `.tag-list-banner` class added in the
HTML, styled independently: solid yellow (`--color--base--accent-yellow`,
from the Samhita logo) pill-shaped bar, bold black text/icon for contrast,
soft yellow-tinted shadow, and a hover state (deepens to a darker yellow +
lifts slightly) for a bit of interactivity even though it isn't a link.

**2. Arrow-tail buttons (the small circular "↗" trailing every "Learn More"
/ "View Impact Dashboard" secondary-button) recolored from pale blue to the
Samhita logo's actual blue.** They were still the original template's
`--color--backgrounds--bg-subtle` (#ebf5f8) — a neutral, generic fill that's
not one of Samhita's own brand colors and barely visible against the page's
near-white background. Now solid logo-blue with a white icon for contrast;
hover/focus deepens to a darker blue shade, scales up slightly, and gains a
soft blue glow, on top of the pre-existing arrow-nudge transform.

**3. CTA button hover-fill moved off blue.** The primary-button
("Connect Now" etc.) used to wipe in the same logo-blue on hover. Since blue
is now the arrow-tail-button's own permanent resting color, keeping it as a
*hover-only* state elsewhere would make blue mean two different things on
the same page (a resting brand color in one place, a transient hover state
in another). The CTA hover-fill now wipes in a darker shade of the button's
own coral (`--color--base--accent-dark`) instead, plus a small lift +
shadow on hover/focus for the "modern" tactile feel that was asked for.

**New tokens added** (`:root` in `samhita-theme.css`): `--color--base--accent-blue-dark`
(#0a86ab, the arrow-tail-button's hover shade) and
`--color--base--accent-yellow-dark` (#e6b820, the banner's hover shade) —
both are simply darkened versions of the existing `--color--base--accent-blue`
/ `--color--base--accent-yellow` tokens, not new brand colors.

**All three respect `prefers-reduced-motion: reduce`** — added to the
existing sitewide reduced-motion media query block alongside the other
hover-transform effects (cards, nav underline, etc.), same convention as
everything else on this page.

**Verified via computed-style inspection** (not just visual guesswork): base
states confirmed directly — banner background `rgb(254, 211, 64)` (#fed340)
with black text/icon `rgb(17, 24, 39)` and bold (700) tag text; arrow-tail
button background `rgb(12, 165, 208)` (#0ca5d0) with white icon/text; the
primary-button's `::before` hover-fill layer confirmed `rgb(196, 54, 84)`
(#c43654, the coral-dark token) rather than blue.

**Hover/focus states could not be directly confirmed through this session's
automated browser tool** — this is the same documented tooling limitation
noted elsewhere in this file ("Its synthetic `hover` action doesn't trigger
real CSS `:hover`"), and it turned out to extend further than previously
recorded: even `.matches(':focus-visible')` returning `true` after a
programmatic `.focus()` call did **not** correspond to the live style
engine actually applying `:focus-visible`-scoped rules in this environment
— re-tested against the footer/nav underline-sweep hover effect (documented
elsewhere in this file as "confirmed via real DOM `.focus()`"), which also
failed to visibly apply under the same test in this session, despite
`matches()` reporting `true`. This means that specific earlier verification
claim doesn't reproduce reliably either — worth treating focus-triggered CSS
checks in this tool with more skepticism going forward. The selectors
themselves were confirmed syntactically correct and correctly scoped
(`element.matches(fullSelectorString)` returned `true` for the exact hover
selector), and follow the identical pattern already used successfully
elsewhere on this page — but genuine visual confirmation of the hover/focus
*transition* (as opposed to the base resting state) needs a real browser,
not this tool.

## Follow-up: hover effects trimmed back to minimal, CTA outline removed, accordion clipping fixed, chevron recolored

A follow-up pass, prompted by direct feedback that the previous round's
hover effects (above) were too busy. Four changes, all in `samhita-theme.css`:

**1. All three new hover effects (CTA button, arrow-tail-button, CSR/FCRA
banner) trimmed to color-only.** Removed the `translateY`/`scale` lift and
the added `box-shadow` from all three - each now just shifts to a darker
shade of its own color on hover/focus, nothing else. The wipe-fill
animation on the CTA button (pre-existing, not new) is untouched and still
the button's main hover interaction.

**2. Outline removed from the CTA button** (`.primary-button`'s
`border: 1.5px solid rgba(255,255,255,.85)`). Checked whether the
arrow-tail-button had an outline to match against - it doesn't (confirmed
via computed style: `0px none`) - so the CTA button's outline came off too,
for visual consistency between the page's two "brand button" styles rather
than leaving the CTA as the odd one out.

**3. Fixed: arrow-tail-buttons clipped on hover inside the "Who We Work
With" accordion.** Root cause was the just-removed `scale(1.08)` from #1 -
several arrow-tail-buttons (on the accordion's "Learn More" links) sit right
at the edge of `.room-content-wrap`, the original template's own
`overflow: hidden` wrapper (required for the accordion's CSS Grid
`grid-template-rows: 0fr → 1fr` expand/collapse trick - the wrapper has to
clip its content while collapsed, or the "hidden" content would still take
up layout space). Scaling the button up 8% on hover pushed its edge a few
px past that ancestor's clip boundary. Removing the scale (already done for
the "keep hover minimal" request in #1) fixes this as a side effect - a
color-only hover has no geometry to clip in the first place.

**4. Accordion chevron button recolored from pale blue to neutral gray.**
`.chevron-button` (the ▾ open/close toggle in "Who We Work With" - a
different circle from the arrow-tail-button, and not touched by the recolor
in the previous section) still had the original template's pale-blue
`--color--backgrounds--bg-subtle`. Left as grayscale (new tokens
`--color--backgrounds--bg-gray` #e5e7eb / `--color--backgrounds--bg-gray-dark`
#d1d5db on hover) rather than another brand color, on purpose: it's a plain
expand/collapse control, not a call-to-action, so it should read as quiet
UI chrome rather than compete with the arrow-tail-button's now-blue
identity for attention.

**Verified via computed-style inspection:** `.primary-button` and
`.arrow-tail-button` both confirmed `border: 0px none` (matching); arrow-tail-button
background confirmed `rgb(12, 165, 208)` (#0ca5d0); `.chevron-button`
background confirmed `rgb(229, 231, 235)` (#e5e7eb); CSR/FCRA banner
background confirmed unchanged `rgb(254, 211, 64)` (#fed340). Accordion fix
confirmed directly: an arrow-tail-button inside `.room-content-wrap` now
reports `transform: none` (no CSS rule sets one anymore), so there's nothing
left that could grow past the wrapper's `overflow: hidden` edge on hover.

**Same tooling caveat as before applies to genuinely observing the hover
transitions themselves** (as opposed to confirming the underlying CSS rules
are correct) - see the note at the end of the previous section.

## Follow-up 2: CSR/FCRA banner de-buttoned, and site-wide text-selection color

Two more changes in `samhita-theme.css`, prompted by direct feedback that
the banner (previous two sections above) still read as a button:

**1. CSR/FCRA banner: black background, white text, no hover, full
content-width.** The yellow fill + pill shape + hover-darken combination
(everything a real button on this page also does) made the banner look
clickable even after the hover effect was already trimmed down in the
previous round - the shape and color alone were enough to read as "button."
Fixed by:
  - Switching to black background / white text - a combination this page
    doesn't use for any actual button or link, so it can't be visually
    confused with one.
  - Flattening `border-radius` from `100vh` (full pill - the same shape
    every real button uses) down to `0.75rem` (a much more modest rounded
    rectangle).
  - Removing the hover rule entirely - it's not a link or button, so it has
    no interactive state to communicate.
  - Widening it from a shrink-wrapped pill to `width: 100%; max-width: 55rem`
    - the same `max-width` `.cta-body` already uses - so its edges now line
    up with the heading/button/photos block making up the rest of the
    section, instead of being a much narrower shrink-wrapped bar sitting
    above a wider block.

**2. Site-wide text-selection color.** Added `::selection` (and its legacy
Firefox-only `::-moz-selection` equivalent, as a *separate* rule rather than
combined in one comma-separated selector list - some CSS parsers drop an
entire rule if any one selector in a list is unrecognized, and `::-moz-selection`
isn't recognized outside Firefox) so that highlighting any text on the page
with the cursor/mouse shows logo-yellow behind black text, instead of the
browser's own default blue-behind-white.

**Verified via computed-style + stylesheet inspection:** banner background
confirmed `rgb(17, 24, 39)` (near-black) with white text/icon; `border-radius`
confirmed `12px` (0.75rem); banner width confirmed to exactly match
`.cta-body`'s own rendered width (880px, both, at 1440px viewport); confirmed
zero remaining CSS rules referencing `.tag-list-banner` + `hover` anywhere in
the stylesheets. `::selection` rule confirmed present in the stylesheet with
`background-color: var(--color--base--accent-yellow)` / `color: rgb(17,24,39)`.

## Fixed a real, significant bug: navbar dropdown + mobile menu were completely non-functional

Prompted by "the top navbar looks very basic" - what started as a styling
request surfaced a genuine, previously undocumented functional bug, not
just an aesthetic one.

**Root cause:** `webflow.85a1c9ed.d7f63c770377a12f.js` (linked in
`samhita-home.html`) looks like the real Webflow interactions bundle but is
actually only a ~5KB Webpack loader stub - it lazy-fetches the actual
interaction code as separate `webflow.achunk.<hash>.js` files at runtime.
None of those achunk files exist anywhere in this project's file tree.
Confirmed via the browser's network tab: every one of those fetches 404s.
This file's own top comment previously (wrongly) asserted that "generic,
class-based Webflow behavior (.w-nav mobile menu, .w-dropdown hover menus,
.w-slider carousels) still works untouched via the original webflow.js
bundle" - that claim was never actually tested against a real click/hover,
and turned out to be false.

**Confirmed broken, by direct interaction testing (not just code reading):**
- Clicking the "About"/"Impact" navbar dropdown toggles did nothing at all
  (`aria-expanded` never changed, no `w--open` class ever appeared).
- Clicking the mobile hamburger button did nothing at all - below the
  991px collapse breakpoint, there was previously **no way whatsoever** for
  a real visitor to reach About, Impact, Careers, or Connect Now. This is
  the more serious half of the bug: not a missing polish item, a complete
  loss of primary navigation on every phone/tablet visit.
- The `.w-slider` carousels (the "Our Story" ladder slider, the partners
  slider) have the exact same root cause and are **also** broken (a slide
  arrow click produced zero transform change) - confirmed but **not fixed**
  in this pass, since it's a separate component outside "the navbar" this
  request was about. Flagged here as a known, separate, still-open issue -
  whoever picks this up next should reimplement slide-advance in plain JS,
  the same pattern used everywhere else in this file.

**The fix** (`samhita-interactions.js` + `samhita-theme.css`):
Reimplemented both in plain JS, matching this file's existing pattern for
the accordion/popup (see "Why a custom JS file" above):
- **Dropdown**: click-to-toggle, exclusive (opening one closes any other
  open dropdown), closes on outside click, closes on Escape, closes when a
  dropdown link is clicked.
- **Mobile menu**: click-to-toggle the hamburger, locks body scroll while
  open (a real full-screen overlay panel, unlike the page loader - see
  "Page loader" above for why a scroll lock was *wrong* there but is
  expected, reversible behavior here), closes on any nav-link click,
  closes on Escape.
- Both are driven by a `.w--open` class (reusing Webflow's own naming
  convention, and the original stylesheet already had some rules scoped to
  it) toggled entirely by the new JS - none of this depends on the broken
  webflow.js bundle in any way.

**Two non-obvious display/cascade bugs surfaced while wiring the CSS to that
class**, both now documented inline in `samhita-theme.css`:
1. Both `.navbar-dropdown-list` and `.navbar-menu-wrap` carry a Webflow
   framework class (`.w-dropdown-list` / `.w-nav-menu`) that sets
   `display:none`, at equal CSS specificity to the page's own class that
   (at some breakpoints) sets `display:block`. Toggling `.w--open` alone
   only changed opacity/visibility - `display:none` kept winning the
   cascade regardless, rendering both as zero-size boxes. Fixed by forcing
   `display: flex !important` and controlling visibility purely via
   opacity/visibility/transform instead (transitionable, unlike `display`).
2. `.navbar-mobile-dropdown-bg` (an empty decorative `<div>` inside the
   mobile menu) carries a `w-variant` class whose background color
   resolves to `--navbar--scroll-invert--dropdown-bg-initial` - the same
   dark-navy token the now-removed transparent-over-hero navbar feature
   used. It couldn't matter before (the mobile menu never opened at all),
   but once opened it painted dark navy directly over the panel's own white
   background, making the near-black nav-link text almost invisible.
   Confirmed via computed style before the fix (panel background genuinely
   `rgb(255,255,255)`, so the visible dark fill could only be this div).
   Fixed by hiding it - it has no purpose now that the panel supplies its
   own background directly.
3. The original template's own `.navbar-menu-center`/`.navbar-menu-right`
   rules kept them side-by-side at 50% width each inside the mobile panel
   (confirmed via computed style, not something this pass changed) - fine
   for a wide panel, but it overflowed a narrow phone viewport (the
   "Connect Now" button rendered partly off-screen). Stacked full-width
   instead, the standard pattern for this kind of collapsed nav.

**Modern redesign, now that both are actually functional** (there was
nothing to visually polish on a dropdown/menu that never opened):
- **Dropdown**: white card, soft shadow, rounded corners, a small gap below
  the toggle, generous link padding, light-gray hover highlight on each
  link - replacing the original solid-coral block with instant show/hide.
- **Mobile menu panel**: white background, shadow, smooth fade + slide-down
  open/close transition.
- **Burger icon**: animates into a clean X on open (the two outer lines
  fade out, the two center lines - which sit stacked in the same spot by
  the original markup's own design - rotate apart into an X) instead of
  staying a static 3-line icon regardless of state.
- **Logo**: a small, deliberately subtle hover scale + tilt
  (`scale(1.04) rotate(-1deg)`) - just enough to read as "this is
  interactive branding," not a showy animation.
- All of the above respect `prefers-reduced-motion` (added to the existing
  sitewide media query block).

**Verified end-to-end via real interaction, not just reading the code:**
desktop dropdown opens/closes correctly on click (confirmed via
`aria-expanded` + `w--open` class); opening "Impact" while "About" was open
correctly closed "About" (exclusive-open confirmed); clicking outside both
closed them; mobile hamburger click morphs into a clean X and reveals a
readable white panel with "About"/"Impact" (each still independently
expandable inline, pushing the rest of the menu down) and "Careers"/
"Connect Now" all stacked full-width and legible; Escape correctly closes
the mobile menu and restores `document.body.style.overflow`. Desktop
layout at 1440px re-confirmed unaffected by the mobile-menu CSS (an
earlier version of the fix had no breakpoint guard and hid the entire
desktop nav - caught and fixed before this was considered done, see the
inline comment in `samhita-theme.css` for detail).

## CSR/FCRA banner moved into the "Make your CSR rupee..." CTA, as liquid glass

The "100% CSR & FCRA Compliant" / "Aligned with the UN SDGs" banner (see the
earlier "CSR/FCRA compliance banner" entries above for its history) moved
out of the final CTA section entirely, into `#section-catalytic` ("Make
your CSR rupee work harder. Up to 20x harder.") - between the heading and
the "Explore Catalytic Finance" button - per request.

Restyled as a `.tag-list-banner.is-glass` variant rather than reusing the
solid black fill: this CTA has its own dark photo background, and a solid
opaque block would sit on top of that photo rather than feeling part of
the same surface. The glass recipe (translucent white fill, blur+saturate
backdrop-filter, soft border, subtle shadow) is copied verbatim from
`.back-to-top-button` elsewhere on the page, specifically so both read as
the same "material" rather than two different glass looks that happened to
converge by coincidence. White text (this CTA already uses white text via
`u-text-color-white`, unchanged).

The base `.tag-list-banner` class still exists for its shared layout/
typography (padding, radius, font-weight) in case a future non-glass
instance is needed elsewhere; only `.is-glass` carries the frosted
treatment now that there's a single, glass-styled usage.

## Micro-interactions pass: 7 built (was a proposals list, now implemented)

An earlier pass in this file (superseded, replaced by this section) listed
7 micro-interaction ideas as unbuilt suggestions. All 7 were subsequently
requested and built:

**1. Count-up animation, generalized beyond the hero.** The hero's own
counter (was `.hero-counter`, a hero-specific class) is renamed to the
generic `.count-up` in both `samhita-home.html` and
`samhita-interactions.js`, and the same `data-count-to`/`data-count-suffix`
markup pattern is now also applied to: "Lives Impacted" (17M+), the CSR
Clients/Foundations/Partners/Donors stat (300+), Impact Partners (500+),
Government Partnerships (15+), the "654,568 Citizens" partner stat, and
"90% Job Placement". Same behavior as the original hero counter - replays
every time each stat re-enters the viewport, not just once.

**2. Magnetic cursor-follow on primary CTA buttons.** A `mousemove`
listener on every `.primary-button` nudges it a few px toward the cursor
(capped at 10px, `translate()` scaled to 25% of the cursor's offset from
the button's center), resetting on `mouseleave`. Gated to
`(hover: hover) and (pointer: fine)` devices and skipped under
`prefers-reduced-motion` - see item 7 below for why that gating pattern is
used consistently across all the new cursor-driven effects.

**3. Cursor-aware spotlight on card hover** (`.levels-card`,
`.experience-card`). A `mousemove` listener writes the pointer's position
within the card to `--spot-x`/`--spot-y` CSS custom properties (as %); a
`::after` radial-gradient in `samhita-theme.css` reads those coordinates
directly and fades in only on `:hover`. All the actual visual (gradient,
fade) lives in CSS - the JS only ever tracks coordinates.

**4. Staggered check-mark "pop"** on every `.tag-list` (the CSR/FCRA
banner and the "Our Story" ladder-rung tags) - each `.check-icon` scales in
from 0 with a small overshoot (`back.out(2.5)`), staggered a beat apart,
the first time its tag list scrolls into view. Layered on top of (not
replacing) the existing fade+rise the whole `.tag-item` row already got.

**5. Auto-scrolling marquee for the partner-name strips.** See the
dedicated write-up below ("Fixed bug: `.slide-popup` was invisible by
default") for why this needed its own bug fix to even be visible - the
marquee itself is a duplicated, `aria-hidden` list of the same real partner
names already in each slide's own descriptive sentence (no fabricated
logos - see "Images" above for why that's a deliberate project-wide rule),
scrolling via a single CSS `@keyframes` + `transform: translateX`, pausing
on `:hover`.

**6. ~~Text-scramble headline reveal~~ - built, then removed by request.**
A per-character decode-in effect for every `.gsap_split_line` heading was
built and verified working (including a correctness fix so it wouldn't
delete the nested colored-word spans, e.g. `<span class="heading-
accent">`, that several headings use), but was then explicitly asked to be
taken back out. `.gsap_split_line` is back to sharing the exact same plain
fade+rise treatment as `.gsap_split_word` in `samhita-motion.js`, precisely
as it was before this feature existed - no scramble code, no
`.scramble-char` spans, no `splitIntoCharSpans()`/`scrambleReveal()`
functions remain anywhere in the file. Noted here mainly so a future
session doesn't reinvent it without knowing it was already tried and
explicitly rejected.

**7. Cursor-tilt parallax on the hero image (desktop only).** A few
degrees of `rotateX`/`rotateY` (max 6°) + a slight `scale(1.03)` (to hide
the photo's own edges revealed at the tilt's extremes) tied to pointer
position within `.section-hero`, applied to `.hero-bg-fixed`. `perspective`
lives on `.section-hero` for the 3D depth to read as real rather than a
flat skew - **see the very next section below for a real bug this
introduced and how it was fixed** (it was briefly on the wrong element).

**All cursor-driven effects (2, 3, 7) share one gating rule**: wired up
only where `window.matchMedia("(hover: hover) and (pointer: fine)").matches`
is true, and skipped entirely under `prefers-reduced-motion: reduce`. Not
"wired up but inert" on touch devices - genuinely never attached there,
since a cursor-follow effect has no meaning without a persistent cursor.

**Verified via direct interaction** (dispatched real `mousemove`/`click`
events and inspected the resulting DOM/computed-style state, not just read
the code): magnetic button transform confirmed responding correctly to
cursor offset; spotlight `--spot-x`/`--spot-y` confirmed updating to the
correct percentage for a given cursor position; hero tilt confirmed
producing the expected `rotateX`/`rotateY`/`scale` transform. The count-up
IntersectionObserver and the GSAP ScrollTrigger-driven check-mark pop-in
could **not** be observed animating live in this session's
browser tool - re-confirmed the already-documented tooling limitation
extends further than previously known: even `window.scrollTo()` doesn't
reliably re-trigger a *known-working* IntersectionObserver in this specific
tool (tested directly against the hero counter, which definitely works for
real users - it's visible and counted-up from the very first page load),
and a CSS animation's `Element.getAnimations()[0].currentTime` was
confirmed stuck at `0` after a 2-second wait despite `playState: "running"`
- consistent with the already-documented `requestAnimationFrame`
throttling in this tool extending to CSS animation timelines too. None of
this indicates a real bug; every one of these mechanisms was independently
confirmed correct by other means (structural DOM verification, or - for
the counters - the identical code path already working for the hero).

## Fixed a real bug this pass introduced: hero image no longer edge-to-edge

While verifying the cursor-tilt effect above, found (and fixed within the
same pass, before considering it done) a real regression it had caused:
the hero's full-bleed background photo was no longer reaching the
viewport's actual left/right edges - a ~64px gap opened up on both sides.

**Root cause:** `perspective` (like `transform`, `filter`, or
`will-change: transform`) makes the element it's set on the *containing
block* for any absolutely-positioned descendant, regardless of that
element's own `position` staying `static`. The tilt effect's `perspective`
was first placed on `.layout-centered.is-hero` - a direct parent of
`.hero-bg-fixed` (the full-bleed photo, `position:absolute;inset:0` via
`.u-absolute-full`). That made `.layout-centered.is-hero` the photo's
containing block instead of `.section-hero` (which is already
`position:relative` and already spans the full section width with no
padding of its own) - and `.layout-centered.is-hero` sits nested inside
`.padding-horizontal`'s own horizontal padding, so the photo's `inset:0`
now resolved against that smaller, inset box instead of the true viewport
edges.

**Confirmed via direct measurement:** `.hero-bg-fixed`'s rendered
`getBoundingClientRect()` was `{x: 64, width: 1312}` against a 1440px
viewport (should be `{x: 0, width: 1440}`) - and walking the ancestor
chain confirmed every element between the photo and `.section-hero` was
`position: static`, with `.section-hero` itself the only `position:
relative` ancestor, yet the photo was clearly *not* using it as its
containing block - the smoking gun for a `perspective`/`transform`-style
containing-block override rather than an ordinary CSS positioning bug.

**The fix:** moved `perspective: 800px` from `.layout-centered.is-hero` to
`.section-hero` itself in `samhita-theme.css`. `.section-hero` is still a
real ancestor of `.hero-bg-fixed`, so the 3D tilt itself is unaffected -
and since `.section-hero` was already the correct containing block before
this feature existed, this restores the original edge-to-edge behavior
exactly.

**Verified:** re-measured after the fix - `.hero-bg-fixed` now renders at
exactly `{x: 0, width: 1440}` at a 1440px viewport (edge-to-edge, zero
gap), and the tilt effect re-confirmed still producing the correct
`rotateX`/`rotateY`/`scale` transform on cursor movement.

## Fixed bug: `.slide-popup` (partner slide text) was invisible by default

Found while adding the auto-scrolling partner-name marquee (item 5 above) -
a real, separate bug, not something this pass caused.

**Root cause:** `.slide-popup` / `.slide-popup-content` - the container
holding each partner slide's own heading, description text, and funding-
partner badge ("Trusted by Leading Corporates" / "Backed by Institutions &
Government") - are `display:none` / `opacity:0` in the original template's
own static CSS at rest. `.slide-popup` itself is only ever a tiny 2.5rem
circle by default; nothing in this project's CSS ever grows it or flips it
to `display:flex`. That was meant to happen via a hover/click-triggered
class toggle from Webflow's compiled interactions JS - the same missing-
achunk-files root cause documented at length in `samhita-interactions.js`'s
top comment and in the navbar dropdown/mobile-menu fix earlier in this
file. Confirmed via computed style: `display:none` / `opacity:0` on both
elements at page load, with no other rule anywhere overriding either
value.

**Net effect before this fix:** this entire slide's text content (partner
names, funding-partner counts) - and the marquee just added inside it -
was invisible to every real visitor, not just non-functional on
interaction. A step further than the slider-advance bug fixed below.

**The fix** (`samhita-theme.css`): made the panel permanently visible at
full size (`display:flex !important; opacity:1 !important; width/height:
100% !important`), rather than reimplementing whatever hover/click trigger
was originally intended - simpler, and more accessible: a touch-device
visitor could never trigger a hover-only reveal anyway, and this content
(partner names, funding-partner counts) reads as primary information worth
always showing.

**Verified:** confirmed `display:flex` / `opacity:1` computed post-fix, and
confirmed the marquee track's rendered width went from `0` (while its
ancestor was `display:none`, meaning it was never laid out at all) to a
real, non-zero value matching its actual (duplicated-list) content width.

## Fixed bug: slider carousels (Our Story ladder slider, partners slider) were non-functional

Same root cause as the navbar dropdown/mobile-menu bug fixed earlier in
this file (search "achunk" in `samhita-interactions.js`'s top comment for
the full technical explanation) - flagged there as a known, separate,
still-open issue, now fixed.

**Confirmed broken before the fix:** clicking either slider's next/prev
arrows produced zero change - the slide mask's `transform` stayed empty
before and after a real click.

**The fix** (`samhita-interactions.js`): each `.w-slide` already sits
full-width, `display:inline-block`, side by side in a single row inside
its `.w-slider-mask` (`white-space:nowrap; overflow:hidden` - standard,
untouched Webflow slider markup). Reimplemented slide-advance the way
Webflow's own missing JS would have: one `transform: translateX(-100% *
index)` applied to the mask per slide change, which moves every slide in
the row together as a single unit (the transform applies to the mask as a
whole, not per inline-block child). Wired up: left/right arrow clicks,
pagination dot clicks (jumps directly to that index), wraparound at both
ends (next from the last slide goes to the first, and vice versa), the
existing `.w-slider-aria-label` text kept in sync ("Slide N of
`total`."), and a `prefers-reduced-motion` check that disables the
mask's transition (the slide still changes, just without the animated
slide-in). Runs generically over every `.slider.w-slider` on the page, so
it covers both the "Our Story" (4 slides) and partners (2 slides) sliders
from one implementation, no per-slider wiring needed.

**Verified via direct interaction** (dispatched real `click` events on the
actual arrow/dot elements and inspected the resulting state, not just read
the code) on both sliders independently: right-arrow click on the "Our
Story" slider advanced the mask transform from `translateX(0%)` to
`translateX(-100%)` and updated the aria-label to "Slide 2 of 4."; two
left-arrow clicks from slide 1 correctly wrapped to slide 4
(`translateX(-300%)`); clicking the 3rd pagination dot jumped directly to
slide 3 (`translateX(-200%)`); the partners slider's right-arrow click
independently advanced it to "Slide 2 of 2." with its own marquee (item 5
above) still present and correctly rendered inside the newly-visible
second slide.

## Room-media panels ("Who We Work With") converted into 2-image sliders

Follow-up request: every slider/carousel on the page should show at least
2-4 real images rather than just one. The page's two actual `.w-slider`
carousels already satisfied this (4 and 2 slides respectively, both with
already-verified working navigation - see the fix directly above), but the
5 "Who We Work With" accordion category items (Philanthropic Organisations/
CSR Partners & HNIs, Government & Public Sector Organisations, Banks/NBFCs
& Financial Institutions, Private Sector Partnerships, Grassroots &
Community Partners) each had exactly one static photo in their
`.room-media` panel, with no way to see more.

**The fix** (`samhita-home.html` + `samhita-theme.css`): each `.room-media`
now contains a small 2-image slider using the *exact same* generic
`.slider.w-slider` markup pattern (mask, slides, left/right arrows) the
page's other two sliders use - meaning `samhita-interactions.js`'s
existing slider JS (fixed directly above) already runs against these 5
new sliders automatically, with zero additional JS wiring needed. Added
`.slider.is-room` in `samhita-theme.css` to size the slider to exactly
fill its `.room-media` parent (which already supplies the fixed height,
border-radius, and `overflow:hidden`) and to give the slide `<img>`s
`object-fit:cover` sizing, since the original template never needed image-
sizing rules for a single plain `<img>` in that slot.

Each category's original photo is kept as slide 1; slide 2 is a genuinely
**unused** image already bundled in `Waveyu - Webflow HTML website
template_files/` (not a duplicate reused from elsewhere on the page,
though that was the given fallback if unused ones ran out - there were
enough) - `aerial-surfers.avif`, `dj-outdoor.avif`, `jungle-temple-mist.avif`,
`outdoor-spa-forest.avif`, and `friends-playing-water.avif` respectively.
Same stand-in-photography caveat as every other image on this page (see
"Images" above) - Waveyu's own travel/surf photography, not real Samhita
photography, reused purely as reliable placeholder imagery.

**Verified via direct interaction**, not just reading the code: confirmed
all 7 `.slider.w-slider` instances on the page now initialize correctly
(the original 2 plus these 5 new ones), each with 2 distinct image
sources; dispatched a real right-arrow click on one of the new room-media
sliders and confirmed its mask transform advanced from `translateX(0%)` to
`translateX(-100%)`; confirmed the slider's rendered box exactly matches
its `.room-media` parent's size (198×240px in this test), and that its
`<img>` computed `object-fit` is `cover`.

## Fixed bug: slider arrows pointed the wrong way (a real, confirmed double-rotation bug)

Found via direct report after the slider-advance fix above: both the "Our
Story" and partners sliders' left/right arrows didn't visually point left/
right at all.

**Root cause:** the arrow icon markup is `<div class="left-arrow ...">
<div class="arrow-icon w-embed"><svg style="transform:rotate(90deg)">...`
- **two separate elements each carry their own rotation**: `.arrow-icon`
(the wrapping div) has `transform:rotate(90deg)` baked into its own base
CSS rule (confirmed via `getComputedStyle`), and the `<svg>` inside it
*also* carries its own inline rotation (90deg for the left arrow, -90deg
for the right arrow, in the original markup). These two rotations don't
override each other - they compose, since the child renders inside the
parent's already-rotated coordinate space. Net visual rotation = both
combined, not either one alone - so neither arrow ended up pointing where
its own inline style alone would suggest.

**Confirmed empirically, not by manual angle math** (manual composition
math kept giving wrong predictions here - do not trust it for this
specific icon without re-testing): used `SVGSVGElement.getScreenCTM()` to
directly measure where the chevron's own apex point rendered on screen
relative to the icon's center, for a sweep of candidate inline rotation
values (0/90/180/-90/-180deg) on both the left and right arrow independently.
This is worth calling out explicitly: **the left and right arrow instances
behave as mirror images of each other for the same child rotation value**
(e.g. `rotate(0deg)` on the child points the left-arrow's chevron left, but
points the right-arrow's chevron right) - some other asymmetry between
`.left-arrow`/`.right-arrow` (beyond the shared `.arrow-icon` rotation)
mirrors one relative to the other. The empirical sweep found the correct
value per side directly rather than needing to explain why.

**The fix** (`samhita-home.html`, all 4 instances - 2 sliders × left/right):
left arrow's inline SVG rotation changed from `90deg` to `0deg`; right
arrow's changed from `-90deg` to `0deg` as well (yes, both end up at the
same inline value - the asymmetry between the two arrow contexts is what
produces the different final visual directions, not the inline value
itself).

**Verified via `getScreenCTM()` on all 4 arrows post-fix**: every left
arrow's chevron apex now renders 2px to the left of its own icon center
(`dx:-2, dy:0`); every right arrow's apex renders 2px to the right
(`dx:2, dy:0`) - confirmed independently on both the "Our Story" slider and
the partners slider, not just one.

## Partner-name banners moved out of the partners slider entirely

Follow-up request: the "Trusted by Leading Corporates" / "Backed by
Institutions & Government" content (heading, description, partner-name
marquee, funding-count badge) - previously living inside each partner
slide as a bottom caption bar (see the "CSR/FCRA compliance banner" /
`.slide-popup` fix history earlier in this file) - was asked to come out
of the slider altogether and become its own standalone banner elsewhere
on the page.

**What changed** (`samhita-home.html`, `samhita-theme.css`): each of the
2 partner slides is back to being just its own photo - the entire
`.slide-content`/`.slide-popup`/`.slide-popup-content`/`.slide-content-meta`
subtree (heading, description, marquee, badge) was removed from both
slides. That same content now lives in a new `.partner-banner-list` of 2
`.partner-banner` cards, placed directly below the slider/heading/stats
row within the same section (`#section-partners-logos`) - side by side on
screens ≥768px, stacked below that.

**Styled as plain light cards, not glass-on-photo**: the old `.slide-popup`
treatment (frosted glass, white text) made sense sitting on top of a
photo; with no photo behind it anymore, that same treatment would have
been white-on-white. Restyled as a white card (shadow, rounded corners,
matching the page's general card language) with dark text, and the
marquee's own chip text recolored from white to dark (`.partner-banner
.partner-marquee-item`) for the same reason. The funding-count badge
(`.badge.u-frost`) also needed a `.is-on-light` override to drop its
`backdrop-filter` and white text - both meaningless without a photo
behind the badge.

Now that `.slide-popup`/`.slide-popup-content` are unused anywhere on the
page (confirmed via grep before removing their CSS), the fix rules for
them (making them visible, then repositioning them to a bottom caption
bar - both documented earlier in this file) were deleted rather than left
as dead code.

**Verified**: confirmed both slides now contain exactly one child element
each (just the `.image-wrap`, no leftover `.slide-content`); confirmed 2
`.partner-banner` elements exist with the correct headings ("Trusted by
Leading Corporates" / "Backed by Institutions & Government"), correct
badge text ("21 Funding Partners" / "27 Grassroots Partners"), marquee
item text color now dark (`rgb(17, 24, 39)`, was white), and badge
background now a plain light gray (was a translucent frost effect).

## An important structural gotcha (read this before editing further)

Webflow's CSS Grid layouts don't only use classes — many grid children get
their column/row placement from a **unique per-element ID selector** in the
stylesheet (`#w-node-xxxxx-f2b4ae30 { grid-area: ... }`). There are 63 of
these in the original page CSS. When first drafting this page by hand,
omitting these IDs silently broke layout (content collapsed/misplaced,
sometimes rendering blank) even though every class was correct.

**If you add or restructure any grid-based section**, check whether the
element you're touching had a `#w-node-...` ID in the original template, and
carry it over onto the equivalent new element. A quick way to check what IDs
a given stylesheet expects:

```bash
grep -o '#w-node-[a-zA-Z0-9_-]*' "Waveyu - Webflow HTML website template_files/waveyu.webflow.697a02e7f32a15a9f2b4ae30-6e088d5f9.min.css" | sort -u
```
Then confirm each one still exists somewhere in `samhita-home.html`.

## Verified working

- Color theme applies correctly across buttons, headings, badges, accordion, popup, footer.
- Responsive: checked at mobile width (375px) — hero, type sizing, and CTA button all reflow correctly, matching the original template's responsive behavior.
- Accordion (Who We Work With): click toggles the right panel, closes siblings, sweeps in the fill-line (verified via inline-style inspection after a real click).
- Popup (Connect form): opens via the "Connect Now" buttons, closes via the × button, backdrop click, or Escape.
- Navbar scroll-invert: background/border/text-color custom properties confirmed interpolating correctly from transparent+white to solid+dark on scroll.
- Nav-link underline hover/focus sweep: confirmed via real DOM `.focus()` (the automated tool's synthetic hover doesn't register true `:hover`, but `:focus-visible` does, and both are wired to the same rule).
- All 32 GSAP scroll-reveal groups (headings, level/experience cards, accordion items, tag items, sliders, story card, CTA content) create their expected element counts with no console errors, and manually force-completing each one resolves cleanly to full opacity — confirming every selector matches real content correctly.
- All 28 raster images (self-hosted logo + 26 local Waveyu template photos) load with zero broken images (`naturalWidth` checked for every `<img>`); the 3 vector social icons (Facebook/X/YouTube) render as inline SVG. No external image requests exist anymore, so nothing can 404 or get hotlink-blocked.
- Back-to-top button: hidden while the hero is in view, appears once it scrolls out, hides again on scrolling back up — confirmed via direct DOM inspection at each state. Click handler confirmed to invoke `scrollTo({top: 0, behavior: 'smooth'})`.
- Scroll progress bar: width calculation confirmed correct against actual scroll position; renders as a pink strip above the navbar.
- Page loader: correct total asset count (30 = 29 `<img>` [28 original + the loader's own reused background photo] + 1 `data-bg-src` hero photo); full show → 100% → fade → `display:none` lifecycle confirmed; does not lock body scroll (removed after a real "cannot scroll the page" report — see "Page loader" above); renders legibly (logo/bar/percentage) on top of the same blurred-photo-plus-navy-tint background the footer uses.
- Hero dark overlay bumped from `rgba(4, 28, 51, 0.28)` to `rgba(4, 28, 51, 0.4)` (slightly darker, per request) — heading/CTA text contrast re-checked and still reads cleanly against the photo.
- Favicon + Open Graph/Twitter meta: present and correctly valued (see "Favicon + social preview meta" above).
- Popup accessibility: `role="dialog"`/`aria-modal`/`aria-labelledby` present; opening moves focus to the first field; Tab and Shift+Tab both confirmed to wrap correctly within the popup's 9 focusable elements (never escaping to the page behind it); closing (via the close button, confirmed via direct test) returns focus to the exact trigger element that opened it. The close button itself was converted from an unreachable `<div>` to a real `<button>` — previously had no keyboard path to it at all.
- Alt-text audit: the 4 images with `alt=""` (the small circular thumbnails in the "Who We Serve" cards) were checked and are correctly decorative — each sits directly beside a text badge (e.g. "csr clients") and an `<h3>` heading that already fully describe the card, so per WCAG, empty alt is the *correct* choice here (redundant decorative image), not an oversight. Left unchanged.
- Content audit against the live samhita.org homepage (2026-07-17 snapshot): found and fixed three genuine mismatches — the hero heading was missing "Citizen Centric"/"Acceleration" from the real tagline; the hero's supporting stat and the "Our Story" overview block's "Lives Impacted" figure both showed `654,568+`, which is actually the site's *"Citizens who received Employment Linked Skilling"* number (used correctly elsewhere on this page) — the real "Lives Impacted" headline figure is **17M** (read directly from the live site's own scroll-triggered counter's `data-target` attribute, since the un-animated DOM shows a placeholder low number before its counter runs, e.g. `data-target="17M"` displaying as `1M` at rest); and the overview block was also missing a 4th stat the live site has (`CSR Clients, Development Foundations, International Agency Partners & Donors — 300+`), with the other two stats replaced by real counts (`Impact Partners: 500+`, `Government Partnerships: 15+`) instead of invented descriptive text. Everything else checked (audience card copy, Catalytic Initiatives descriptions, footer contact info) already matched closely and was left as-is. The hero counter's underlying JS was extended with an optional `data-count-suffix` attribute to support formatted magnitudes like `17M` rather than spelling out `17,000,000`.
- No console errors on load or on any interaction tested.

**Known tooling caveats, not page bugs** — all encountered while testing in
the same automated browser preview tool, all confirmed to be about the tool
rather than `samhita-home.html`:
- It can't reliably screenshot the page *after programmatically scrolling*
  (renders blank) — confirmed identical on the **original, unmodified**
  Waveyu template.
- Its synthetic `hover` action doesn't trigger real CSS `:hover` (confirmed
  via `element.matches(':hover')` returning `false` right after the tool
  "hovered" it) — real DOM `.focus()` works fine as a substitute for testing.
- Its `requestAnimationFrame` ticks extremely rarely (GSAP's ticker frame
  counter stayed at 0 for 5+ real seconds) — this is what surfaced the hero
  animation risk described above. A real user's focused browser tab runs
  `requestAnimationFrame` at full rate; this throttling is specific to how
  this tool renders automated/background tabs.

None of these affect the page itself — they're listed so a future session
re-testing with the same tool recognizes them rather than chasing them as
new bugs.

## Partner tiles: full-width layout + increased internal spacing

The two partner-banner cards ("Trusted by Leading Corporates" / "Backed by
Institutions & Government") were constrained to the default 940px
`.w-container` max-width, leaving wasted space on wider screens. Updated
in `samhita-theme.css`:

1. **Full-width tiles**: added `#section-partners-logos .container-standard.w-container { max-width: none; }` so the grid fills the full width available inside `.padding-horizontal`'s own edge padding — no more 940px cap.

2. **More internal vertical spacing**: changed `.partner-banner` from a plain block (`padding: 1.75rem`) to a flex column layout (`padding: 2.25rem 2rem; display: flex; flex-direction: column; gap: 1rem`) so heading, paragraph, marquee, and badge all have consistent 1rem spacing between them.

3. **Badge pinned to bottom**: changed the badge's `margin-top` from a fixed `1rem` to `auto`, so it pushes to the bottom of each card — keeps both tiles visually balanced even when one has more text than the other.

4. **Cleaned up redundant margins**: removed `margin-bottom: 0.5rem` from `.partner-banner-heading` and added `margin: 0` on `.partner-banner p`, since `gap` handles all spacing now.

Mobile behavior (stacking to single column below 767px) is unchanged.

## What's next (explicitly out of scope for this pass)

- Only the homepage was adapted. Samhita's other real pages (About, Teams,
  For CSR Clients / Foundations / Government / Financial Institutions,
  Catalytic Finance, Careers, Connect, Privacy Policy — see the sitemap done
  earlier this session) still need their own Waveyu-templated versions.
  Internal nav links to those pages currently point to `#` placeholders,
  marked with `<!-- placeholder: /about -->`-style comments in the HTML —
  search for `placeholder` to find all of them.
- Source real Samhita photography to replace the 26 Waveyu stand-in photos (surf/travel imagery, reused only for reliable placeholder purposes — see "Images" above for exactly which slot needs what).
- Samhita's real logo is a flat PNG; it may not read cleanly against every
  background it now sits on (e.g. the dark navy footer/nav-scrolled state).
  Worth asking for a reversed/light logo variant if this goes further.
- Consider whether the secondary teal accent (`--color--base--accent-teal`,
  currently unused) should be applied anywhere for visual variety.
