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
