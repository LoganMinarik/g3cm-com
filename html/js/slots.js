// Commission slot availability - reads counts from a Google Sheet via an Apps Script endpoint
(function() {
    var ENDPOINT = 'https://script.google.com/macros/s/AKfycbwim3sZ8PPly_GTGcdwATRCF8PDs5jifjwSmBpASdC2GstoAgYbAofz4W6yJyBtDN6pfA/exec';
    var CACHE_KEY = 'g3cmSlots';
    var CACHE_TTL = 5 * 60 * 1000;
    var TIMEOUT = 8000;
    var UNAVAILABLE = 'Live slot counts are unavailable right now - email us and we will confirm what is open.';

    var filledEl = document.querySelector('[data-slot="filled"]');
    var totalEl = document.querySelector('[data-slot="total"]');
    var openEl = document.querySelector('[data-slot="open"]');
    var statusEl = document.querySelector('[data-slot="status"]');
    var timeEl = document.querySelector('[data-slot="time"]');
    var stateEl = document.querySelector('[data-slot="state"]');
    var stateLabelEl = document.querySelector('[data-slot="state-label"]');

    if (!filledEl || !totalEl || !openEl) return;

    function setText(el, text) {
        if (el) el.textContent = text;
    }

    function stamp(value) {
        var d = value ? new Date(value) : null;
        if (!d || isNaN(d.getTime())) return null;
        return d.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    function normalize(raw) {
        if (!raw || typeof raw !== 'object') return null;
        if (raw.filled === null || raw.filled === undefined) return null;
        if (raw.total === null || raw.total === undefined) return null;
        var filled = Math.floor(Number(raw.filled));
        var total = Math.floor(Number(raw.total));
        if (!isFinite(filled) || !isFinite(total)) return null;
        if (filled < 0 || total < 0) return null;
        if (filled > total) return null;
        return { filled: filled, total: total, updated: raw.updated || null };
    }

    function saveCache(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                filled: data.filled,
                total: data.total,
                updated: data.updated,
                cachedAt: Date.now()
            }));
        } catch (e) {}
    }

    function readCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            var data = normalize(parsed);
            if (!data) return null;
            data.cachedAt = Number(parsed.cachedAt) || null;
            return data;
        } catch (e) {
            return null;
        }
    }

    function render(data, isStale) {
        setText(filledEl, String(data.filled));
        setText(totalEl, String(data.total));
        setText(openEl, String(data.total - data.filled));
        setText(statusEl, isStale
            ? 'These are the last known figures - we could not reach the live sheet just now.'
            : 'Live figures, read from our booking sheet.');
        var when = stamp(data.updated) || stamp(data.cachedAt);
        setText(timeEl, when || 'unknown');

        var open = data.total - data.filled;
        if (stateEl && stateLabelEl) {
            stateEl.classList.toggle('is-closed', open === 0);
            stateEl.classList.add('is-visible');
            setText(stateLabelEl, open === 0 ? 'Closed' : 'Open');
        }
    }

    function showUnavailable(message) {
        setText(filledEl, '—');
        setText(totalEl, '—');
        setText(openEl, '—');
        setText(statusEl, message);
        setText(timeEl, 'never');
    }

    function fetchWithTimeout(url) {
        if (typeof AbortController === 'undefined') return fetch(url);
        var controller = new AbortController();
        var timer = setTimeout(function() { controller.abort(); }, TIMEOUT);
        return fetch(url, { signal: controller.signal }).then(function(res) {
            clearTimeout(timer);
            return res;
        }, function(err) {
            clearTimeout(timer);
            throw err;
        });
    }

    function showCachedIfFresh() {
        var cached = readCache();
        if (!cached || !cached.cachedAt) return false;
        if (Date.now() - cached.cachedAt > CACHE_TTL) return false;
        render(cached, false);
        return true;
    }

    function load() {
        if (showCachedIfFresh()) return;

        if (ENDPOINT.indexOf('PASTE_') === 0) {
            showUnavailable(UNAVAILABLE);
            return;
        }

        fetchWithTimeout(ENDPOINT).then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        }).then(function(raw) {
            var data = normalize(raw);
            if (!data) throw new Error('unexpected payload');
            saveCache(data);
            render(data, false);
        }).catch(function() {
            var cached = readCache();
            if (cached) {
                render(cached, true);
            } else {
                showUnavailable(UNAVAILABLE);
            }
        });
    }

    load();
})();