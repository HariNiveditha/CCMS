// ══════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════
let adminClubs       = [];   // clubs this admin manages
let currentClubIndex = 0;    // which club is active
let availableUsersCache = [];

// Each club: { id, name, recruitmentOpen, members:[], events:[] }
// member:    { id, userId, name, email, role, joined }
// event:     { id, title, date, location, category, description, registrants:[] }
let memberIdSeq = 1;
let eventIdSeq  = 1;

// ══════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {

  // ── Auth gate ─────────────────────────────────────────────────────────
  const isLoggedIn = window.CCMSAuth
    ? CCMSAuth.isLoggedIn()
    : localStorage.getItem('isLoggedIn') === 'true';
  const isAdmin = window.CCMSAuth
    ? CCMSAuth.isAdmin()
    : (localStorage.getItem('userRole') || '').trim().toLowerCase() === 'admin';
  const sessionUser = window.CCMSAuth ? CCMSAuth.getUser() : null;
  const userName =
    (sessionUser && sessionUser.name) ||
    localStorage.getItem('userName') ||
    'Admin';

  if (!isLoggedIn) {
    window.location.href = 'login.html';
    return;
  }

  if (!isAdmin) {

    document.getElementById('authGate').style.display = 'flex';
    return;
  }

  document.getElementById('appShell').style.display = 'flex';

  // ── Topbar ────────────────────────────────────────────────────────────
  document.getElementById('usernameEl').textContent = userName;
  document.getElementById('avatarEl').textContent   = userName.slice(0, 2).toUpperCase();

  // ── Modal backdrop — close on outside click ───────────────────────────
  // MUST be inside DOMContentLoaded so the elements already exist
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', function (e) {
      if (e.target === this) this.classList.remove('open');
    });
  });

  // ── Load clubs ────────────────────────────────────────────────────────
  loadAdminClubs();
  loadJoinRequests();
});

// ══════════════════════════════════════════════
//  DATA LAYER
// ══════════════════════════════════════════════
async function loadAdminClubs() {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('No user ID found');
      window.location.href = 'login.html';
      return;
    }

    // Fetch clubs managed by this admin from the database
    const response = await fetch(`http://localhost:3000/api/clubs/admin/${userId}`);
    const data = await response.json();

    if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
      console.warn('No clubs assigned to this admin');
      window.location.href = 'clubs.html';
      return;
    }

    // Normalize shape
    adminClubs = data.data.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description || '',
      admin_id: c.admin_id,
      recruitmentOpen: Boolean(c.recruitmentOpen),
      eventRegistrationsOpen: Boolean(c.eventRegistrationsOpen),
      members: [],
      events: Array.isArray(c.events) ? c.events : []
    }));

    populateClubSelector();
    await loadClubMembers();
    await loadClubEvents();
    renderCurrentClub();
  } catch (err) {
    console.error('Error loading clubs:', err);
    alert('Error loading clubs. Please try again.');
  }
}

async function loadClubEvents() {
  const club = currentClub();
  if (!club) return;

  try {
    const response = await fetch(`http://localhost:3000/api/events/club/${club.id}`);
    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      const events = await Promise.all(data.data.map(async (event) => {
        try {
          const registrationsResponse = await fetch(`http://localhost:3000/api/events/${event.id}/registrations`);
          const registrationsData = await registrationsResponse.json();
          const registrants = registrationsData.success && Array.isArray(registrationsData.data)
            ? registrationsData.data
            : [];

          return {
            id: event.id,
            title: event.title,
            date: event.date,
            location: event.location,
            description: event.description,
            registrants
          };
        } catch (err) {
          return {
            id: event.id,
            title: event.title,
            date: event.date,
            location: event.location,
            description: event.description,
            registrants: []
          };
        }
      }));

      club.events = events;
    }
  } catch (err) {
    console.error('Error loading events:', err);
  }
}

// Load members for the current club from the database
async function loadClubMembers() {
  const club = currentClub();
  if (!club) return;

  try {
    const response = await fetch(`http://localhost:3000/api/clubs/${club.id}/members`);
    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      club.members = data.data.map(m => ({
        id: m.id,
        userId: m.user_id,
        name: m.name,
        email: m.email,
        branch: m.branch,
        year: m.year,
        phone: m.phone,
        rollNumber: m.roll_number,
        role: m.role,
        status: m.status,
        joined: m.joined_at ? new Date(m.joined_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
      }));
    }
  } catch (err) {
    console.error('Error loading members:', err);
  }
}

function currentClub() {
  return adminClubs[currentClubIndex];
}

