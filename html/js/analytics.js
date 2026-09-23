// Google Analytics 4 - consent-gated, shared across all pages
(function() {
    var MEASUREMENT_ID = 'G-R2RTVB22T3';
    var hasConsent = function() {
        return localStorage.getItem('cookieConsent') === 'true';
    };

    var accepted = hasConsent();

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { dataLayer.push(arguments); };

    gtag('js', new Date());
    gtag('consent', 'default', {
        analytics_storage: accepted ? 'granted' : 'denied'
    });
    gtag('config', MEASUREMENT_ID);

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(s);

    function trackPageEvent() {
        if (window.location.pathname.indexOf('commissions.html') !== -1) {
            gtag('event', 'view_commissions');
        }
    }

    var acceptBtn = document.getElementById('cookieAccept');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'true');
            gtag('consent', 'update', { analytics_storage: 'granted' });
            trackPageEvent();
        });
    }

    if (accepted) {
        trackPageEvent();
    }

    function resolveHost(href) {
        var a = document.createElement('a');
        a.href = href;
        return a.hostname || '';
    }

    document.addEventListener('click', function(e) {
        if (!hasConsent()) return;
        var link = e.target && e.target.closest ? e.target.closest('a') : null;
        if (!link) return;

        var href = link.getAttribute('href') || '';
        if (!href || href === '#') return;
        if (href.indexOf('javascript:') === 0) return;

        var text = (link.textContent || '').trim();
        var domain = resolveHost(href);

        gtag('event', 'link_click', {
            link_url: href,
            link_text: text,
            link_domain: domain
        });

        if (href.indexOf('mailto:') === 0) {
            gtag('event', 'contact_click', {
                event_category: 'contact',
                event_label: href
            });
        } else if (domain && domain !== window.location.hostname) {
            gtag('event', 'outbound_click', {
                link_url: href,
                link_text: text
            });
        }
    });
})();