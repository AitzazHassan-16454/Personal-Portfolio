/* =============================================================================
   motion3d.js — 3D motion layer (progressive enhancement)
   -----------------------------------------------------------------------------
   Sections:
     1. Setup      — reduced-motion guard, shared helpers
     2. Tilt       — pointer-driven perspective tilt + gloss on cards/tiles
     3. Depth      — scroll parallax + tip for anything with [data-depth]
     4. Flip       — value cards turn over to their "in practice" side
     5. WebGL      — hero scene, three.js pulled in on demand from the CDN

   Contract: the page must look and read exactly the same with this file
   missing, blocked, or with prefers-reduced-motion set. Nothing here removes
   an existing behaviour — it only adds classes and custom properties that the
   "3D MOTION LAYER" block in style.css consumes.
   ============================================================================= */
(function () {
    'use strict';

    var Motion3D = window.Motion3D = window.Motion3D || {};

    var reduceQuery = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    /* ═══════════════════════════════════════════════════════════════════════
       1. SETUP
       ═══════════════════════════════════════════════════════════════════ */

    function reduced() {
        return !!(reduceQuery && reduceQuery.matches);
    }

    function all(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function clamp(v, min, max) {
        return v < min ? min : (v > max ? max : v);
    }

    /* One callback per frame, whatever the event rate */
    function oncePerFrame(fn) {
        var queued = false;
        return function () {
            if (queued) return;
            queued = true;
            requestAnimationFrame(function () { queued = false; fn(); });
        };
    }

    /* Screen rects go stale on scroll, so every rect read is tagged with the
       scroll epoch it was measured in and recomputed when the page moves. */
    var scrollEpoch = 0;
    window.addEventListener('scroll', function () { scrollEpoch++; }, { passive: true });

    function rectCache(el) {
        var rect = null, epoch = -1;
        return function () {
            if (epoch !== scrollEpoch) {
                rect = el.getBoundingClientRect();
                epoch = scrollEpoch;
            }
            return rect;
        };
    }


    /* ═══════════════════════════════════════════════════════════════════════
       2. TILT — the surface leans toward the cursor
       ───────────────────────────────────────────────────────────────────────
       max    degrees of rotation at the edges
       lift   px the surface rises while hovered (composed with :hover rules)
       persp  perspective distance baked into the transform itself, so tiles
              that have no perspective ancestor still read as solid objects
       ═══════════════════════════════════════════════════════════════════ */
    var TILT = [
        { sel: '.value-card',   max: 8,  lift: -8, persp: '1200px', shine: true },
        { sel: '.skill',        max: 12, lift: -6, persp: '900px',  shine: true },
        { sel: '.hero-stat',    max: 7,  lift: -4, persp: '850px',  shine: true },
        { sel: '.process-step', max: 8,  lift: -6, persp: '900px' },
        { sel: '.btn',          max: 9,  lift: -4, persp: '700px' },
        { sel: '.talent-media', max: 7,  lift: -8, persp: '1100px' },
        { sel: '.card',         max: 7,  lift: -6, persp: '950px' }
    ];

    var CLEAR_VARS = ['--rx', '--ry', '--lift', '--mx', '--my'];

    function bindTilt(el, cfg) {
        el.classList.add('tilt');
        /* Elements that already fade up get the combined entrance + tilt rule */
        if (el.classList.contains('js-reveal')) el.classList.add('reveal-3d');
        if (cfg.shine) el.classList.add('tilt-shine');
        el.style.setProperty('--persp', cfg.persp);

        var rectOf = rectCache(el);

        function active(e) {
            if (e.pointerType === 'touch') return false;
            /* Never tilt something the reveal animation hasn't landed yet */
            if (el.classList.contains('js-reveal') && !el.classList.contains('is-visible')) return false;
            if (el.closest && el.closest('.cards-scroll.is-dragging')) return false;
            return true;
        }

        function enter(e) {
            if (!active(e)) return;
            el.classList.add('is-tilting');
            move(e);
        }

        function move(e) {
            if (!el.classList.contains('is-tilting') || !active(e)) return;
            var r = rectOf();
            if (!r.width || !r.height) return;
            var x = clamp((e.clientX - r.left) / r.width, 0, 1);
            var y = clamp((e.clientY - r.top) / r.height, 0, 1);

            /* Top/left of the surface comes toward the viewer */
            el.style.setProperty('--rx', ((y - 0.5) * 2 * cfg.max).toFixed(2) + 'deg');
            el.style.setProperty('--ry', ((0.5 - x) * 2 * cfg.max).toFixed(2) + 'deg');
            el.style.setProperty('--lift', cfg.lift + 'px');
            el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
            el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        }

        function leave() {
            if (!el.classList.contains('is-tilting')) return;
            /* Dropping the class restores the base transition, so the surface
               eases back to rest instead of snapping. */
            el.classList.remove('is-tilting');
            CLEAR_VARS.forEach(function (name) { el.style.removeProperty(name); });
        }

        el.addEventListener('pointerenter', enter);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', leave);
        el.addEventListener('pointercancel', leave);
    }

    function initTilt() {
        if (reduced()) return;
        TILT.forEach(function (cfg) {
            all(cfg.sel).forEach(function (el) { bindTilt(el, cfg); });
        });
    }


    /* ═══════════════════════════════════════════════════════════════════════
       3. DEPTH — blocks drift and tip as they cross the viewport
       ───────────────────────────────────────────────────────────────────────
       --p runs from +1 (block above the viewport centre) to -1 (below it),
       and is multiplied by the element's data-depth (px) / data-tilt (deg).
       Negative depth lags behind the scroll, positive depth outruns it.
       ═══════════════════════════════════════════════════════════════════ */
    var depthEls = [];

    function initDepth() {
        depthEls = all('[data-depth]');
        if (reduced() || !depthEls.length) return;

        depthEls.forEach(function (el) {
            var depth = parseFloat(el.getAttribute('data-depth'));
            var tilt = parseFloat(el.getAttribute('data-tilt'));
            el.style.setProperty('--depth', (isNaN(depth) ? 40 : depth) + 'px');
            el.style.setProperty('--dt', (isNaN(tilt) ? 0 : tilt) + 'deg');
        });

        var update = oncePerFrame(function () {
            var vh = window.innerHeight || 1;
            depthEls.forEach(function (el) {
                var r = el.getBoundingClientRect();
                if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) return;
                var p = clamp((vh / 2 - (r.top + r.height / 2)) / vh, -1, 1);
                el.style.setProperty('--p', p.toFixed(3));
            });
        });

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }


    /* ═══════════════════════════════════════════════════════════════════════
       4. FLIP — value cards turn over to their "in practice" side
       ───────────────────────────────────────────────────────────────────────
       Click anywhere on the card, or use the button (keyboard reachable).
       The face pointing away from the reader is aria-hidden, and focus is
       handed to the button that is still visible.
       ═══════════════════════════════════════════════════════════════════ */
    function initFlip() {
        all('.value-card').forEach(function (card) {
            var front = card.querySelector('.flip-front');
            var back = card.querySelector('.flip-back');
            var frontBtn = front && front.querySelector('.flip-btn');
            var backBtn = back && back.querySelector('.flip-btn');
            if (!front || !back || !frontBtn || !backBtn) return;

            function setFlipped(on) {
                card.classList.toggle('is-flipped', on);
                frontBtn.setAttribute('aria-expanded', on ? 'true' : 'false');

                if (on) {
                    back.removeAttribute('aria-hidden');
                    front.setAttribute('aria-hidden', 'true');
                    if (front.contains(document.activeElement)) backBtn.focus();
                } else {
                    front.removeAttribute('aria-hidden');
                    back.setAttribute('aria-hidden', 'true');
                    if (back.contains(document.activeElement)) frontBtn.focus();
                }
            }

            frontBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                setFlipped(!card.classList.contains('is-flipped'));
            });

            backBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                setFlipped(false);
            });

            card.addEventListener('click', function (e) {
                if (e.target.closest && e.target.closest('button, a, input, textarea, select')) return;
                setFlipped(!card.classList.contains('is-flipped'));
            });
        });
    }


    /* ═══════════════════════════════════════════════════════════════════════
       5. WEBGL — a quiet wireframe core behind the hero
       ───────────────────────────────────────────────────────────────────────
       Called from index.html once the three.js module resolves. Everything
       above already runs without it; if the CDN is slow, blocked, or WebGL is
       unavailable the hero simply keeps its flat background.
       ═══════════════════════════════════════════════════════════════════ */
    function webglSupported() {
        try {
            var probe = document.createElement('canvas');
            return !!(probe.getContext('webgl2') ||
                      probe.getContext('webgl') ||
                      probe.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }

    Motion3D.initWebGL = function (THREE) {
        var canvas = document.getElementById('heroCanvas');
        var hero = document.querySelector('.hero');
        if (!canvas || !hero || !THREE || Motion3D.webgl) return;
        if (reduced() || !webglSupported()) {
            document.documentElement.classList.add('no-webgl');
            return;
        }

        var renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: true,
                alpha: true,
                powerPreference: 'low-power'
            });
        } catch (e) {
            document.documentElement.classList.add('no-webgl');
            return;
        }

        var ACCENT = 0xff4d04;
        var INK = 0x16161d;
        var PAPER = 0xf4f8f5;

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.setClearAlpha(0);

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
        camera.position.set(0, 0, 8.6);

        var world = new THREE.Group();
        scene.add(world);

        /* Core — a dark shell a hair smaller than the wireframe, so the far
           half of the lattice is occluded without needing a single light. */
        var core = new THREE.IcosahedronGeometry(2.25, 1);
        var shell = new THREE.Mesh(
            new THREE.IcosahedronGeometry(2.22, 1),
            new THREE.MeshBasicMaterial({ color: INK })
        );
        var wire = new THREE.LineSegments(
            new THREE.WireframeGeometry(core),
            new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.45 })
        );
        world.add(shell, wire);

        /* Two orbit rings — one passes behind the core, one in front of it */
        function ring(inner, outer, color, opacity) {
            return new THREE.Mesh(
                new THREE.RingGeometry(inner, outer, 180),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: opacity,
                    side: THREE.DoubleSide,
                    depthWrite: false
                })
            );
        }
        var ringA = ring(3.15, 3.19, ACCENT, 0.55);
        ringA.rotation.set(1.3, 0.2, 0.35);
        var ringB = ring(3.78, 3.8, PAPER, 0.16);
        ringB.rotation.set(1.02, -0.42, -0.22);
        world.add(ringA, ringB);

        /* Drift field: an even shell of points, no per-frame allocation */
        function cloud(count, minR, maxR, size, color, opacity) {
            var positions = new Float32Array(count * 3);
            for (var i = 0; i < count; i++) {
                var u = Math.random() * 2 - 1;
                var theta = Math.random() * Math.PI * 2;
                var s = Math.sqrt(1 - u * u);
                var r = minR + Math.random() * (maxR - minR);
                positions[i * 3] = Math.cos(theta) * s * r;
                positions[i * 3 + 1] = u * r;
                positions[i * 3 + 2] = Math.sin(theta) * s * r;
            }
            var geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            return new THREE.Points(geo, new THREE.PointsMaterial({
                color: color,
                size: size,
                sizeAttenuation: true,
                transparent: true,
                opacity: opacity,
                depthWrite: false
            }));
        }
        var dust = cloud(520, 4.8, 11, 0.05, PAPER, 0.5);
        var sparks = cloud(80, 3.5, 6.5, 0.09, ACCENT, 0.8);
        world.add(dust, sparks);

        var pointer = { x: 0, y: 0 };
        var tiltNow = { x: 0, y: 0 };
        var intro = 0;
        var inView = true;
        var rafId = 0;

        function resize() {
            var w = hero.clientWidth;
            var h = hero.clientHeight;
            if (!w || !h) return;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }

        function frame() {
            rafId = requestAnimationFrame(frame);
            if (!inView || document.hidden) return;

            if (intro < 1) intro = Math.min(1, intro + 0.014);

            var progress = clamp(window.scrollY / Math.max(hero.offsetHeight, 1), 0, 1);

            wire.rotation.y += 0.0026;
            wire.rotation.x += 0.0011;
            shell.rotation.copy(wire.rotation);
            ringA.rotation.z += 0.0021;
            ringB.rotation.z -= 0.0014;
            dust.rotation.y -= 0.0007;
            sparks.rotation.y += 0.0013;

            /* The whole assembly leans toward the pointer, then settles */
            tiltNow.x += (pointer.y * 0.3 - tiltNow.x) * 0.045;
            tiltNow.y += (pointer.x * 0.4 - tiltNow.y) * 0.045;
            world.rotation.x = tiltNow.x;
            world.rotation.y = tiltNow.y;
            world.position.y = progress * 1.8;

            /* Fade the scene out before the hero has fully left the screen */
            canvas.style.opacity = (intro * clamp(1 - progress * 1.4, 0, 1)).toFixed(3);

            renderer.render(scene, camera);
        }

        window.addEventListener('pointermove', function (e) {
            pointer.x = (e.clientX / (window.innerWidth || 1)) * 2 - 1;
            pointer.y = (e.clientY / (window.innerHeight || 1)) * 2 - 1;
        }, { passive: true });

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                inView = entries[0].isIntersecting;
            }, { threshold: 0 }).observe(hero);
        }

        if ('ResizeObserver' in window) {
            new ResizeObserver(resize).observe(hero);
        } else {
            window.addEventListener('resize', resize);
        }

        resize();
        Motion3D.webgl = { renderer: renderer, stop: function () { cancelAnimationFrame(rafId); } };
        frame();
    };


    /* ═══════════════════════════════════════════════════════════════════════
       BOOT
       ═══════════════════════════════════════════════════════════════════ */
    function boot() {
        initTilt();
        initDepth();
        initFlip();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}());