// ══════════════════════════════════════════════
//  CLUB SELECTOR
// ══════════════════════════════════════════════
function populateClubSelector() {
  const sel = document.getElementById('clubSelector');
  sel.innerHTML = adminClubs.map((c, i) =>
    `<option value="${i}">${c.name}</option>`
  ).join('');
  sel.value = currentClubIndex;
}

async function switchClub() {
  currentClubIndex = parseInt(document.getElementById('clubSelector').value, 10);
  await loadClubMembers();
  await loadClubEvents();
  renderCurrentClub();
}

// ══════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  const titles = { overview: 'Overview', members: 'Members', events: 'Events', requests: 'Join Requests' };
  document.getElementById('topbarTitle').textContent = titles[page] || page;
  if (page === 'requests') renderRequests();
}

// ══════════════════════════════════════════════
//  RENDER CURRENT CLUB
// ══════════════════════════════════════════════
function renderCurrentClub() {
  const club = currentClub();
  document.getElementById('clubNameTitle').textContent = club.name;
  renderOverview();
  renderMembers();
  renderEvents();
}

// ── Overview ──────────────────────────────────
function renderOverview() {
  const club     = currentClub();
  const now      = new Date();
  const upcoming = club.events.filter(e => new Date(e.date) >= now).length;
  const coords   = club.members.filter(m => m.role === 'coordinator').length;

  document.getElementById('statMembers').textContent  = club.members.length;
  document.getElementById('statEvents').textContent   = club.events.length;
  document.getElementById('statUpcoming').textContent = upcoming;
  document.getElementById('statCoords').textContent   = coords;

  // Recruitment status
  const track  = document.getElementById('recruitmentTrack');
  const status = document.getElementById('recruitStatus');
  if (club.recruitmentOpen) {
    if (track) track.classList.add('active');
    status.textContent = 'OPEN';
    status.className = 'recruit-status status-badge open';
  } else {
    if (track) track.classList.remove('active');
    status.textContent = 'CLOSED';
    status.className = 'recruit-status status-badge closed';
  }

  // Event registrations status
  const eventTrack  = document.getElementById('eventRegTrack');
  const eventStatus = document.getElementById('eventRegStatus');
  if (club.eventRegistrationsOpen) {
    if (eventTrack) eventTrack.classList.add('active');
    eventStatus.textContent = 'OPEN';
    eventStatus.className = 'event-registrations-status status-badge open';
  } else {
    if (eventTrack) eventTrack.classList.remove('active');
    eventStatus.textContent = 'CLOSED';
    eventStatus.className = 'event-registrations-status status-badge closed';
  }
}

async function toggleRecruitment() {
  const club = currentClub();
  if (!club) return;

  const nextValue = !club.recruitmentOpen;

  try {
    const response = await fetch(`http://localhost:3000/api/clubs/${club.id}/recruitment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recruitmentOpen: nextValue })
    });

    const data = await response.json();
    if (!data.success) {
      alert(data.message || 'Failed to update recruitment status');
      return;
    }

    club.recruitmentOpen = nextValue;
    renderOverview();
  } catch (err) {
    console.error('Error updating recruitment status:', err);
    alert('Error updating recruitment status. Please try again.');
  }
}

async function toggleEventRegistrations() {
  const club = currentClub();
  if (!club) return;

  const nextValue = !club.eventRegistrationsOpen;

  try {
    const response = await fetch(`http://localhost:3000/api/clubs/${club.id}/event-registrations`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventRegistrationsOpen: nextValue })
    });

    const data = await response.json();
    if (!data.success) {
      alert(data.message || 'Failed to update event registrations status');
      return;
    }

    club.eventRegistrationsOpen = nextValue;
    renderOverview();
  } catch (err) {
    console.error('Error updating event registrations status:', err);
    alert('Error updating event registrations status. Please try again.');
  }
}

// ── Members ───────────────────────────────────
function renderMembers() {
  const tbody   = document.getElementById('membersTbody');
  const members = currentClub().members || [];

  if (!members.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">No members yet. Add one above.</td></tr>`;
    return;
  }

  tbody.innerHTML = members.map((m, i) => `
    <tr>
      <td style="color:var(--text-muted);font-family:'DM Mono',monospace;font-size:0.75rem;">${i + 1}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="r-avatar">${m.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <div style="font-weight:600;">${m.name}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);font-family:'DM Mono',monospace;">${m.email}</div>
          </div>
        </div>
      </td>
      <td style="color:var(--text-muted);font-size:0.82rem;">${m.email}</td>
      <td>
        <span class="badge ${m.role === 'coordinator' ? 'badge-yellow' : 'badge-blue'}">${m.role}</span>
      </td>
      <td style="color:var(--text-muted);font-size:0.82rem;font-family:'DM Mono',monospace;">${m.joined}</td>
      <td>
        <button class="btn btn-info btn-sm" onclick="viewMemberProfile(${m.userId})" style="margin-right:0.5rem;">View</button>
        <button class="btn btn-danger btn-sm" onclick="removeMember(${m.id}, ${m.userId})">Remove</button>
      </td>
    </tr>
  `).join('');
}

