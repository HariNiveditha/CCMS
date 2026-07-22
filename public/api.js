/**
 * CCMS API Helper Module
 * Centralized API calls to backend (http://localhost:3000)
 */

const API_BASE = 'http://localhost:3000/api';

const CCMSAPI = {
  /**
   * AUTH ENDPOINTS
   */
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return res.json();
    },

    register: async (name, email, password, phone, branch, year, role = 'student') => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, role, branch, year })
      });
      return res.json();
    },

    getUser: async (userId) => {
      const res = await fetch(`${API_BASE}/auth/user/${userId}`);
      return res.json();
    }
  },

  /**
   * CLUBS ENDPOINTS
   */
  clubs: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/clubs`);
      return res.json();
    },

    getAdminClubs: async (adminId) => {
      const res = await fetch(`${API_BASE}/clubs/admin/${adminId}`);
      return res.json();
    },

    requestJoin: async (clubId, userId, name, branch, rollNumber, year, role, interestGoals) => {
      const res = await fetch(`${API_BASE}/clubs/${clubId}/request-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name,
          branch,
          rollNumber,
          year,
          role,
          interestGoals
        })
      });
      return res.json();
    }
  },

  /**
   * CLUB REGISTRATION / JOIN REQUESTS ENDPOINTS
   */
  registration: {
    submit: async (clubId, userId, name, branch, rollNumber, year, role, interestGoals) => {
      const res = await fetch(`${API_BASE}/club-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId,
          userId,
          name,
          branch,
          rollNumber,
          year,
          role,
          interestGoals
        })
      });
      return res.json();
    },

    getAdminRequests: async (adminId) => {
      const res = await fetch(`${API_BASE}/admin/requests?adminId=${adminId}`);
      return res.json();
    },

    approve: async (requestId) => {
      const res = await fetch(`${API_BASE}/admin/approve/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return res.json();
    },

    reject: async (requestId) => {
      const res = await fetch(`${API_BASE}/admin/reject/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return res.json();
    }
  },

  /**
   * EVENTS ENDPOINTS
   */
  events: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/events`);
      return res.json();
    },

    getClubEvents: async (clubId) => {
      const res = await fetch(`${API_BASE}/events/club/${clubId}`);
      return res.json();
    },

    create: async (clubId, title, date, location, category, description) => {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_id: clubId,
          title,
          date,
          location,
          category,
          description
        })
      });
      return res.json();
    },

    register: async (eventId, name, email, phone, rollNumber, specialRequirements, userId = null) => {
      const res = await fetch(`${API_BASE}/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          user_id: userId,
          name,
          email,
          phone,
          roll_number: rollNumber,
          special_requirements: specialRequirements
        })
      });
      return res.json();
    }
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CCMSAPI;
}
