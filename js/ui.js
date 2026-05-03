const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');

allSideMenu.forEach(item => {
    const li = item.parentElement;

    item.addEventListener('click', function () {
        allSideMenu.forEach(i => {
            i.parentElement.classList.remove('active');
        })
        li.classList.add('active');
    })
});

// TOGGLE SIDEBAR
const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebar = document.getElementById('sidebar');

if (menuBar && sidebar) {
    menuBar.addEventListener('click', function () {
        sidebar.classList.toggle('hide');
    });
}

function adjustSidebar() {
    if (!sidebar) return;
    // always hide on small screens; never auto-open — user toggles manually
    if (window.innerWidth <= 576) {
        sidebar.classList.add('hide');
    }
}

// start collapsed on every page load (suppress transition so it doesn't animate in on navigation)
if (sidebar) {
    sidebar.style.transition = 'none';
    sidebar.classList.add('hide');
    requestAnimationFrame(() => { sidebar.style.transition = ''; });
}

window.addEventListener('resize', adjustSidebar);


// Dark Mode Switch
const switchMode = document.getElementById('switch-mode');

if (switchMode) {
    switchMode.addEventListener('change', function () {
        document.body.classList.toggle('dark', this.checked);
    });
}