// Load available users (registered users not yet in this club)
async function loadAvailableUsers() {
  const club = currentClub();
  if (!club) return;

  try {
    const response = await fetch(`http://localhost:3000/api/clubs/${club.id}/available-users`);
    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      availableUsersCache = data.data;
      displayAvailableUsers();
    }
  } catch (err) {
    console.error('Error loading available users:', err);
    document.getElementById('availableUsersList').innerHTML = `<div style="padding: 20px; text-align: center; color: #d32f2f;">Error loading users</div>`;
  }
}

// Display available users in the list
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function displayAvailableUsers(users = availableUsersCache) {
  const container = document.getElementById('availableUsersList');
  const searchTerm = document.getElementById('memberSearchInput').value.trim().toLowerCase();

  // Filter by search term
  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm) || 
    u.email.toLowerCase().includes(searchTerm)
  );

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding: 20px; text-align: center; color: #999;">No users found</div>`;
    return;
  }

  container.innerHTML = filtered.map(u => `
    <button type="button"
         onclick="selectUserFromButton(this)"
         data-user-id="${u.id}"
         data-user-name="${escapeHtml(u.name)}"
         data-user-email="${escapeHtml(u.email)}"
         style="width:100%;text-align:left;padding:12px;border:0;border-bottom:1px solid #eee;cursor:pointer;background:#fff;">
      <div style="font-weight:600;color:#333;">${escapeHtml(u.name)}</div>
      <div style="font-size:0.85rem;color:#999;">${escapeHtml(u.email)}</div>
      <div style="font-size:0.75rem;color:#bbb;">${escapeHtml(u.branch || '—')} • ${escapeHtml(u.year || '—')}</div>
    </button>
  `).join('');
}

// Select a user to add
function selectUser(userId, name, email) {
  document.getElementById('selectedUserId').value = userId;
  document.getElementById('selectedUserDisplay').value = `${name} (${email})`;
}

function selectUserFromButton(button) {
  selectUser(button.dataset.userId, button.dataset.userName, button.dataset.userEmail);
}

// Add selected member to club (API-based)
async function addMemberFromUser() {
  const club = currentClub();
  if (!club) {
    alert('No active club selected. Please wait for the dashboard to finish loading.');
    return;
  }
  const userId = parseInt(document.getElementById('selectedUserId').value, 10);
  const role = document.getElementById('newMemberRole').value;

  if (!userId) {
    alert('Please select a user.');
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/clubs/${club.id}/add-member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    });

    const data = await response.json();

    if (data.success) {
      alert('Member added successfully!');
      document.getElementById('selectedUserId').value = '';
      document.getElementById('selectedUserDisplay').value = '';
      document.getElementById('memberSearchInput').value = '';
      closeModal('addMemberModal');
      
      // Reload members and re-render
      await loadClubMembers();
      renderMembers();
      renderOverview();
    } else {
      alert('Error: ' + (data.message || 'Failed to add member'));
    }
  } catch (err) {
    console.error('Error adding member:', err);
    alert('Error adding member. Please try again.');
  }
}

// Remove member from club (API-based)
async function removeMember(memberId, userId) {
  if (!confirm('Remove this member from the club?')) return;
  
  const club = currentClub();
  
  try {
    const response = await fetch(`http://localhost:3000/api/clubs/${club.id}/members/${userId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      alert('Member removed successfully!');
      await loadClubMembers();
      renderMembers();
      renderOverview();
    } else {
      alert('Error: ' + (data.message || 'Failed to remove member'));
    }
  } catch (err) {
    console.error('Error removing member:', err);
    alert('Error removing member. Please try again.');
  }
}

function viewMemberProfile(userId) {
  const club = currentClub();
  window.location.href = `member_profile.html?id=${userId}&clubId=${club ? club.id : ''}`;
}

// ══════════════════════════════════════════════
//  JOIN REQUESTS
// ══════════════════════════════════════════════
let allRequests  = [];    // from database
let activeFilter = 'pending';

async function loadJoinRequests() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;

  try {
    const response = await fetch(`http://localhost:3000/api/admin/requests?adminId=${userId}`);
    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      allRequests = data.data;
      updateRequestBadge();
    }
  } catch (err) {
    console.error('Error loading join requests:', err);
  }
}

