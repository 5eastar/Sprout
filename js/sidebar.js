// sidebar.js — renders the sidebar nav once from a single source of truth.
// Active item is detected from the current page filename in the URL.
(function () {
    const inPages = window.location.pathname.replace(/\\/g, '/').includes('/pages/');
    const toHome  = inPages ? '../' : '';
    const toPages = inPages ? '' : 'pages/';

    const NAV_ITEMS = [
        { href: toHome  + 'home.html',          icon: 'bxs-home',        label: 'Home' },
        { href: toPages + 'identify-home.html', icon: 'bxc-grid-search', label: 'Identify' },
        { href: toPages + 'cats-home.html',     icon: 'bxs-category',    label: 'Categories' },
        { href: toPages + 'phonics-home.html',  icon: 'bxc-open-book',   label: 'Phonics' },
        { href: toPages + 'history.html',       icon: 'bxs-group',       label: 'Pupil Data' },
        { href: toPages + 'programs.html',      icon: 'bxc-folder-cog',  label: 'Programs' },
        { href: toPages + 'reinforcers.html',   icon: 'bxc-lightbulb',   label: 'Reinforcers' },
    ];

    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const currentPage = window.location.pathname.split('/').pop() || 'home.html';

    const items = NAV_ITEMS.map(({ href, icon, label }) => `
        <li${currentPage === href.split('/').pop() ? ' class="active"' : ''}>
            <a href="${href}"><i class="bx ${icon} bx-sm"></i><span class="text">${label}</span></a>
        </li>`).join('');

    sidebar.innerHTML = `
        <a href="${toHome}home.html" class="brand">
            <img src="${toHome}images/animation/sprout.png" alt="Sprout Logo" class="brand-logo">
            <span class="text">Sprout</span>
        </a>
        <ul class="side-menu top">${items}</ul>`;
})();
