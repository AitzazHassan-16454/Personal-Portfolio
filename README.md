# Portfolio — dark editorial UI with hover-reveal team cards

A frontend-only single-page portfolio built to match the UI, animation language
and hover behaviour of the reference design.

```
portfolio-sw/
├── index.html         # markup
├── work/              # case studies
│   ├── ledger.html
│   ├── atlas.html
│   └── relay.html
├── css/
│   ├── style.css      # design tokens + all components
│   ├── case.css       # only what work/*.html needs on top of style.css
│   └── fonts.css      # @font-face for the self-hosted Poppins
├── js/
│   ├── data.js        # team data (edit this)
│   ├── site-config.js # email + social URLs (edit this)
│   ├── main.js        # all behaviour
│   ├── motion3d.js    # 3D layer — progressive enhancement
│   └── vendor/        # three.module.min.js, imported only on desktop
├── fonts/             # Poppins 300–700, latin subset, 44K total
├── images/            # headshots, talent portrait (WebP + PNG fallback)
├── scripts/           # cutout.py / fade.py — reproducible image pipeline
├── favicon.svg  favicon.ico  apple-touch-icon.png  og.png
├── robots.txt  sitemap.xml
└── README.md
```

No build step, no dependencies, and **no external requests at runtime** —
fonts, renderer and images are all served from this directory. Open
`index.html`, or:

```bash
python3 -m http.server 8000
```

Prefer the server: Chrome blocks `file://` **ES module imports** (CORS), so
double-clicking `index.html` loads the page fine but skips the WebGL hero —
it marks itself `.no-webgl` and the canvas stays at its default 300×150.
Serve it and you get the whole thing.

---

## Design tokens

Defined at the top of `css/style.css`:

| Token | Value | Use |
|---|---|---|
| `--bg` | `#16161D` | page background |
| `--bg-deep` | `#030303` | footer, mobile drawer |
| `--accent` | `#FF4D04` | headings, CTAs, icons, underlines |
| `--text` | `#F4F8F5` | body copy |
| `--muted` | `rgba(244,248,245,.62)` | secondary copy |
| `--line` | `rgba(244,248,245,.10)` | hairline dividers |
| `--radius` | `4px` | cards, buttons |
| `--ease` | `cubic-bezier(.4,0,.2,1)` | default easing |

Type is Poppins (300/400/500/600/700), **self-hosted** from `fonts/` via
`css/fonts.css` — latin subset only, with Google's `unicode-range` kept
verbatim so `←` and `↻` fall back to a system font exactly as they did over
the CDN. `poppins-400.woff2` is preloaded. Weights are deliberately light —
`300` for body, `400` for UI, `600/700` for emphasis. `800` appears nowhere:
it was never part of the font, so the browser was already selecting `700`.

---

## The team section

This is the centrepiece. Idle state is a bare desaturated portrait with an
orange name. Hover runs four transitions at once:

| # | Element | From → To | Timing |
|---|---|---|---|
| 1 | `.card-photo--bw` | `opacity: 1 → 0` | `opacity .4s ease` |
| 2 | `.card-photo--color` | `opacity: 0 → 1` | `opacity .4s ease` |
| 3 | `.card-name` | `#FF4D04 → #F4F8F5` | `color .3s ease` |
| 4 | `.card-slide` | `translateY(var(--nhp-hide)) → 0` | `transform .42s cubic-bezier(.4,0,.2,1)` |

### Why `--nhp-hide` is measured in JS

The slide-up distance is **not** a hardcoded pixel value. `main.js` measures the
extras block (tag pills + CTA) on every render and sets:

```js
slide.style.setProperty('--nhp-hide', (extras.offsetHeight + 8) + 'px');
```

Without this, a card whose tags wrap onto a second line would reveal the panel
too early and clip it. Measurement re-runs on load, on tab switch, and on
resize (wrapping changes the height).

Measurement also has to happen **after** the panel is made visible — cards in an
inactive tab are `display: none` and measure as `0`. Hence the
`requestAnimationFrame` inside `refresh()`.

### Structure note

`.card-slide` has **no background**. Its children do:

- `.card-panel` — `rgba(22,22,29,.80)` scrim behind the three info rows
- `.card-extras` — no scrim, so tag pills and the CTA float over the photo

Moving the background onto the child instead of the sliding wrapper is what
produces that layered look.

### Filter tabs

`.team-tab` uses `opacity: .55` at rest, `.85` on hover, `1` when active, with a
2px `--accent` underline. Inactive tabs don't move or resize — only opacity, so
the row never reflows on hover.

The row gets an orange scrollbar (`.can-scroll`) only when cards actually
overflow. JS toggles that class with a 4px tolerance for sub-pixel noise.

### Drag to scroll

