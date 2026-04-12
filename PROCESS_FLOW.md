# 📊 3-PHASE MEMBER PROFILE SYSTEM - COMPLETE FLOW

---

## **🎯 BIG PICTURE OVERVIEW**

```
                    ┌─────────────────────────────┐
                    │   USER OPENS WEBSITE        │
                    └────────────┬────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Logged In?             │
                    └────┬────────────┬───────┘
                    YES  │            │  NO
    ┌──────────────────┐ │            │ ┌─────────────────┐
    │  User Dashboard  │─┘            └─│ Signup / Login  │
    └──────────────────┘                │ Page            │
                                        └────────┬────────┘
                                                 │
                         ┌───────────────────────┘
                         │
                    PHASE 1│: REGISTRATION
                         │
           ┌─────────────▼─────────────┐
           │  SIGNUP PAGE              │
           │  (signup.html)            │
           │  - Name                   │
           │  - Email                  │
           │  - Password               │
           │  - Branch                 │
           │  - Year                   │
           │  - Confirm Pass           │
           └──────────┬────────────────┘
                      │ [Form validates]
                      │ [Send POST /api/auth/register]
                      │ [Create user in DB]
                      │
           ┌──────────▼──────────┐
           │ ✅ Account Created  │
           └──────────┬──────────┘
                      │
                      │ [Auto-Redirect]
                      │
                 PHASE 2│: PROFILE SETUP
                      │
        ┌─────────────▼─────────────────┐
        │  PROFILE SETUP PAGE           │
        │  (user_profile_setup.html)    │
        │                              │
        │  Optional Fields:            │
        │  📞 Phone                    │
        │  📋 Roll Number              │
        │  🚨 Emergency Contact        │
        │  🔗 LinkedIn                 │
        │  🐙 GitHub                   │
        │  📝 Bio                      │
        │                              │
        │  [Skip] ────────┐           │
        │  [Save] ────┐   │           │
        └─────────────┼───┼───────────┘
                      │   │
        ┌─────────────┘   └──────────────┐
        │                                │
        │ [PUT /api/auth/profile/update] │
        │ [Save optional details]        │
        │                                │
        └─────────────┬──────────────────┘
                      │
              ┌───────▼──────────┐
              │  User Dashboard  │
              │  (user_dashboard)│
              │                  │
              │ ✅ Logged In     │
              │ ✅ Can join      │
              │    clubs & events│
              │ ✅ Can edit      │
              │    profile later │
              └──────┬───────────┘
                     │
                PHASE 3│: ADMIN ACCESS
                     │
            ┌────────▼──────────────┐
            │ Admin Logs In         │
            └────────┬──────────────┘
                     │
            ┌────────▼──────────────┐
            │  Admin Dashboard      │
            │  - Members Section    │
            └────────┬──────────────┘
                     │
        ┌────────────▼────────────┐
        │  Click "View" on        │
        │  any member             │
        └────────┬────────────────┘
                 │
        ┌────────▼──────────────────┐
        │  Member Profile Page      │
        │  (member_profile.html)    │
        │                           │
        │  Shows ALL:              │
        │  ✓ Name, Email, Phone   │
        │  ✓ Branch, Year         │
        │  ✓ Roll No., Contacts   │
        │  ✓ Social Links         │
        │  ✓ Bio, Created Date    │
        │                           │
        │  Can EDIT:               │
        │  [✎ Edit Profile]       │
        │  [✓ Save Changes]       │
        │                           │
        │  Can DELETE:             │
        │  [Remove from Club] ────┐│
        │                          ││
        └──────────────────────────┘│
                                    │
                    [DELETE user    │
                     from system]   │
                                    │
                         ┌──────────▼──┐
                         │   ✅ Removed │
                         └─────────────┘
```

---

## **📱 USER JOURNEY - PHASE BY PHASE**

### **PHASE 1️⃣: User Registration (5 minutes)**

```
┌─────────────────────────────────────────────────┐
│                 SIGNUP PAGE                     │
│  signup.html                                    │
│                                                 │
│  Form Fields:                                   │
│  ┌─────────────────────────────────────────┐   │
│  │ Full Name* ________________________    │   │
│  │ Email* ____________________________    │   │
│  │ Branch* [▼ Computer Science  ]     │   │
│  │ Year* [▼ 3rd Year            ]     │   │
│  │ Password* ________________________    │   │
│  │ Confirm Password* ________________  │   │
│  │ [✓] I agree to terms & conditions │   │
│  │ [Create Account]               │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Validation:                                    │
│  ✓ All fields required                         │
│  ✓ Email must be unique                        │
│  ✓ Password (min 6 chars)                      │
│  ✓ Passwords must match                        │
│  ✓ Must agree to terms                         │
│                                                 │
│  On Submit:                                     │
│  1. Send: POST /api/auth/register              │
│  2. Body: {name, email, password,              │
│            branch, year}                       │
│  3. Create user in DB                          │
│  4. Save userId to localStorage                │
│  5. Redirect to: user_profile_setup.html       │
└─────────────────────────────────────────────────┘
```

