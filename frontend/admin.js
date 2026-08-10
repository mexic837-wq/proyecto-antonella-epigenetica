// Admin Panel Navigation Logic
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.admin-nav-item');
    const views = document.querySelectorAll('.admin-view-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all nav items
            navItems.forEach(nav => {
                nav.classList.remove('active', 'bg-primary-50', 'text-primary-700');
                nav.classList.add('text-clinical-muted', 'hover:bg-slate-50', 'hover:text-clinical-text');
            });

            // Add active class to clicked item
            item.classList.add('active', 'bg-primary-50', 'text-primary-700');
            item.classList.remove('text-clinical-muted', 'hover:bg-slate-50', 'hover:text-clinical-text');

            // Hide all views
            views.forEach(view => {
                view.classList.add('hidden');
            });

            // Show target view
            const targetId = item.getAttribute('data-target');
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.classList.remove('hidden');
            }
        });
    });
});
