/**
 * MEMBER PROFILE PAGE
 * Displays member details for club administrators
 * Supports viewing and editing member information
 */

// ════════════════════════════════════════════════════════════════
//  CONFIGURATION
// ════════════════════════════════════════════════════════════════
const API_BASE = 'http://localhost:3000/api';
let currentMember = null;
let isEditMode = false;

// ════════════════════════════════════════════════════════════════
//  INITIALIZATION
// ════════════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  // 1. Check authentication and authorization
  if (!checkAuth()) {
    return;
  }

  // 2. Get member ID from URL parameters
  const memberId = getUrlParameter('id');
  if (!memberId) {
    showError('No member ID provided');
    return;
  }

  // 3. Load member data
  await loadMemberData(memberId);

  // 4. Setup event listeners
  setupEventListeners();
}

// ════════════════════════════════════════════════════════════════
//  AUTHENTICATION & AUTHORIZATION
// ════════════════════════════════════════════════════════════════
function checkAuth() {
  const isLoggedIn = window.CCMSAuth
    ? CCMSAuth.isLoggedIn()
    : localStorage.getItem('isLoggedIn') === 'true';

  const isAdmin = window.CCMSAuth
    ? CCMSAuth.isAdmin()
    : (localStorage.getItem('userRole') || '').trim().toLowerCase() === 'admin';

  // Show auth gate if not logged in or not admin
  if (!isLoggedIn || !isAdmin) {
    document.getElementById('authGate').style.display = 'flex';
    document.getElementById('appShell').style.display = 'none';
    return false;
  }

  // Show main content
  document.getElementById('appShell').style.display = 'block';
  document.getElementById('authGate').style.display = 'none';
  return true;
}

