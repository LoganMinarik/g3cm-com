const hamburger = document.getElementById('hamburger');
const navPanel = document.getElementById('navPanel');
const navOverlay = document.getElementById('navOverlay');
const navLinks = document.querySelectorAll('.nav-link');

function openNav() {
    hamburger.classList.add('active');
    navPanel.classList.add('open');
    navOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeNav() {
    hamburger.classList.remove('active');
    navPanel.classList.remove('open');
    navOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
    if (navPanel.classList.contains('open')) {
        closeNav();
    } else {
        openNav();
    }
});

navOverlay.addEventListener('click', closeNav);

navLinks.forEach(link => {
    link.addEventListener('click', closeNav);
});

var carouselTrack = document.getElementById('carouselTrack');
if (carouselTrack) {
    var cards = Array.from(carouselTrack.children);
    cards.forEach(function (c) { carouselTrack.appendChild(c.cloneNode(true)); });

    var toggle = document.getElementById('carouselToggle');
    if (toggle) {
        toggle.addEventListener('click', function () {
            var paused = carouselTrack.style.animationPlayState === 'paused';
            carouselTrack.style.animationPlayState = paused ? 'running' : 'paused';
            toggle.textContent = paused ? '\u23F8' : '\u25B6';
        });
    }
}
