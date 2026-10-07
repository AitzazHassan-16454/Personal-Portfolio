/* =============================================================================
   main.js — all interactions
   -----------------------------------------------------------------------------
   Sections:
     1. Header       — pin-on-scroll sentinel, mega panel hover, mobile drawer
     2. Hero         — rotating headline, count-up stats
     3. Marquee      — duplicates the track so -50% = exactly one set
     4. Team         — tab switching, card render, slide measurement, drag-scroll
     5. Work         — hover-to-expand panels, tap accordion on mobile
     6. FAQ          — accordion
     7. Reveal       — IntersectionObserver fade-up
   ============================================================================= */
(function () {
    'use strict';

    /* ═══════════════════════════════════════════════════════════════════════
       1. HEADER
       ═══════════════════════════════════════════════════════════════════ */

    /* -- Pin on scroll ------------------------------------------------------
       A 1px sentinel is placed above the header. When it scrolls out of view
       the header is pinned to the viewport top. rootMargin cancels out the
       header's own margin-top so the pin happens at the right scroll offset. */
    (function stickyHeader() {
        var header = document.getElementById('siteHeader');
        if (!header) return;

        var sentinel = document.createElement('div');
        sentinel.setAttribute('aria-hidden', 'true');
        Object.assign(sentinel.style, {
            height: '1px', width: '1px', pointerEvents: 'none'
        });
        header.parentNode.insertBefore(sentinel, header);

        var topOffset = parseFloat(getComputedStyle(header).marginTop) * -1 || 0;

        new IntersectionObserver(function (entries) {
            header.classList.toggle('is-pinned', !entries[0].isIntersecting);
        }, { threshold: 0, rootMargin: topOffset + 'px 0px 0px 0px' }).observe(sentinel);
    }());

    /* -- Desktop mega panel -------------------------------------------------
       Hover intent on desktop, click-through links on touch. The small delay
       on close stops the panel flickering shut when the pointer crosses the
       gap between trigger and panel. */
    (function megaPanels() {
        var items = Array.prototype.slice.call(document.querySelectorAll('.nav-item[data-mega]'));
        var CLOSE_DELAY = 120;
        var timers = new WeakMap();

        function open(item) {
            clearTimeout(timers.get(item));
            items.forEach(function (other) {
                if (other !== item) other.classList.remove('active');
            });
            item.classList.add('active');
        }

        function close(item) {
            timers.set(item, setTimeout(function () {
                item.classList.remove('active');
            }, CLOSE_DELAY));
        }

        items.forEach(function (item) {
            item.addEventListener('mouseenter', function () { open(item); });
            item.addEventListener('mouseleave', function () { close(item); });

            // Touch / keyboard: toggle on tap
            var link = item.querySelector('.nav-link');
            if (!link) return;
            link.addEventListener('click', function (e) {
                if (window.matchMedia('(hover: hover)').matches) return; // desktop hover handles it
                e.preventDefault();
                item.classList.contains('active') ? close(item) : open(item);
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            items.forEach(function (i) { i.classList.remove('active'); });
        });
    }());

    /* -- Mobile drawer ------------------------------------------------------ */
    (function mobileDrawer() {
        var toggle  = document.getElementById('navToggle');
        var drawer  = document.getElementById('drawer');
        var overlay = document.getElementById('drawerOverlay');
        var closeBtn = document.getElementById('drawerClose');
        if (!toggle || !drawer) return;

        function setOpen(open) {
            toggle.classList.toggle('open', open);
            drawer.classList.toggle('open', open);
            overlay.classList.toggle('visible', open);
            toggle.setAttribute('aria-expanded', String(open));
            document.body.style.overflow = open ? 'hidden' : '';
        }

        toggle.addEventListener('click', function () {
            setOpen(!drawer.classList.contains('open'));
        });
        if (overlay) overlay.addEventListener('click', function () { setOpen(false); });
        if (closeBtn) closeBtn.addEventListener('click', function () { setOpen(false); });

        drawer.addEventListener('click', function (e) {
            // Any plain link closes the drawer once navigation happens
            if (e.target.closest('a')) setOpen(false);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') setOpen(false);
        });
    }());

    /* -- Drawer accordions --------------------------------------------------- */
    (function accordions() {
        document.querySelectorAll('[data-acc]').forEach(function (item) {
            var trigger = item.querySelector('.acc-trigger');
            var panel   = item.querySelector('.acc-panel');
            if (!trigger || !panel) return;

            trigger.addEventListener('click', function () {
                var isOpen = item.classList.contains('open');

                if (isOpen) {
                    item.classList.remove('open');
                    panel.style.maxHeight = null;
                } else {
                    item.classList.add('open');
                    panel.style.maxHeight = panel.scrollHeight + 'px';
                }
            });
        });
    }());


    /* ═══════════════════════════════════════════════════════════════════════
       2. HERO — rotating headline
       ═══════════════════════════════════════════════════════════════════ */
    (function rotatingHeadline() {
        var wrap = document.getElementById('swapWrap');
        if (!wrap) return;

        var headings = Array.prototype.slice.call(wrap.querySelectorAll('.swap-heading'));
        if (headings.length < 2) return;

        var current = 0;
        setInterval(function () {
            headings[current].classList.remove('active');
            current = (current + 1) % headings.length;
            headings[current].classList.add('active');
        }, 3000);
    }());

    /* -- Count-up stats ------------------------------------------------------
       Counts when the stat block scrolls into view, then stops. */
    (function countUp() {
        var els = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
        if (!els.length) return;

        function run(el) {
            var target = parseInt(el.dataset.count, 10) || 0;
            var duration = 1400;
            var start = null;

            function frame(ts) {
                if (start === null) start = ts;
                var p = Math.min((ts - start) / duration, 1);
                // easeOutExpo — fast start, gentle settle
                var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
                el.textContent = Math.round(target * eased);
                if (p < 1) requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                run(entry.target);
                io.unobserve(entry.target);
            });
        }, { threshold: 0.4 });

        els.forEach(function (el) { io.observe(el); });
    }());


    /* ═══════════════════════════════════════════════════════════════════════
       3. MARQUEE
       -----------------------------------------------------------------------------
       The CSS animation translates the track -50%, which only lands seamlessly
       if the track holds exactly two identical sets of logos.
       ═══════════════════════════════════════════════════════════════════ */
    (function marquee() {
        var track = document.getElementById('marqueeTrack');
        if (!track) return;

        track.innerHTML += track.innerHTML; // duplicate → seamless -50% loop

        // Scale duration to content width so speed stays constant regardless
        // of how many logos there are or how wide the viewport is.
        function syncDuration() {
            var setWidth = track.scrollWidth / 2;
            var seconds  = Math.max(14, (setWidth / 46).toFixed(1));
            track.style.setProperty('--marquee-dur', seconds + 's');
        }

        syncDuration();
        window.addEventListener('resize', syncDuration);
    }());


    /* ═══════════════════════════════════════════════════════════════════════
       4. ★ TEAM
       --------------------------------------------------------------------------
       Card markup is generated from window.TEAM_DATA, then two measurements
       run on every render:
         - --nhp-hide per card  = extras height + 8px, so the hidden slide
           sits exactly flush with the card's bottom edge regardless of how
           many tag pills wrap onto a second line
         - .can-scroll per row = whether the cards overflow the visible width
           (controls whether the orange scrollbar is shown at all)
       ═══════════════════════════════════════════════════════════════════ */

    var PROMPT_ICON =
        '<svg class="card-prompt" width="23" height="14" viewBox="0 0 23 14" fill="none" aria-hidden="true">' +
        '<path d="M1 1L7.5 7L1 13" stroke="#FF4D04" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<line x1="11" y1="13" x2="22" y2="13" stroke="#FF4D04" stroke-width="1.6" stroke-linecap="round"/>' +
        '</svg>';

    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function cardHTML(m) {
        return '' +
        '<article class="card">' +
            /* Idle layer: the same source photo, desaturated by CSS. Swap in a
               dedicated B&W asset if you have one — just add class
               `card-photo--bw-native` and drop the grayscale filter. */
            '<img class="card-photo card-photo--bw" src="' + esc(m.photo) + '" alt="' + esc(m.name) + '" loading="lazy">' +
            /* Hover layer: the full-colour photo */
            '<img class="card-photo card-photo--color" src="' + esc(m.photo) + '" alt="" loading="lazy" aria-hidden="true">' +

            '<h3 class="card-name">' + esc(m.name) + '</h3>' +

            /* The animated element. No background — the dark panel below is a
               child, so only the info rows get the scrim while tag pills and
               the CTA float directly over the photo. */
            '<div class="card-slide">' +
                '<div class="card-panel">' +
                    infoRow(m.role) +
                    infoRow(m.experience) +
                    infoRow(m.stack) +
                '</div>' +
                '<div class="card-extras">' +
                    '<div class="card-tags">' +
                        m.tags.map(function (t) {
                            return '<span class="card-tag">' + esc(t) + '</span>';
                        }).join('') +
                    '</div>' +
                    '<a href="#contact" class="card-book">Book a call</a>' +
                '</div>' +
            '</div>' +
        '</article>';
    }

    function infoRow(text) {
        return '<div class="card-info-row">' + PROMPT_ICON +
               '<span class="card-info-text">' + esc(text) + '</span></div>';
    }

    function renderTeam() {
        var tabsEl   = document.getElementById('teamTabs');
        var panelsEl = document.getElementById('teamPanels');
        if (!tabsEl || !panelsEl || !window.TEAM_DATA) return;

        var data = window.TEAM_DATA;

        // Tabs and panels are separate DOM trees, so build each explicitly.
        // Only the first panel is .active; the rest stay display:none until
        // their tab is clicked (measure() runs again after the switch).
        tabsEl.innerHTML = data.map(function (g, i) {
            return '<button class="team-tab' + (i === 0 ? ' active' : '') + '"' +
                   ' data-panel="team-panel-' + g.id + '" role="tab"' +
                   ' aria-selected="' + (i === 0) + '">' +
                   '<svg class="team-tab-icon" viewBox="0 0 24 32" aria-hidden="true">' + g.icon + '</svg>' +
                   '<span class="team-tab-label">' + esc(g.label) + '</span></button>';
        }).join('');

        panelsEl.innerHTML = data.map(function (g, i) {
            return '<div class="team-panel' + (i === 0 ? ' active' : '') + '"' +
                   ' id="team-panel-' + g.id + '" role="tabpanel">' +
                   '<div class="cards-scroll"><div class="cards">' +
                   g.members.map(cardHTML).join('') +
                   '</div></div></div>';
        }).join('');
    }

    renderTeam();

    (function teamBehaviour() {
        var section = document.getElementById('team');
        if (!section) return;

        var tabs = Array.prototype.slice.call(section.querySelectorAll('.team-tab'));

        /* -- Measurement pass -------------------------------------------------
           Runs on load, on tab switch (new cards are display:none until their
           panel activates, so they measure as zero) and on resize (tag pills
           re-wrap and change the extras height). */
        function measure() {
            section.querySelectorAll('.card').forEach(function (card) {
                var slide  = card.querySelector('.card-slide');
                var extras = card.querySelector('.card-extras');
                if (!slide || !extras) return;
                slide.style.setProperty('--nhp-hide', (extras.offsetHeight + 8) + 'px');
            });
        }

        /* -- Scrollbar visibility ---------------------------------------------
           A 4px tolerance absorbs sub-pixel layout noise so a row that is
           one hair over doesn't render a scrollbar for nothing. */
        function checkScrollable() {
            section.querySelectorAll('.cards-scroll').forEach(function (el) {
                el.classList.toggle('can-scroll', el.scrollWidth - el.clientWidth > 4);
            });
        }

        function refresh() {
            requestAnimationFrame(function () {
                measure();
                checkScrollable();
            });
        }

        refresh();
        window.addEventListener('resize', refresh);

        /* -- Tab switching ---------------------------------------------------- */
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                var targetId = tab.dataset.panel;

                tabs.forEach(function (t) {
                    var isActive = t === tab;
                    t.classList.toggle('active', isActive);
                    t.setAttribute('aria-selected', String(isActive));
                });

                section.querySelectorAll('.team-panel').forEach(function (panel) {
                    panel.classList.toggle('active', panel.id === targetId);
                });

                // New panel's cards were display:none — measure after paint
                refresh();

                // Reset the row so the newly shown tab starts at card one
                var active = section.querySelector('.team-panel.active .cards-scroll');
                if (active) active.scrollLeft = 0;
            });
        });

        /* -- Drag to scroll ----------------------------------------------------
           Native touch scrolling is untouched; this only adds mouse dragging.
           The .is-dragging class switches the cursor to a grab hand and
           suppresses text selection while dragging. */
        section.querySelectorAll('.cards-scroll').forEach(function (el) {
            var startX = 0, startScroll = 0, dragging = false;

            el.addEventListener('mousedown', function (e) {
                // Ignore drags that start on a link or button inside a card
                if (e.target.closest('a')) return;

                dragging = true;
                startX = e.pageX;
                startScroll = el.scrollLeft;
                el.classList.add('is-dragging');
                e.preventDefault();
            });

            window.addEventListener('mousemove', function (e) {
                if (!dragging) return;
                el.scrollLeft = startScroll - (e.pageX - startX);
            });

            window.addEventListener('mouseup', function () {
                if (!dragging) return;
                dragging = false;
                el.classList.remove('is-dragging');
            });
        });
    }());


    /* ═══════════════════════════════════════════════════════════════════════
       5. WORK — hover-to-expand on desktop, tap accordion on mobile
       ═══════════════════════════════════════════════════════════════════ */
    (function workPanels() {
        var host = document.getElementById('workPanels');
        if (!host) return;

        var panels = Array.prototype.slice.call(host.querySelectorAll('.work-panel'));
        var current = 0;
        var isMobile = function () { return window.innerWidth <= 991; };

        // Paint the backdrop gradients declared on data attributes
        panels.forEach(function (panel) {
            var bw    = panel.querySelector('.work-bg--bw');
            var color = panel.querySelector('.work-bg--color');
            if (bw)    bw.style.backgroundImage    = panel.dataset.bw;
            if (color) color.style.backgroundImage = panel.dataset.color;
        });

        function activate(i) {
            if (i === current) return;
            panels[current].classList.remove('active');
            current = i;
            panels[current].classList.add('active');
        }

        panels.forEach(function (panel, i) {
            panel.addEventListener('mouseenter', function () {
                if (!isMobile()) activate(i);
            });

            panel.addEventListener('click', function () {
                if (!isMobile()) return;
                var wasActive = panel.classList.contains('active');
                panels.forEach(function (p) { p.classList.remove('active'); });
                if (!wasActive) { panel.classList.add('active'); current = i; }
            });
        });
    }());


    /* ═══════════════════════════════════════════════════════════════════════
       6. FAQ accordion — one open at a time
       ═══════════════════════════════════════════════════════════════════ */
    (function faq() {
        document.querySelectorAll('.faq-list').forEach(function (list) {
            var items = Array.prototype.slice.call(list.querySelectorAll('.faq-item'));
            if (!items.length) return;

            function closeItem(item) {
                var wrap = item.querySelector('.faq-answer-wrap');
                var btn  = item.querySelector('[data-faq-trigger]');
                item.classList.remove('is-open');
                if (wrap) wrap.style.maxHeight = '0';
                if (btn)  btn.setAttribute('aria-expanded', 'false');
            }

            function openItem(item) {
                var wrap = item.querySelector('.faq-answer-wrap');
                var btn  = item.querySelector('[data-faq-trigger]');
                item.classList.add('is-open');
                // Animate to the measured content height, not a fixed value
                if (wrap) wrap.style.maxHeight = wrap.scrollHeight + 'px';
                if (btn)  btn.setAttribute('aria-expanded', 'true');
            }

            items.forEach(function (item) {
                var btn = item.querySelector('[data-faq-trigger]');
                if (!btn) return;

                btn.addEventListener('click', function () {
                    var isOpen = item.classList.contains('is-open');
                    items.forEach(closeItem);
                    if (!isOpen) openItem(item);
                });
            });
        });
    }());


    /* ═══════════════════════════════════════════════════════════════════════
       7. REVEAL ON SCROLL
       -----------------------------------------------------------------------------
       .js-reveal elements start at opacity 0 / translateY(24px) in CSS.
       The inline transition-delay set on some of them staggers a grid row.
       ═══════════════════════════════════════════════════════════════════ */
    (function reveal() {
        var els = Array.prototype.slice.call(document.querySelectorAll('.js-reveal'));
        if (!els.length) return;

        if (!('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

        els.forEach(function (el) { io.observe(el); });
    }());

}());