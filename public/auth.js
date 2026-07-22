/**
 * CCMS shared auth helpers (localStorage session).
 * Expects: isLoggedIn === 'true', user = JSON { id, role, name, email }
 */
(function (global) {
  const KEY_USER = 'user';

  function parseUser() {
    const raw = localStorage.getItem(KEY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  function getRole() {
    const u = parseUser();
    if (u && u.role != null && String(u.role).trim() !== '') {
      return String(u.role).trim().toLowerCase();
    }
    const r = localStorage.getItem('userRole');
    return r ? String(r).trim().toLowerCase() : '';
  }

  function isAdmin() {
    return getRole() === 'admin';
  }

  /**
   * Persist canonical user object (id + role + display fields).
   * Keeps localStorage.user in sync with userId / userRole used elsewhere.
   */
  function saveUser(user) {
    if (!user || typeof user !== 'object') return;
    const minimal = {
      id: user.id != null ? user.id : '',
      role: user.role != null ? String(user.role).trim().toLowerCase() : 'student',
      name: user.name != null ? String(user.name) : '',
      email: user.email != null ? String(user.email) : ''
    };
    localStorage.setItem(KEY_USER, JSON.stringify(minimal));
    if (minimal.id !== '') localStorage.setItem('userId', String(minimal.id));
    localStorage.setItem('userRole', minimal.role);
    if (minimal.name) localStorage.setItem('userName', minimal.name);
    if (minimal.email) localStorage.setItem('userEmail', minimal.email);
  }

  /**
   * Navbar fragment: Dashboard | Admin? | Logout  OR  Login | Sign Up
   * Use inside a larger <nav> that already has Home / Clubs / etc.
   */
  function renderAuthSection(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (!isLoggedIn()) {
      el.innerHTML =
        '<a class="auth-link" href="login.html">Login</a>' +
        '<a class="auth-link" href="signup.html">Sign Up</a>';
      return;
    }

    const adminLink = isAdmin()
      ? '<a class="auth-link" href="admin_dashboard.html">Admin</a>'
      : '';
    el.innerHTML =
      '<a class="auth-link" href="user_dashboard.html">Dashboard</a>' +
      adminLink +
      '<a class="auth-link auth-link-danger" href="#" id="ccmsLogoutLink">Logout</a>';

    const link = el.querySelector('#ccmsLogoutLink');
    if (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
      });
    }
  }

  /**
   * Full top nav for pages that only have a single container (e.g. user dashboard).
   */
  function renderFullNav(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (!isLoggedIn()) {
      el.innerHTML =
        '<a href="index.html">Home</a>' +
        '<a href="clubs.html">Clubs</a>' +
        '<a href="events.html">Events</a>' +
        '<a href="login.html">Login</a>' +
        '<a href="signup.html">Sign Up</a>';
      return;
    }

    const adminLink = isAdmin()
      ? '<a href="admin_dashboard.html">Admin</a>'
      : '';
    el.innerHTML =
      '<a href="index.html">Home</a>' +
      '<a href="clubs.html">Clubs</a>' +
      '<a href="events.html">Events</a>' +
      adminLink +
      '<a href="user_dashboard.html">Dashboard</a>' +
      '<a href="#" id="ccmsLogoutLink2">Logout</a>';

    const link = el.querySelector('#ccmsLogoutLink2');
    if (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
      });
    }
  }

  function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
  }

  function requireLogin() {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  global.CCMSAuth = {
    isLoggedIn,
    getUser: parseUser,
    getRole,
    isAdmin,
    saveUser,
    renderAuthSection,
    renderFullNav,
    logout,
    requireLogin
  };
})(window);