### **PHASE 2️⃣: Profile Completion (5 minutes - Optional)**

```
┌──────────────────────────────────────────────────────┐
│           PROFILE SETUP PAGE                         │
│  user_profile_setup.html                            │
│                                                      │
│  Progress Indicator:                                 │
│  Step 1 ✓  Step 2 ◆  Step 3                         │
│  Registration | Profile Setup | Dashboard           │
│                                                      │
│  "Add Optional Details"                             │
│  (You can skip and complete later)                  │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ 📞 CONTACT INFORMATION                      │    │
│  │ Phone _________________ (optional)         │    │
│  │ Roll Number __________ (optional)          │    │
│  │                                             │    │
│  │ 🚨 EMERGENCY CONTACT                        │    │
│  │ Name _________________ (optional)          │    │
│  │ Phone _________________ (optional)         │    │
│  │                                             │    │
│  │ 🔗 SOCIAL & PROFESSIONAL                    │    │
│  │ LinkedIn URL _____________________________ │    │
│  │ GitHub URL _______________________________ │    │
│  │ Bio ______________________________________ │    │
│  │     ______________________________________ │    │
│  │                                             │    │
│  │ [Skip for Now] [Save Profile]              │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  Either:                                             │
│  1. Click "Skip for Now" → Go to Dashboard         │
│     (Profile incomplete, can complete later)       │
│                                                      │
│  2. Fill fields and "Save Profile"                 │
│     → PUT /api/auth/profile/update/:userId        │
│     → Redirect to Dashboard                        │
│                                                      │
│  Result: User onboarded, ready to use system      │
└──────────────────────────────────────────────────────┘
```

### **PHASE 3️⃣: Admin Management (Ongoing)**

```
┌────────────────────────────────────────────────────┐
│          ADMIN DASHBOARD                           │
│  admin_dashboard.html                              │
│                                                    │
│  Sidebar Menu:                                     │
│  ◉ Overview                                        │
│  ▦ Members ← Click to view members list           │
│  ◈ Events                                          │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ MEMBERS SECTION                              │ │
│  │                                              │ │
│  │ [+ Add Member]                               │ │
│  │                                              │ │
│  │ Name         Email            Role  [View]  │ │
│  │ ─────────────────────────────────────────── │ │
│  │ John Doe     john@ex.com      Student [View]│ │
│  │ Sarah J.     sarah@ex.com     Member [View] │ │
│  │ Mike Wilson  mike@ex.com      Coord  [View] │ │
│  │                                              │ │
│  │ ON CLICK "View":                             │ │
│  │ → member_profile.html?id=1                   │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  MEMBER PROFILE (When View clicked)                │
│  ┌──────────────────────────────────────────────┐ │
│  │                                              │ │
│  │  ┌──────────────────────────────────────┐  │ │
│  │  │  [JD] John Doe                       │  │ │
│  │  │       Student                        │  │ │
│  │  │  [✎ Edit Profile] [Remove Member]   │  │ │
│  │  └──────────────────────────────────────┘  │ │
│  │                                              │ │
│  │  PERSONAL INFORMATION                       │ │
│  │  Email: john@example.com                    │ │
│  │  Phone: (987) 654-3210                      │ │
│  │  Branch: Computer Science                   │ │
│  │  Year: 3rd Year                             │ │
│  │  Roll: CS21001                              │ │
│  │                                              │ │
│  │  EMERGENCY CONTACT                          │ │
│  │  Name: Mom                                  │ │
│  │  Phone: (999) 999-9999                      │ │
│  │                                              │ │
│  │  SOCIAL LINKS                               │ │
│  │  LinkedIn: linkedin.com/in/johndoe          │ │
│  │  GitHub: github.com/johndoe                 │ │
│  │                                              │ │
│  │  STATUS                                     │ │
│  │  Member Since: Jan 15, 2026                 │ │
│  │  Last Updated: Apr 11, 2026                 │ │
│  │  Status: Active                             │ │
│  │                                              │ │
│  │  ADMIN ACTIONS                              │ │
│  │  [✎ Edit] [Remove from Club] [Go Back]     │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  IN EDIT MODE:                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ Name: ___________________________           │  │
│  │ Phone: ___________________________          │  │
│  │ Branch: [▼ Electronics           ]          │  │
│  │ Year: [▼ 4th Year               ]          │  │
│  │ [✓ Save] [Cancel]                          │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  REMOVE MEMBER:                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │ Sure? This cannot be undone.                │  │
│  │ [Yes, Remove] [Cancel]                      │  │
│  │ → DELETE /api/auth/user/:userId             │  │
│  │ → User removed from database                │  │
│  │ → Redirect to Admin Dashboard               │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## **🗄️ DATABASE STATE PROGRESSION**

### **After Phase 1 (Signup):**
```
id | name      | email                | branch            | year    | phone | profile_completed
1  | John Doe  | john@example.com     | Computer Science  | 3rd Yr  | NULL  | FALSE
2  | Sarah J.  | sarah@example.com    | Electronics       | 2nd Yr  | NULL  | FALSE
```

### **After Phase 2 (Profile Setup):**
```
id | name     | email              | branch          | year  | phone      | roll_no | profile_completed
1  | John Doe | john@example.com   | Computer Science| 3rd   | 9876543210| CS21001| TRUE
2  | Sarah J. | sarah@example.com  | Electronics     | 2nd   | NULL      | NULL   | FALSE
```

### **After Phase 3 (Admin Verification):**
```
id | name     | profile_completed | verified_by_admin | membership_status
1  | John Doe | TRUE              | TRUE              | Active
2  | Sarah J. | FALSE             | TRUE              | Active
```

---

## **🔄 API CALL SEQUENCE**

```
User Action                          API Call                      Database Update
─────────────────────────────────────────────────────────────────────────────────────
1. Click "Create Account"            
2. Fill form & submit     ──────→   POST /api/auth/register   ──→  INSERT INTO users
                                      (name, email, branch, year)
