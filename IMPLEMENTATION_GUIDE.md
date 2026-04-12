# 3-PHASE MEMBER PROFILE IMPLEMENTATION GUIDE
## College Club Management System (CCMS)

---

## **OVERVIEW**

This guide walks you through implementing the **3-Phase Member Profile System**:

```
PHASE 1: User Self-Registration
        ↓
PHASE 2: Profile Completion (Optional)
        ↓
PHASE 3: Admin Management & Verification
```

---

## **IMPLEMENTATION CHECKLIST**

- [x] Updated signup.html (Phase 1)
- [x] Created user_profile_setup.html (Phase 2)
- [x] Updated backend routes/auth.js (Phase 1 & 2)
- [ ] **YOU NEED TO DO:** Update MySQL database schema
- [ ] Start/Test the application

---

## **STEP-BY-STEP IMPLEMENTATION**

### **STEP 1️⃣: Update Your MySQL Database Schema**

**Location:** MySQL Workbench

**What to do:**
1. Open MySQL Workbench
2. Connect to your CCMS database
3. Create a new SQL Query tab (Ctrl+T)
4. Open the file: `DATABASE_SETUP.sql` (in your CCMS root folder)
5. Copy ALL the SQL code
6. Paste into MySQL Workbench query tab
7. Execute (Ctrl+Enter or click ⚡)

**Expected Output:**
```
✅ All ALTER TABLE commands execute successfully
✅ New columns added to users table
✅ Sample data inserted
✅ Indexes created
```

**To Verify:**
```sql
-- Run this to check the updated schema
DESC users;
```

You should see columns:
- `branch`
- `year`
- `phone`
- `roll_number`
- `emergency_contact_name`
- `emergency_contact_phone`
- `linkedin_url`
- `github_url`
- `bio`
- `profile_completed`
- `membership_status`
- `verified_by_admin`
- `admin_notes`
- `updated_at`

---

### **STEP 2️⃣: Verify All Files Are in Place**

**Files that should exist:**

```
Frontend/
  ├── signup.html ✅ (UPDATED)
  ├── user_profile_setup.html ✅ (CREATED)
  ├── login.html (existing)
  ├── user_dashboard.html (existing)
  └── member_profile.html ✅ (from earlier)

routes/
  └── auth.js ✅ (UPDATED with new endpoints)

root/
  └── DATABASE_SETUP.sql ✅ (SQL commands)
```

**Verify in your terminal:**
```bash
# From C:\Users\abhignya\CCMS
ls Frontend/signup.html
ls Frontend/user_profile_setup.html
ls routes/auth.js
ls DATABASE_SETUP.sql
```

---

### **STEP 3️⃣: Verify Backend API Endpoints**

Your backend now has these endpoints:

**PHASE 1 - Registration:**
```
POST /api/auth/register
- Body: { name, email, password, branch, year }
- Response: { success, userId }
```

**PHASE 2 - Profile Update:**
```
PUT /api/auth/profile/update/:userId
- Body: { phone, roll_number, emergency_contact_name, ... }
- Response: { success, message }
```

---

### **STEP 4️⃣: Start Your Server**

**Terminal Command:**
```bash
cd C:\Users\abhignya\CCMS
npm start
# or
node server.js
```

**Expected Output:**
```
✅ MySQL connected successfully
🚀 Server running on http://localhost:3000
```

---

### **STEP 5️⃣: Test Phase 1 - User Registration**

**Steps:**
1. Open browser: `http://localhost:3000/Frontend/signup.html`
2. Fill the form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Branch: "Computer Science"
   - Year: "3rd Year"
   - Password: "test123"
   - Confirm Password: "test123"
   - Check "I agree..."
3. Click "Create Account"

**Expected Behavior:**
- ✅ Form validates
- ✅ Data sent to backend
- ✅ User created in database
- ✅ Alert: "Account created successfully!"
- ✅ Redirects to: `user_profile_setup.html`

**Check Database:**
```sql
SELECT id, name, email, branch, year, profile_completed FROM users WHERE email = 'test@example.com';
```

---

### **STEP 6️⃣: Test Phase 2 - Profile Completion**

**Continuing from Step 5 (after signup):**