`cursor: grab` / `grabbing` with mouse-drag scrolling. Native touch scrolling is
left alone; drags starting on a link are ignored so the "Book a call" CTA stays
clickable.

---

## Other animations

- **Mega menu** — `clip-path: inset(0 0 100% 0)` → `inset(0 0 0 0)` over
  `.55s cubic-bezier(.22,1,.36,1)`. A curtain drop. Hover has a 120ms close
  delay so the panel doesn't flicker when the pointer crosses the gap.
- **Buttons** — outline fills on hover, solid inverts to white.
- **Work panels** — `flex-grow: 1` over `.75s`; backdrop swaps B&W → colour;
  content fades in with a `.3s` delay so it reads as following the width change.
  On mobile this becomes a tap accordion (`max-height`).
- **Logo marquee** — the track's HTML is duplicated in JS so
  `translateX(-50%)` lands seamlessly; duration scales with content width so
  speed is constant regardless of logo count.
- **Hero** — cross-fading headline every 3s; `easeOutExpo` count-up stats on
  scroll into view.
- **FAQ** — one open at a time, animated to `scrollHeight` so any answer length
  works. The open answer becomes a solid accent block.
- **Reveal** — `IntersectionObserver`, fade + 24px rise, staggered via inline
  `transition-delay`.

All of it collapses under `prefers-reduced-motion: reduce` — including the two
things JS drives directly (the rotating headline and the count-up stats), which
check `matchMedia` before starting.

---

## Case studies

`work/ledger.html`, `work/atlas.html`, `work/relay.html` are standalone pages
built from the three work panels. They reuse `css/style.css` and add
`css/case.css` for the hero, fact strip, quote band and prose layout. The header
is the slim variant — logo, four links to `../index.html#…`, and the mailto
button — so the mega menu markup isn't duplicated four times.

**Panels are links.** `.work-content` became an `<a>`; because it is
`position: absolute; inset: 0; display: flex`, swapping the tag changes nothing
visually. It already had `pointer-events: none` until the panel is active, so on
mobile you expand the accordion first and *then* tap through — while collapsed,
the tap still belongs to the panel.

**`--case-accent` must be a gradient, never a colour.** Each page sets it on
`<main>` (not on the hero, or its sibling quote band won't inherit it) and it
feeds `.case-rule` and `.case-quote-band`'s `background-image`. A bare colour
there invalidates the whole declaration and you silently get no band at all.

> **The prose in these three pages is draft copy**, written from the panel
> quotes and stats. Treat it as placeholder text to rewrite.

---

## No third-party origins

Runtime requests: **0**.

- **Fonts** — `fonts/` + `css/fonts.css`, replacing the Google Fonts link.
- **Renderer** — `js/vendor/three.module.min.js`, loaded only where it can be
  used: `js/motion3d.js` skips coarse pointers, viewports under 992px,
  `Save-Data` and `prefers-reduced-motion`, then marks the document
  `no-webgl`. Phones were previously downloading a 655K renderer to paint a
  canvas that was `display: none`.
- **Contact links** — `js/site-config.js` holds the email and the social URLs;
  every `data-contact` element reads from it. The `mailto:` written in the
  markup is the no-JS fallback. **One edit changes them everywhere.**
- **Images** — team portraits and the talent cutout are local; WebP with a PNG
  fallback for the portrait.

---

## Customising

**Team members** — edit `js/data.js`. Each member needs `name`, `role`,
`experience`, `stack`, `tags[]`, `photo`. Add a group with `id`, `label`, `icon`,
`members[]` and a new tab is generated automatically.

**Photos** — `photo` points at a local WebP in `images/team/` (regenerate from
the originals with `scripts/fade.py`). Both image layers use the same file: the
idle layer is desaturated with `filter: grayscale(100%)`. If you have genuine
B&W and colour versions of each portrait, drop the filter and point the two
layers at different files.

**Colours** — change `--accent` and the whole page follows.

**Copy** — all inline in `index.html`.

---

## Verified

Checked in headless Chrome via the DevTools protocol, using real dispatched
mouse input rather than simulated class toggles:

- Team hover stack: B&W→colour crossfade, name recolour, panel slide to
  `translateY(0)`, CTA brightening
- Measured `--nhp-hide` correct (90px), and re-measured after tab switch
- Mega menu curtain, chevron rotation, button hover inversion
- Work panel expand 180px → 1065px with content fade-in
- Mobile at 390px: cards 260×400, reveals committed to end states, drawer,
  hamburger X morph, tap accordion

Known test artifact: the "Book a call" hover check reports a false failure when
the button's position is sampled before the card is hovered (the slide is still
translated down). Measuring after hovering confirms it works — `opacity 1 →
0.88`, `background #FF4D04 → #FF6A2A`.