3. See "Account created"  ←──────────────────────────────────────  (ID returned)

4. On Profile Setup Page
5. Fill optional details              
6. Click "Save Profile"   ──────→   PUT /api/auth/profile/    ──→  UPDATE users
                                    update/:userId                  (phone, bio, etc)
                                    (phone, roll_no, ...)

7. See "Profile saved"    ←──────────────────────────────────────  (profile_completed=1)

8. Admin clicks "View"                
9. Load Member Profile    ──────→   GET /api/auth/user/:id   ──→  SELECT FROM users
                                                                     (read all fields)

10. Admin clicks "Edit"               
11. Fill & "Save Changes" ──────→   PUT /api/auth/user/:id    ──→  UPDATE users
                                      (name, phone, branch...)

12. Admin clicks "Remove"             
13. Confirm Delete        ──────→   DELETE /api/auth/user/:id ──→  DELETE FROM users
```

---

## **✅ VALIDATION RULES**

### **Phase 1 - Signup:**
```
✓ Name: Not empty, max 255 chars
✓ Email: Valid email format, unique
✓ Password: Min 6 chars, must match confirmation
✓ Branch: Must select from dropdown
✓ Year: Must select from dropdown
✓ Agreement: Must be checked
```

### **Phase 2 - Profile Setup:**
```
✓ Phone: (optional) Min 10 digits if provided
✓ Roll Number: (optional) Text field
✓ Emergency Name: (optional) Not empty if phone provided
✓ Emergency Phone: (optional) Min 10 digits if provided
✓ URLs: (optional) Valid URL format if provided
✓ Bio: (optional) Max 1000 chars
```

### **Phase 3 - Admin Edit:**
```
✓ Name: Not empty
✓ Phone: Min 10 digits if provided
✓ Branch: Must exist in dropdown
✓ Year: Must exist in dropdown
```

---

## **🎯 STATE TRANSITIONS**

```
        ┌─────────────────────────┐
        │ Not Logged In           │
        │ (Not Registered)        │
        └────────┬────────────────┘
                 │
            [Sign Up]
                 │
                 ▼
        ┌─────────────────────────┐
        │ Signed Up               │
        │ Profile Incomplete      │
        │ (Phase 1 ✓ Phase 2 ✗)  │
        └────────┬────────────────┘
                 │
         [Complete Profile]  ──────────┐
            OR [Skip]                  │
                 │                     │
                 ▼                     │
        ┌─────────────────────────┐    │
        │ Logged In               │◄───┘
        │ Profile Complete        │
        │ (Phase 1 ✓ Phase 2 ✓)  │
        └────────┬────────────────┘
                 │
        [Admin verifies]
                 │
                 ▼
        ┌─────────────────────────┐
        │ Verified Member         │
        │ Full Access             │
        │ (Phase 3 ✓)            │
        └─────────────────────────┘
```

---

## **📊 Summary Table**

| Phase | Action | User | Data | Required | Optional |
|-------|--------|------|------|----------|----------|
| 1 | Signup | Self | Basic (name, email, pass, branch, year) | ✅ All | - |
| 2 | Profile Setup | Self | Extended (phone, roll_no, emergency...) | ✗ Skip allowed | ✅ Phone, Links, Bio |
| 3 | Management | Admin | Verification & Edit | - | ✅ Edit/Delete |

---

**This is the complete 3-Phase System Architecture! 🚀**