On `user_profile_setup.html`, you should see:
- ✅ Progress bar showing: Phase 1 ✓, Phase 2 (active), Phase 3
- ✅ Message: "Add Optional Details (You can skip and complete later)"
- ✅ Form sections:
  - 📞 Contact Information
  - 🚨 Emergency Contact
  - 🔗 Social & Professional Profiles

**Fill the form:**
- Phone: "9876543210"
- Roll Number: "CS21001"
- Emergency Contact Name: "Mom"
- Emergency Contact Phone: "9999999999"
- LinkedIn: "https://linkedin.com/in/testuser"
- GitHub: "https://github.com/testuser"
- Bio: "I love coding!"

**Click "Save Profile":**

**Expected Behavior:**
- ✅ Form validates
- ✅ Loading spinner shows
- ✅ Data sent to API
- ✅ Alert: "✅ Profile saved successfully!"
- ✅ Redirects to: `user_dashboard.html`

**OR Click "Skip for Now":**
- ✅ Confirms: "Are you sure?"
- ✅ Redirects to: `user_dashboard.html`
- ✅ Profile still has NULL values for optional fields

**Check Database:**
```sql
SELECT id, name, email, phone, roll_number, linkedin_url, profile_completed 
FROM users 
WHERE email = 'test@example.com';
```

---

### **STEP 7️⃣: Test Phase 3 - Admin Management**

**In preparation for admin testing:**

1. Make sure you have an admin user in database:

```sql
-- Check if admin exists
SELECT id, name, email, role FROM users WHERE role = 'admin';

-- If not, create one
INSERT INTO users (name, email, password, role, branch, year) 
VALUES ('Admin', 'admin@example.com', 'hashed_password', 'admin', 'Computer Science', '4th Year');
```

2. Login as admin:
   - Go to: `http://localhost:3000/Frontend/login.html`
   - Email: "admin@example.com"
   - Password: (whatever you set)

3. Go to: Admin Dashboard → Members

4. Click "View" next to a member:

**Expected Behavior:**
- ✅ Redirects to: `member_profile.html?id=1` (or whatever member ID)
- ✅ Shows full member profile
- ✅ Can edit member details
- ✅ Can remove member

---

## **COMPLETE WORKFLOW DIAGRAM**

```
┌──────────────────────────────────────────┐
│  PHASE 1: USER SIGNUP                    │
│  File: signup.html                       │
│  Endpoint: POST /api/auth/register       │
│                                          │
│  ✓ Name, Email, Password                │
│  ✓ Branch, Year                         │
│  → Creates user in DB                   │
└──────────────────┬───────────────────────┘
                   │
        Auto-Redirect to Phase 2
                   ↓
┌──────────────────────────────────────────┐
│  PHASE 2: PROFILE SETUP (Optional)       │
│  File: user_profile_setup.html           │
│  Endpoint: PUT /api/auth/profile/update/:userId
│                                          │
│  ✓ Phone, Roll Number, Emergency...     │
│  ✓ LinkedIn, GitHub, Bio                │
│  → Updates user profile                 │
│                                          │
│  [Can Skip] → Goes to Dashboard         │
│  [Can Save] → Goes to Dashboard         │
└──────────────────┬───────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────┐
│  USER DASHBOARD                          │
│  File: user_dashboard.html               │
│                                          │
│  ✓ View clubs, events                   │
│  ✓ Edit profile anytime                 │
└──────────────────┬───────────────────────┘
                   │
             (Separate workflow)
                   ↓
┌──────────────────────────────────────────┐
│  PHASE 3: ADMIN MANAGEMENT               │
│  File: admin_dashboard.html → Members    │
│  File: member_profile.html               │
│                                          │
│  ✓ View all members                     │
│  ✓ View individual profiles             │
│  ✓ Edit member details                  │
│  ✓ Remove members                       │
│  Endpoint: GET /api/auth/user/:userId    │
│  Endpoint: PUT /api/auth/user/:userId    │
│  Endpoint: DELETE /api/auth/user/:userId │
└──────────────────────────────────────────┘
```

---

## **DATABASE SCHEMA (FINAL)**