// ════════════════════════════════════════════════════════════════
//  DATA FETCHING
// ════════════════════════════════════════════════════════════════
async function loadMemberData(memberId) {
  try {
    showLoading(true);

    // Fetch user profile data
    // Note: This endpoint needs to be created in your backend
    // GET /api/auth/user/:id
    const response = await fetch(`${API_BASE}/auth/user/${memberId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Member not found');
      }
      throw new Error(`Failed to load member data (${response.status})`);
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to load member data');
    }

    currentMember = result.data;
    displayMemberProfile();
    showLoading(false);

  } catch (error) {
    console.error('Error loading member data:', error);
    showError(error.message);
  }
}

// ════════════════════════════════════════════════════════════════
//  UI RENDERING
// ════════════════════════════════════════════════════════════════
function displayMemberProfile() {
  if (!currentMember) return;

  const {
    id,
    name = 'N/A',
    email = 'N/A',
    phone = 'N/A',
    branch = 'N/A',
    year = 'N/A',
    club_name = 'N/A',
    role = 'Member',
    created_at = null,
    updated_at = null,
    joined_at = null
  } = currentMember;

  // Header
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  document.getElementById('avatarInitials').textContent = initials;
  document.getElementById('memberName').textContent = name;
  document.getElementById('memberRole').textContent = role.toUpperCase();

  // Personal Information
  document.getElementById('memberEmail').textContent = email;
  document.getElementById('memberPhone').textContent = formatPhoneNumber(phone);
  document.getElementById('memberBranch').textContent = branch;
  document.getElementById('memberYear').textContent = year;
  document.getElementById('memberClub').textContent = club_name;

  // Dates
  const joinDate = joined_at || created_at;
  const updateDate = updated_at || created_at;

  document.getElementById('memberJoinDate').textContent = joinDate
    ? formatDate(joinDate)
    : 'N/A';

  document.getElementById('accountCreated').textContent = created_at
    ? formatDate(created_at)
    : 'N/A';

  document.getElementById('lastUpdated').textContent = updateDate
    ? formatDate(updateDate)
    : 'N/A';

  // Additional Info
  document.getElementById('membershipStatus').textContent = 'Active';
  document.getElementById('membershipStatus').className = 'badge badge-active';

  // Populate edit form
  populateEditForm();

  // Show content
  document.getElementById('profileContent').style.display = 'block';
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'none';
}

function populateEditForm() {
  if (!currentMember) return;

  document.getElementById('editName').value = currentMember.name || '';
  document.getElementById('editEmail').value = currentMember.email || '';
  document.getElementById('editPhone').value = currentMember.phone || '';
  document.getElementById('editBranch').value = currentMember.branch || '';
  document.getElementById('editYear').value = currentMember.year || '';
}

function showLoading(show) {
  document.getElementById('loadingState').style.display = show ? 'flex' : 'none';
}

function showError(message) {
  document.getElementById('errorState').style.display = 'block';
  document.getElementById('errorMessage').textContent = message;
  document.getElementById('profileContent').style.display = 'none';
  document.getElementById('loadingState').style.display = 'none';
}

// ════════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ════════════════════════════════════════════════════════════════
function setupEventListeners() {
  // Edit button
  document.getElementById('editBtn').addEventListener('click', toggleEditMode);

  // Cancel edit
  document.getElementById('closeEditBtn').addEventListener('click', toggleEditMode);
  document.getElementById('cancelBtn').addEventListener('click', toggleEditMode);

  // Save changes
  document.getElementById('saveBtn').addEventListener('click', saveMemberChanges);

  // Remove member
  document.getElementById('removeBtn').addEventListener('click', removeMember);

  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'admin_dashboard.html';
  });

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

// ════════════════════════════════════════════════════════════════
//  EDIT MODE
// ════════════════════════════════════════════════════════════════
function toggleEditMode() {
  isEditMode = !isEditMode;

  const displayMode = document.getElementById('displayMode');
  const editMode = document.getElementById('editMode');
  const editBtn = document.getElementById('editBtn');
  const closeEditBtn = document.getElementById('closeEditBtn');

  if (isEditMode) {
    displayMode.style.display = 'none';
    editMode.style.display = 'grid';
    editBtn.style.display = 'none';
    closeEditBtn.style.display = 'block';
  } else {
    displayMode.style.display = 'grid';
    editMode.style.display = 'none';
    editBtn.style.display = 'block';
    closeEditBtn.style.display = 'none';
  }
}

async function saveMemberChanges() {
  if (!currentMember) return;

  try {
    // Collect form data
    const updatedData = {
      name: document.getElementById('editName').value.trim(),
      phone: document.getElementById('editPhone').value.trim(),
      branch: document.getElementById('editBranch').value,
      year: document.getElementById('editYear').value
    };

    // Validation
    if (!updatedData.name) {
      alert('Name is required');
      return;
    }

    if (updatedData.phone && !isValidPhoneNumber(updatedData.phone)) {
      alert('Please enter a valid phone number');
      return;
    }

    // Send update request
    // Note: This endpoint needs to be created in your backend
    // PUT /api/auth/user/:id
    const response = await fetch(`${API_BASE}/auth/user/${currentMember.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to update member profile');
    }

    // Update local data and re-render
    Object.assign(currentMember, updatedData);
    currentMember.updated_at = new Date().toISOString();

    displayMemberProfile();
    toggleEditMode();

    // Show success message
    alert('Member profile updated successfully!');

  } catch (error) {
    console.error('Error saving changes:', error);
    alert(`Error: ${error.message}`);
  }
}

async function removeMember() {
  if (!currentMember) return;

  const confirm = window.confirm(
    `Are you sure you want to remove ${currentMember.name} from the club?\n\nThis action cannot be undone.`
  );

  if (!confirm) return;

  try {
    // Note: This endpoint needs to be created in your backend
    // DELETE /api/auth/user/:id
    const response = await fetch(`${API_BASE}/auth/user/${currentMember.id}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to remove member');
    }

    alert('Member removed successfully');
    window.location.href = 'admin_dashboard.html';

  } catch (error) {
    console.error('Error removing member:', error);
    alert(`Error: ${error.message}`);
  }
}

// ════════════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════
function getUrlParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateString || 'N/A';
  }
}

function formatPhoneNumber(phone) {
  if (!phone) return 'N/A';
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function isValidPhoneNumber(phone) {
  if (!phone) return true; // Phone is optional
  // Accept phones with 10+ digits
  return /^\d{10,}$/.test(phone.replace(/\D/g, ''));
}

function logout() {
  if (window.CCMSAuth) {
    CCMSAuth.logout();
  } else {
    localStorage.clear();
  }
  window.location.href = 'index.html';
}

// ════════════════════════════════════════════════════════════════
//  CONSOLE UTILITIES (for debugging)
// ════════════════════════════════════════════════════════════════
if (window.location.search.includes('debug')) {
  console.log('📋 Member Profile Debug Mode');
  console.log('Current Member:', currentMember);
  console.log('API Base:', API_BASE);
}
