/* =============================================================================
   site-config.js — the ONE place to edit personal / contact details.
   -----------------------------------------------------------------------------
   Every contact link on the page points at a key in SITE_CONFIG.contact via a
   data-contact attribute, so replacing the values below updates the CTA button,
   the footer "Elsewhere" column and the footer social icons in one edit.

   Placeholders left as-is:
     '#'        → the link renders as-is until you fill it in
     the email  → shown on the CTA button and the footer Email link

   If JavaScript is unavailable the hardcoded fallbacks in index.html are used,
   so keep those in sync if you change these.
   ============================================================================= */

window.SITE_CONFIG = {
    contact: {
        email:    'aitzazhassan16454@gmail.com',
        phone:    'tel:+923428879040',
        github:   'https://github.com/aitzazhassan',
        linkedin: '#',
        x:        '#',
        writing:  '#'
    }
};

(function () {
    var c = window.SITE_CONFIG.contact;
    if (!c) return;

    var nodes = document.querySelectorAll('[data-contact]');
    for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        var key = el.getAttribute('data-contact');
        var val = c[key];
        if (!val) continue;

        el.setAttribute('href', key === 'email' ? 'mailto:' + val : val);

        // The CTA button prints the address as its own label.
        if (key === 'email' && el.hasAttribute('data-contact-label')) {
            el.textContent = val;
        }
    }
})();
