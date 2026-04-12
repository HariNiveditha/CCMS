# ⚡ QUICK START - 10 MINUTES SETUP

## **🎯 What You're Setting Up**
- **Phase 1:** User self-registration (signup form)
- **Phase 2:** Optional profile completion
- **Phase 3:** Admin member management

---

## **⏱️ 10-MINUTE SETUP PROCEDURE**

### **Minute 1-2: Run Database Script**
```bash
# Open MySQL Workbench
# Create → New Query Tab
# Copy-Paste ALL code from: DATABASE_SETUP.sql
# Execute (Ctrl+Enter)
# Result: ✅ No errors shown
```

### **Minute 3-4: Verify Files Exist**
```bash
# Check these files exist in your CCMS folder:
✓ Frontend/signup.html (updated)
✓ Frontend/user_profile_setup.html (new)
✓ routes/auth.js (updated)
✓ DATABASE_SETUP.sql (new)
✓ IMPLEMENTATION_GUIDE.md (reference)
```

### **Minute 5-6: Start Server**
```bash
cd C:\Users\abhignya\CCMS
npm start

# Wait for:
# ✅ MySQL connected successfully
# 🚀 Server running on http://localhost:3000
```

### **Minute 7-8: Test Signup**
```
1. Open: http://localhost:3000/Frontend/signup.html
2. Fill form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Branch: "Computer Science"
   - Year: "3rd Year"
   - Password: "test123"
3. Click "Create Account"
4. Should redirect to profile setup page
```

### **Minute 9-10: Test Profile Setup**
```
1. Fill optional fields (or click Skip)
2. Should redirect to user dashboard
3. Done! ✅
```

---

## **🔧 What Changed**

### **Frontend Pages**
| File | Change | Purpose |
|------|--------|---------|
| signup.html | Added Branch, Year fields | Phase 1 |
| user_profile_setup.html | New file created | Phase 2 |

### **Backend**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/auth/register | POST | Phase 1 - now accepts branch & year |
| /api/auth/profile/update/:id | PUT | Phase 2 - update optional details |

### **Database**
Added 15 new columns to users table for complete member profile

---

## **📋 SQL Commands (If Needed Separately)**

### **Add columns:**
```sql
USE ccms;
ALTER TABLE users ADD COLUMN branch VARCHAR(100);
ALTER TABLE users ADD COLUMN year VARCHAR(20);
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN roll_number VARCHAR(50);
ALTER TABLE users ADD COLUMN emergency_contact_name VARCHAR(255);
ALTER TABLE users ADD COLUMN emergency_contact_phone VARCHAR(20);
ALTER TABLE users ADD COLUMN linkedin_url VARCHAR(255);
ALTER TABLE users ADD COLUMN github_url VARCHAR(255);
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN membership_status ENUM('Active','Inactive','Suspended') DEFAULT 'Active';
ALTER TABLE users ADD COLUMN admin_notes TEXT;
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

### **Verify:**
```sql
DESC users;  -- Check all columns exist
SELECT * FROM users LIMIT 1;  -- Check data structure
```

---

## **🧪 Manual Testing**

### **Phase 1 Test (Signup)**
- ✓ Can access signup.html
- ✓ Branch dropdown shows options
- ✓ Year dropdown shows options
- ✓ Form validates required fields
- ✓ Redirects to Phase 2 after signup
- ✓ User created in database

**Verify in DB:**
```sql
SELECT name, email, branch, year FROM users WHERE email='test@example.com';
```

### **Phase 2 Test (Profile Setup)**
- ✓ Shows progress bar with Phase 1 ✓, Phase 2 active
- ✓ Can skip to dashboard
- ✓ Can fill optional fields and save
- ✓ Redirects to dashboard after save/skip
- ✓ Data saved in database

**Verify in DB:**
```sql
SELECT name, email, phone, roll_number, profile_completed FROM users WHERE email='test@example.com';
```

### **Phase 3 Test (Admin)**
- ✓ Can login as admin
- ✓ Go to Admin Dashboard → Members
- ✓ Click "View" next to member
- ✓ See member_profile.html with all details
- ✓ Can edit and save member info

---

## **❌ Common Issues & Fixes**

| Issue | Fix |
|-------|-----|
| "Table already has these columns" | Already added, skip that command |
| "Cannot find table 'users'" | Use correct database: `USE ccms;` |
| "POST /api/auth/register fails" | Restart server: Stop (Ctrl+C) → `npm start` |
| "Redirects to blank page" | Clear localStorage: F12 → Application → Clear All |
| "Can't see Branch/Year on signup" | Hard refresh: Ctrl+Shift+R |

---

## **📞 Need Help?**

1. **Check Server Console** - Shows API errors
2. **Browser Console** - F12 → Console (JavaScript errors)
3. **Database** - Check data with SELECT queries
4. **Network Tab** - F12 → Network (see API responses)

---

## **✅ Success Indicators**

After completing 10-minute setup, you should see:

```
✅ Signup page has Branch & Year dropdowns
✅ After signup → Profile Setup page appears
✅ Can skip or save profile
✅ After profile → Dashboard loads
✅ Admins can view member profiles
✅ All user data saved in database
```

---

## **📁 File Locations**

```
CCMS/
├── Frontend/
│   ├── signup.html ← Updated
│   ├── user_profile_setup.html ← New
│   └── member_profile.html ← Existing
├── routes/
│   └── auth.js ← Updated
├── DATABASE_SETUP.sql ← New (Run in MySQL)
├── IMPLEMENTATION_GUIDE.md ← Full guide
└── QUICK_START.md ← This file
```

---

## **🎯 Next After Setup**

1. Customize branch/year options (if different from defaults)
2. Add more fields as needed
3. Set up email verification (optional)
4. Create member export/report features
5. Add profile picture upload

---

**That's it! You have 3-Phase Member Profile System ready! 🚀**
