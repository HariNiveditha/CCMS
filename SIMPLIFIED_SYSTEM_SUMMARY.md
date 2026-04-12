# 🎯 CCMS - Simplified 3-Phase System (MVP Edition)

> **Version:** 2.0 Streamlined  
> **Last Updated:** December 2024  
> **Status:** ✅ Ready for Deployment

---

## 📋 System Overview

This is a **Minimum Viable Product (MVP)** version of the College Club Management System focusing on essential functionality only.

### **Three-Phase User Flow**

```
Phase 1: Registration  →  Phase 2: Profile Setup  →  Phase 3: Dashboard Access
(Signup)                 (Optional Profile)           (Admin/User Dashboard)
```

---

## 🔧 Database Schema (Simplified)

### **Users Table - Core Columns**

```sql
users (
  id                  INT PRIMARY KEY,
  name               VARCHAR(100) -- Required
  email              VARCHAR(100) UNIQUE -- Required
  password           VARCHAR(255) -- Hashed
  role               ENUM('student', 'coordinator', 'admin') -- Default: student
  branch             VARCHAR(50) -- Required at signup (CS, Electronics, etc.)
  year               VARCHAR(20) -- Required at signup (1st-4th Year)
  phone              VARCHAR(15) -- Optional (Phase 2)
  roll_number        VARCHAR(20) -- Optional (Phase 2)
  profile_completed  BOOLEAN DEFAULT FALSE -- Track completion status
  created_at         TIMESTAMP
  updated_at         TIMESTAMP
)
```

### **Removed (Complexity Reduction)**

❌ emergency_contact_name  
❌ emergency_contact_phone  
❌ linkedin_url  
❌ github_url  
❌ bio  
❌ membership_status  
❌ verified_by_admin  
❌ admin_notes  

---

## 📱 Frontend Pages (Updated)

### **1. Phase 1: signup.html**
- **Purpose:** User self-registration
- **Required Fields:**
  - Name
  - Email
  - Branch (dropdown: CS, Electronics, Mechanical, Electrical, Civil)
  - Academic Year (dropdown: 1st-4th Year)
  - Password (minimum 6 characters)
  - Confirm Password
- **Removed:** Terms & conditions checkbox
- **Action:** Redirects to Phase 2 (user_profile_setup.html)

### **2. Phase 2: user_profile_setup.html**
- **Purpose:** Optional profile completion
- **Optional Fields:**
  - Phone Number (10+ digits)
  - Roll Number (e.g., CS21001)
- **Removed:** Emergency contact, social links, bio
- **Actions:**
  - Save Profile → Redirect to Dashboard
  - Skip for Now → Go directly to Dashboard
- **Key Feature:** Progress bar showing 3 phases

### **3. Phase 3: Admin Dashboard**
- **Purpose:** Admin member management
- **Features:**
  - View member profile
  - Edit member details
  - Remove member
  - Member profile page with full info display

---

## 🔐 API Endpoints (Streamlined)

### **Authentication**

```
POST /api/auth/register
├─ Required: name, email, password, branch, year
├─ Returns: { success: true, userId: 1 }
└─ Role: Auto-assigned as 'student'

POST /api/auth/login
├─ Required: email, password
├─ Returns: { success: true, user: {...}, adminClubs: [...] }
└─ Role: Computed from clubs.admin_id mapping

GET /api/auth/user/:userId
├─ Returns: Full user profile
├─ Fields: id, name, email, phone, branch, year, role, created_at
└─ Usage: Admin viewing member profile

PUT /api/auth/user/:userId
├─ Updateable: name, phone, branch, year
└─ Usage: Admin editing member details

DELETE /api/auth/user/:userId
├─ Removes user from system
└─ Usage: Admin removing member

PUT /api/auth/profile/update/:userId
├─ Updateable: phone, roll_number, profile_completed
├─ Returns: { success: true, message: "Profile updated successfully" }
└─ Usage: User completing Phase 2 profile
```

---

## 🧪 Test Credentials

Two pre-configured test users are included in `DATABASE_SETUP.sql`:

### **Student Account**
```
Email: student@example.com
Password: test123
Branch: Computer Science
Year: 3rd Year
Role: student
```

### **Admin Account**
```
Email: admin@example.com
Password: test123
Branch: Computer Science
Year: 4th Year
Role: admin (if assigned club)
```

---

## 📊 Implementation Checklist

- ✅ Database schema created and simplified
- ✅ Backend routes implemented (auth.js)
- ✅ Signup form updated (Phase 1)
- ✅ Profile setup form created (Phase 2)
- ✅ Admin dashboard integrated (Phase 3)
- ✅ Test data provided
- ✅ Session management via localStorage
- ✅ Password hashing with bcrypt
- ✅ Email unique constraint enforced

---

## 🚀 Quick Setup (5 Minutes)

1. **Import Database:**
   ```bash
   # Copy all code from DATABASE_SETUP.sql into MySQL Workbench
   # Execute (Ctrl+Enter)
   ```

2. **Start Server:**
   ```bash
   cd C:\Users\abhignya\CCMS
   npm start
   # Wait for: "🚀 Server running on http://localhost:3000"
   ```

3. **Test Flow:**
   - Open: `http://localhost:3000/Frontend/signup.html`
   - Sign up with test credentials
   - Complete or skip profile setup
   - Login with same credentials

---

## 💡 Key Features

- **Progressive Profiling:** Collect minimal data at signup, optional details later
- **Session Persistence:** Uses browser localStorage for session management
- **Role-Based Access:** Three roles: student, coordinator, admin
- **Admin Override:** Users with assigned clubs automatically become admins
- **Clean Database:** Only essential fields to reduce complexity and improve performance
- **Password Security:** bcrypt hashing (10 salt rounds)

---

## 📝 File Structure

```
CCMS/
├── Frontend/
│   ├── signup.html ........................ Phase 1 (Updated)
│   ├── user_profile_setup.html ........... Phase 2 (Updated - Simplified)
│   ├── member_profile.html .............. Phase 3 Admin view
│   ├── admin_dashboard.html ............. Admin interface
│   ├── admin_dashboard.js ............... Admin logic
│   ├── auth.js .......................... Session helpers
│   └── [other frontend files]
├── routes/
│   ├── auth.js .......................... Auth endpoints (Updated)
│   ├── clubs.js ......................... Club management
│   └── events.js ........................ Event management
├── DATABASE_SETUP.sql ................... Database schema (Simplified)
├── db.js ............................... MySQL connection
├── server.js ........................... Express server
├── package.json ........................ Dependencies
└── QUICK_START.md ...................... Setup guide
```

---

## ⚠️ Important Notes

1. **No Additional Validation:** Username, extra fields, or complex verification - kept simple
2. **No Email Verification:** Direct registration after signup
3. **No Rate Limiting:** No protection against brute force - add for production
4. **No HTTPS:** Use HTTP only for development
5. **Localhost Only:** No external API calls or third-party services

---

## 🔄 Future Enhancement Ideas

- Email verification on signup
- Password reset via OTP
- Profile image upload
- Club filtering by branch
- Event calendar view
- Attendance tracking
- Member search functionality

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| MySQL connection error | Run DATABASE_SETUP.sql and verify credentials in db.js |
| Signup not working | Check that email isn't already registered |
| "User not found" on admin view | Verify userId exists in database |
| Password not matching on login | Ensure you used the correct password hash |
| 404 on file access | Check file paths are relative to root (http://localhost:3000/Frontend/...) |

---

**System is now simplified to MVP with essential features only!** 🎉
