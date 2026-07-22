const API = 'http://localhost:3000/api';

// Load dashboard data
async function loadDashboard() {
  try {
    // Get user info from localStorage
    const userName = localStorage.getItem('userName') || 'User';
    const userEmail = localStorage.getItem('userEmail');

    console.log('🔍 Dashboard Loading...');
    console.log('User Name:', userName);
    console.log('User Email:', userEmail);

    // Update welcome text
    document.getElementById('welcomeText').innerText = `Welcome, ${userName} 👋`;

    // If email exists, fetch user-specific data from backend
    if (userEmail) {
      console.log('✅ Email found, fetching user data from backend...');
      await fetchUserData(userEmail);
    } else {
      console.log('⚠️ No email found, falling back to all data...');
      // Fallback: fetch all events and clubs
      await fetchAllData();
    }
  } catch (error) {
    console.error('❌ Error loading dashboard:', error);
    // Fallback to all data on error
    await fetchAllData();
  }
}

// Fetch user-specific data from backend
async function fetchUserData(email) {
  try {
    console.log(`📡 Fetching events for email: ${email}`);
    // Fetch user's registered events
    const eventsResponse = await fetch(`${API}/events/user/registered/${email}`);
    const eventsData = await eventsResponse.json();
    console.log('📊 Events Response:', eventsData);

    console.log(`📡 Fetching clubs for email: ${email}`);
    // Fetch user's joined clubs
    const clubsResponse = await fetch(`${API}/clubs/user/${email}`);
    const clubsData = await clubsResponse.json();
    console.log('📊 Clubs Response:', clubsData);

    if (eventsData.success) {
      console.log('✅ Events loaded:', eventsData.data.length);
      displayEvents(eventsData.data);
    } else {
      console.log('⚠️ Events failed:', eventsData.message);
      document.getElementById('eventsList').innerHTML = '<p>No events found.</p>';
    }

    if (clubsData.success) {
      console.log('✅ Clubs loaded:', clubsData.data.length);
      displayClubs(clubsData.data);
    } else {
      console.log('⚠️ Clubs failed:', clubsData.message);
      document.getElementById('clubsList').innerHTML = '<p>No clubs found.</p>';
    }
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    // Fallback to all data on error
    await fetchAllData();
  }
}

// Fallback: fetch all data
async function fetchAllData() {
  try {
    const eventsResponse = await fetch(`${API}/events`);
    const clubsResponse = await fetch(`${API}/clubs`);

    const eventsData = await eventsResponse.json();
    const clubsData = await clubsResponse.json();

    if (eventsData.success) {
      displayEvents(eventsData.data);
    }

    if (clubsData.success) {
      displayClubs(clubsData.data);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Display events
function displayEvents(events) {
  const eventsList = document.getElementById('eventsList');
  eventsList.innerHTML = '';

  if (!events || events.length === 0) {
    eventsList.innerHTML = '<p style="color: #666; text-align: center;">No events registered yet.</p>';
    document.getElementById('eventCount').innerText = '0';
    return;
  }

  // Update event count
  document.getElementById('eventCount').innerText = events.length;

  // Filter upcoming events
  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.date) >= now);

  if (upcomingEvents.length === 0) {
    eventsList.innerHTML = '<p style="color: #666; text-align: center;">No upcoming events.</p>';
    return;
  }

  // Display upcoming events
  upcomingEvents.forEach(event => {
    const eventDate = new Date(event.date);
    const dateStr = eventDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = eventDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <b>${event.title}</b><br>
      <small style="color: #666;">🏛️ ${event.club_name || 'General'}</small><br>
      <small style="color: #999;">📅 ${dateStr} at ${timeStr}</small><br>
      <small style="color: #999;">📍 ${event.location || 'TBD'}</small>
    `;
    eventsList.appendChild(div);
  });
}

// Display clubs
function displayClubs(clubs) {
  const clubsList = document.getElementById('clubsList');
  clubsList.innerHTML = '';

  if (!clubs || clubs.length === 0) {
    clubsList.innerHTML = '<p style="color: #666; text-align: center;">No clubs joined yet.</p>';
    document.getElementById('clubCount').innerText = '0';
    return;
  }

  // Update club count
  document.getElementById('clubCount').innerText = clubs.length;

  // Display clubs
  clubs.forEach(club => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <b>${club.name}</b><br>
      <small style="color: #666;">${club.description || 'No description'}</small>
    `;
    clubsList.appendChild(div);
  });
}

// Logout function
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// Load dashboard when page loads
document.addEventListener('DOMContentLoaded', loadDashboard);
