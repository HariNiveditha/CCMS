// Navigation helper functions
function getBackUrl() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Special cases for club and event registration pages
    if (currentPage === 'club-join.html') {
        return 'clubs.html';
    }
    if (currentPage === 'event-registration.html') {
        return 'events.html';
    }
    
    // For all other pages, go back to home
    return 'index.html';
}

function renderNavigation() {
    const nav = document.querySelector('nav.global-nav');
    if (!nav) return;
    
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        nav.innerHTML = `
            <div class="nav-container">
                <a href="index.html" class="nav-link">Home</a>
            </div>
        `;
        return;
    }
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // On home page, don't show back button
    if (currentPage === 'index.html') {
        nav.innerHTML = `
            <div class="nav-container">
                <div class="nav-links-left">
                    <a href="index.html" class="nav-link active">Home</a>
                    <a href="clubs.html" class="nav-link">Clubs</a>
                    <a href="events.html" class="nav-link">Events</a>
                    <a href="user_dashboard.html" class="nav-link">Dashboard</a>
                </div>
            </div>
        `;
        return;
    }
    
    // On other pages, don't show Home link (to avoid duplication with back button)
    const backUrl = getBackUrl();
    const backLabel = backUrl === 'clubs.html' ? '← Back to Clubs' :
                     backUrl === 'events.html' ? '← Back to Events' :
                     backUrl === 'index.html' ? '← Back to Home' :
                     '← Back';
    
    nav.innerHTML = `
        <div class="nav-container">
            <div class="nav-links-left">
                <a href="clubs.html" class="nav-link ${currentPage === 'clubs.html' ? 'active' : ''}">Clubs</a>
                <a href="events.html" class="nav-link ${currentPage === 'events.html' ? 'active' : ''}">Events</a>
                <a href="user_dashboard.html" class="nav-link ${currentPage === 'user_dashboard.html' ? 'active' : ''}">Dashboard</a>
            </div>
            <div class="nav-links-right">
                <a href="${backUrl}" class="nav-link back-link">${backLabel}</a>
            </div>
        </div>
    `;
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}
