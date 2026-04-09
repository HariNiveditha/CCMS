// ══════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════
let adminClubs       = [];   // clubs this admin manages
let currentClubIndex = 0;    // which club is active

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
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const userRole   = localStorage.getItem('userRole');
  const userName   = localStorage.getItem('userName') || 'Admin';

  // Accept "admin" regardless of surrounding whitespace or casing
  const isAdmin = isLoggedIn && userRole && userRole.trim().toLowerCase() === 'admin';

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
  loadAdminClubs(userName);
});

// ══════════════════════════════════════════════
//  DATA LAYER
// ══════════════════════════════════════════════
function loadAdminClubs(userName) {
  const stored = localStorage.getItem('adminClubs');

  if (stored) {
    adminClubs = JSON.parse(stored);
    // Restore ID sequences so new records don't collide
    adminClubs.forEach(club => {
      club.members.forEach(m => { if (m.id >= memberIdSeq) memberIdSeq = m.id + 1; });
      club.events .forEach(e => { if (e.id >= eventIdSeq)  eventIdSeq  = e.id + 1; });
    });
  } else {
    // ── Demo seed — shown when no backend data has been stored yet ─────
    adminClubs = [
      {
        id: 1,
        name: 'HICON',
        recruitmentOpen: false,
        members: [
          { id: memberIdSeq++, userId: '22CS01', name: 'Arjun Sharma', email: 'arjun@college.edu', role: 'coordinator', joined: '2025-08-01' },
          { id: memberIdSeq++, userId: '22CS02', name: 'Priya Nair',   email: 'priya@college.edu', role: 'volunteer',   joined: '2025-09-10' },
        ],
        events: [
          {
            id: eventIdSeq++, title: 'Hackathon 2026',
            date: '2026-04-15T09:00', location: 'Seminar Hall B',
            category: 'Technical', description: '24-hour coding challenge.',
            registrants: [
              { name: 'Ravi Kumar',  rollNo: '22CS05', email: 'ravi@college.edu' },
              { name: 'Sneha Gupta', rollNo: '22CS08', email: 'sneha@college.edu' },
            ]
          }
        ]
      },
      {
        id: 2,
        name: 'Chaitanya Geethi',
        recruitmentOpen: true,
        members: [
          { id: memberIdSeq++, userId: '22AR01', name: 'Meera Iyer', email: 'meera@college.edu', role: 'coordinator', joined: '2025-07-20' },
        ],
        events: []
      },
      {
        id: 3,
        name: 'Chaitanya Kreeda',
        recruitmentOpen: false,
        members: [],
        events: []
      }
    ];
    persist();
  }

  populateClubSelector();
  renderCurrentClub();
}

function persist() {
  localStorage.setItem('adminClubs', JSON.stringify(adminClubs));
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

function switchClub() {
  currentClubIndex = parseInt(document.getElementById('clubSelector').value, 10);
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
  const titles = { overview: 'Overview', members: 'Members', events: 'Events' };
  document.getElementById('topbarTitle').textContent = titles[page] || page;
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

  const track  = document.getElementById('toggleTrack');
  const status = document.getElementById('recruitStatus');
  if (club.recruitmentOpen) {
    track.classList.add('on');
    status.textContent = 'OPEN';
    status.classList.add('open');
  } else {
    track.classList.remove('on');
    status.textContent = 'CLOSED';
    status.classList.remove('open');
  }
}

function toggleRecruitment() {
  currentClub().recruitmentOpen = !currentClub().recruitmentOpen;
  persist();
  renderOverview();
}

// ── Members ───────────────────────────────────
function renderMembers() {
  const tbody   = document.getElementById('membersTbody');
  const members = currentClub().members;

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
            <div style="font-size:0.72rem;color:var(--text-muted);font-family:'DM Mono',monospace;">${m.userId}</div>
          </div>
        </div>
      </td>
      <td style="color:var(--text-muted);font-size:0.82rem;">${m.email}</td>
      <td>
        <span class="badge ${m.role === 'coordinator' ? 'badge-yellow' : 'badge-blue'}">
          ${m.role}
        </span>
      </td>
      <td style="color:var(--text-muted);font-size:0.82rem;font-family:'DM Mono',monospace;">${m.joined}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="removeMember(${m.id})">Remove</button>
      </td>
    </tr>
  `).join('');
}

function addMember() {
  const userId = document.getElementById('newMemberUserId').value.trim();
  const name   = document.getElementById('newMemberName').value.trim();
  const email  = document.getElementById('newMemberEmail').value.trim();
  const role   = document.getElementById('newMemberRole').value;

  if (!userId || !name || !email) { alert('Please fill all fields.'); return; }

  currentClub().members.push({
    id: memberIdSeq++, userId, name, email, role,
    joined: new Date().toISOString().slice(0, 10)
  });
  persist();

  ['newMemberUserId', 'newMemberName', 'newMemberEmail'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('newMemberRole').value = 'volunteer';

  closeModal('addMemberModal');
  renderMembers();
  renderOverview();
}

function removeMember(id) {
  if (!confirm('Remove this member from the club?')) return;
  const club = currentClub();
  club.members = club.members.filter(m => m.id !== id);
  persist();
  renderMembers();
  renderOverview();
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

function createEvent() {
  const title    = document.getElementById('newEventTitle').value.trim();
  const date     = document.getElementById('newEventDate').value;
  const location = document.getElementById('newEventLocation').value.trim();
  const category = document.getElementById('newEventCategory').value;
  const desc     = document.getElementById('newEventDesc').value.trim();

  if (!title || !date) { alert('Title and date are required.'); return; }

  currentClub().events.push({
    id: eventIdSeq++, title, date, location, category,
    description: desc, registrants: []
  });
  persist();

  ['newEventTitle', 'newEventDate', 'newEventLocation', 'newEventDesc'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('newEventCategory').value = 'Technical';

  closeModal('addEventModal');
  renderEvents();
  renderOverview();
}

function deleteEvent(id) {
  if (!confirm('Delete this event? This cannot be undone.')) return;
  const club = currentClub();
  club.events = club.events.filter(e => e.id !== id);
  persist();
  renderEvents();
  renderOverview();
}

function viewRegistrants(eventId) {
  const event = currentClub().events.find(e => e.id === eventId);
  if (!event) return;

  document.getElementById('registrantsModalTitle').textContent = `Registrants — ${event.title}`;

  const list = document.getElementById('registrantsList');
  if (!event.registrants.length) {
    list.innerHTML = `<p class="empty" style="padding:1rem 0;">No registrants yet.</p>`;
  } else {
    list.innerHTML = event.registrants.map(r => `
      <div class="registrant-item">
        <div class="r-avatar">${r.name.slice(0, 2).toUpperCase()}</div>
        <div>
          <div style="font-weight:600;font-size:0.85rem;">${r.name}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);font-family:'DM Mono',monospace;">
            ${r.rollNo} · ${r.email}
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
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ══════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}