```sql
CREATE TABLE users (
  -- Phase 1: Registration
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  branch VARCHAR(100),
  year VARCHAR(20),
  
  -- Phase 2: Profile Completion
  phone VARCHAR(20),
  roll_number VARCHAR(50),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  linkedin_url VARCHAR(255),
  github_url VARCHAR(255),
  bio TEXT,
  profile_completed BOOLEAN DEFAULT FALSE,
  
  -- Phase 3: Admin Management
  role VARCHAR(50) DEFAULT 'student',
  membership_status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
  verified_by_admin BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## **TESTING CHECKLIST**

### **User Level Testing:**

- [ ] Can sign up with all required fields
- [ ] Password validation works (min 6 chars)
- [ ] Passwords must match confirmation
- [ ] Cannot signup with existing email
- [ ] After signup → redirects to Phase 2 page
- [ ] Can skip profile completion
- [ ] Can fill and save optional details
- [ ] After profile → redirects to dashboard
- [ ] Can see dashboard after signup

### **Admin Level Testing:**

- [ ] Can login as admin
- [ ] Can view Members list
- [ ] Can click "View" to see member profile
- [ ] Member profile loads with all data
- [ ] Can edit member details
- [ ] Can save member updates
- [ ] Can remove member
- [ ] Member removed from database

---

## **API ENDPOINTS REFERENCE**

### **1. Register User (Phase 1)**
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "pass123",
  "branch": "Computer Science",
  "year": "3rd Year"
}

Response:
{
  "success": true,
  "message": "User registered",
  "userId": 1
}
```

### **2. Login User**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "pass123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### **3. Update Profile (Phase 2)**
```
PUT /api/auth/profile/update/1
Content-Type: application/json

{
  "phone": "9876543210",
  "roll_number": "CS21001",
  "emergency_contact_name": "Mom",
  "emergency_contact_phone": "9999999999",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "github_url": "https://github.com/johndoe",
  "bio": "I love coding",
  "profile_completed": true
}

Response:
{
  "success": true,
  "message": "Profile updated successfully"
}
```

### **4. Get User Profile (Admin)**
```
GET /api/auth/user/1

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "branch": "Computer Science",
    "year": "3rd Year",
    "role": "student",
    "created_at": "2026-04-11T...",
    "updated_at": "2026-04-11T..."
  }
}
```

### **5. Update User Profile (Admin)**
```
PUT /api/auth/user/1
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "9887766554",
  "branch": "Electronics",
  "year": "4th Year"
}

Response:
{
  "success": true,
  "message": "User profile updated successfully"
}
```

### **6. Delete User (Admin)**
```
DELETE /api/auth/user/1

Response:
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## **TROUBLESHOOTING**

### **Problem: "Cannot POST /api/auth/register"**
- **Solution:** Verify server is running: `npm start`
- Check routes/auth.js is properly exported

### **Problem: "User not found" on profile update**
- **Solution:** Check userId is correct
- Verify user exists in database: `SELECT * FROM users WHERE id = 1;`

### **Problem: "Email already registered"**
- **Solution:** Use a different email for testing
- Or delete/clear test user from database

### **Problem: Page doesn't redirect to Phase 2**
- **Solution:** Check browser console for errors (F12)
- Verify userId is saved in localStorage
- Check `user_profile_setup.html` is in Frontend folder

### **Problem: Database columns not adding**
- **Solution:** Make sure you're using `ALTER TABLE` not `CREATE TABLE`
- Check for syntax errors in SQL
- Verify column names match exactly

---

## **NEXT STEPS**

1. ✅ Run DATABASE_SETUP.sql
2. ✅ Start server
3. ✅ Test signup flow
4. ✅ Test profile completion
5. ✅ Test admin management
6. 🎉 Deploy to production!

---

## **FILES MODIFIED/CREATED**

| File | Status | Changes |
|------|--------|---------|
| Frontend/signup.html | Updated | Added branch, year fields; validation; redirect to Phase 2 |
| Frontend/user_profile_setup.html | Created | New Phase 2 profile completion page |
| routes/auth.js | Updated | Updated register endpoint; added profile update endpoint |
| DATABASE_SETUP.sql | Created | SQL commands to update schema |

---

## **SUPPORT**

For issues or questions, check:
- Browser console: F12 → Console tab
- Network tab: F12 → Network tab (check API calls)
- Server logs: Check terminal running `npm start`
- Database: `SELECT * FROM users;`

---

**Status:** ✅ Ready to Implementation
**Created:** April 11, 2026
**System:** CCMS 3-Phase Member Profile System