function updateRequestBadge() {
  // Count pending requests
  const pending = allRequests.filter(r => r.status === 'pending').length;

  const badge = document.getElementById('reqBadge');
  if (!badge) return;
  if (pending > 0) {
    badge.textContent = pending;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

function filterRequests(filter) {
  activeFilter = filter;
  document.querySelectorAll('.req-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.filter === filter);
  });
  renderRequests();
}

function renderRequests() {
  const list = document.getElementById('requestsList');
  const myClubIds = adminClubs.map(c => c.id);

  // Filter requests for this admin's clubs
  let filtered = allRequests.filter(r => myClubIds.includes(r.club_id));

  if (activeFilter !== 'all') {
    filtered = filtered.filter(r => r.status === activeFilter);
  }

  // Newest first
  filtered.sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));

  if (!filtered.length) {
    const labels = { pending: 'No pending requests', accepted: 'No accepted requests', rejected: 'No rejected requests', all: 'No requests yet' };
    list.innerHTML = `
      <div class="req-empty">
        <div style="font-size:2rem;">📭</div>
        <p>${labels[activeFilter] || 'No requests found'}</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(r => {
    const initials = r.user_name.slice(0,2).toUpperCase();
    const date = new Date(r.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const isPending = r.status === 'pending';

    const statusBadge = {
      pending:  `<span class="badge badge-yellow">Pending</span>`,
      accepted: `<span class="badge badge-green">Accepted</span>`,
      rejected: `<span class="badge badge-red">Rejected</span>`
    }[r.status] || '';

    const actions = isPending ? `
      <button class="btn btn-success btn-sm" onclick="approveRequest(${r.id})">✓ Approve</button>
      <button class="btn btn-danger  btn-sm" onclick="rejectRequest(${r.id})">✕ Reject</button>
    ` : `<span style="font-size:0.75rem;color:var(--text-muted);">No actions</span>`;

    return `
      <div class="req-card" id="reqCard-${r.id}">
        <div class="req-card-left">
          <div class="req-avatar">${initials}</div>
          <div class="req-info">
            <div class="req-name">${r.user_name}</div>
            <div class="req-email">${r.user_email || '—'} · ${r.branch} ${r.year}</div>
            <div class="req-club">Club: <strong>${r.club_name}</strong></div>
            <div class="req-date">Requested on ${date}</div>
          </div>
        </div>
        <div class="req-card-right">
          ${statusBadge}
          <div class="req-actions">${actions}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function approveRequest(requestId) {
  try {
    const response = await fetch(`http://localhost:3000/api/admin/approve/${requestId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (data.success) {
      alert('Request approved! Member added to club.');
      await loadJoinRequests();
      const club = currentClub();
      if (club) {
        await loadClubMembers();
        renderMembers();
        renderOverview();
      }
      renderRequests();
    } else {
      alert('Error: ' + (data.message || 'Failed to approve request'));
    }
  } catch (err) {
    console.error('Error approving request:', err);
    alert('Error approving request. Please try again.');
  }
}

async function rejectRequest(requestId) {
  if (!confirm('Reject this join request?')) return;

  try {
    const response = await fetch(`http://localhost:3000/api/admin/reject/${requestId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (data.success) {
      alert('Request rejected.');
      await loadJoinRequests();
      updateRequestBadge();
      renderRequests();
    } else {
      alert('Error: ' + (data.message || 'Failed to reject request'));
    }
  } catch (err) {
    console.error('Error rejecting request:', err);
    alert('Error rejecting request. Please try again.');
  }
}

// ── Events ────────────────────────────────────
function renderEvents() {
  const tbody  = document.getElementById('eventsTbody');
  const events = currentClub().events;
  const now    = new Date();

  if (!events.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">No events yet. Create one above.</td></tr>`;
    return;
  }

  tbody.innerHTML = events.map((e, i) => {
    const isPast   = new Date(e.date) < now;
    const dateStr  = new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr  = new Date(e.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const statusBadge = isPast
      ? `<span class="badge badge-red">Completed</span>`
      : `<span class="badge badge-green">Upcoming</span>`;

    return `
      <tr>
        <td style="color:var(--text-muted);font-family:'DM Mono',monospace;font-size:0.75rem;">${i + 1}</td>
        <td style="font-weight:600;">${e.title}</td>
        <td style="font-size:0.82rem;color:var(--text-muted);font-family:'DM Mono',monospace;">${dateStr}<br>${timeStr}</td>
        <td style="font-size:0.82rem;color:var(--text-muted);">${e.location || '—'}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="viewRegistrants(${e.id})">
            👥 ${e.registrants.length}
          </button>
        </td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteEvent(${e.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function createClubEvent() {
  const title    = document.getElementById('newEventTitle').value.trim();
  const date     = document.getElementById('newEventDate').value;
  const location = document.getElementById('newEventLocation').value.trim();
  const category = document.getElementById('newEventCategory').value;
  const desc     = document.getElementById('newEventDesc').value.trim();

  if (!title || !date) { alert('Title and date are required.'); return; }

  try {
    const club = currentClub();
    if (!club) {
      alert('No active club selected. Please wait for the dashboard to finish loading.');
      return;
    }
    const response = await fetch('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        club_id: club.id,
        title,
        category,
        description: desc,
        date,
        location
      })
    });

    const data = await response.json();
    if (!data.success) {
      alert(data.message || 'Failed to create event');
      return;
    }

    ['newEventTitle', 'newEventDate', 'newEventLocation', 'newEventDesc'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('newEventCategory').value = 'Technical';

    closeModal('addEventModal');
    await loadClubEvents();
    renderEvents();
    renderOverview();
  } catch (err) {
    console.error('Error creating event:', err);
    alert('Error creating event. Please try again.');
  }
}

async function deleteEvent(id) {
  if (!confirm('Delete this event? This cannot be undone.')) return;

  try {
    const response = await fetch(`http://localhost:3000/api/events/${id}`, { method: 'DELETE' });
    const data = await response.json();

    if (!data.success) {
      alert(data.message || 'Failed to delete event');
      return;
    }

    await loadClubEvents();
    renderEvents();
    renderOverview();
  } catch (err) {
    console.error('Error deleting event:', err);
    alert('Error deleting event. Please try again.');
  }
}

async function viewRegistrants(eventId) {
  const event = currentClub().events.find(e => e.id === eventId);
  if (!event) return;

  document.getElementById('registrantsModalTitle').textContent = `Registrants — ${event.title}`;

  const list = document.getElementById('registrantsList');
  if (!event.registrants || event.registrants.length === 0) {
    try {
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/registrations`);
      const data = await response.json();
      event.registrants = data.success && Array.isArray(data.data) ? data.data : [];
    } catch (err) {
      console.error('Error loading registrants:', err);
      event.registrants = [];
    }
  }

  if (!event.registrants.length) {
    list.innerHTML = `<p class="empty" style="padding:1rem 0;">No registrants yet.</p>`;
  } else {
    list.innerHTML = event.registrants.map(r => `
      <div class="registrant-item">
        <div class="r-avatar">${r.name.slice(0, 2).toUpperCase()}</div>
        <div>
          <div style="font-weight:600;font-size:0.85rem;">${r.name}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);font-family:'DM Mono',monospace;">
            ${r.roll_number || '—'} · ${r.email}
          </div>
          <div style="font-size:0.72rem;color:var(--text-muted);font-family:'DM Mono',monospace;">
            ${r.special_requirements || 'No additional details'}
          </div>
        </div>
      </div>
    `).join('');
  }

  openModal('registrantsModal');
}

// ══════════════════════════════════════════════
//  MODAL HELPERS
// ══════════════════════════════════════════════
function openModal(id) {
  document.getElementById(id).classList.add('open');
  
  // If opening add member modal, load available users
  if (id === 'addMemberModal') {
    availableUsersCache = [];
    loadAvailableUsers();
    // Add search listener
    const searchInput = document.getElementById('memberSearchInput');
    if (searchInput) {
      searchInput.oninput = () => {
        displayAvailableUsers();
      };
    }
  }
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');

  if (id === 'addMemberModal') {
    document.getElementById('selectedUserId').value = '';
    document.getElementById('selectedUserDisplay').value = '';
    document.getElementById('memberSearchInput').value = '';
    document.getElementById('availableUsersList').innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Loading users...</div>';
  }

  if (id === 'addEventModal') {
    ['newEventTitle', 'newEventDate', 'newEventLocation', 'newEventDesc'].forEach(inputId => {
      const element = document.getElementById(inputId);
      if (element) element.value = '';
    });
    const category = document.getElementById('newEventCategory');
    if (category) category.value = 'Technical';
  }
}

// ══════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}