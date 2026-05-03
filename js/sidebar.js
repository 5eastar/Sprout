// sidebar.js — renders the sidebar nav once from a single source of truth.
// Active item is detected from the current page filename in the URL.
(function () {
    const NAV_ITEMS = [
        { href: 'home.html',          icon: 'bxs-home',        label: 'Home' },
        { href: 'identify-home.html', icon: 'bxc-grid-search', label: 'Identify' },
        { href: 'cats-home.html',     icon: 'bxs-category',    label: 'Categories' },
        { href: 'phonics-home.html',  icon: 'bxc-open-book',   label: 'Phonics' },
        { href: 'history.html',       icon: 'bxs-group',       label: 'Pupil Data' },
        { href: 'programs.html',      icon: 'bxc-folder-cog',  label: 'Programs' },
        { href: 'reinforcers.html',   icon: 'bxc-lightbulb',   label: 'Reinforcers' },
    ];

    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const currentPage = window.location.pathname.split('/').pop() || 'home.html';

    const items = NAV_ITEMS.map(({ href, icon, label }) => `
        <li${currentPage === href ? ' class="active"' : ''}>
            <a href="${href}"><i class="bx ${icon} bx-sm"></i><span class="text">${label}</span></a>
        </li>`).join('');

    sidebar.innerHTML = `
        <a href="home.html" class="brand">
            <img src="images/animation/sprout.png" alt="Sprout Logo" class="brand-logo">
            <span class="text">Sprout</span>
        </a>
        <ul class="side-menu top">${items}</ul>`;
})();
