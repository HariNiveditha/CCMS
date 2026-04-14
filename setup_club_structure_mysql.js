const db = require('./db');

const PASSWORD_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DRcg36'; // test123

const CLUBS = [
  { name: 'NSS (National Service Scheme)', description: 'Community service and social impact initiatives.' },
  { name: 'Chaitanya Samskruthi', description: 'Culture, heritage, and literary events.' },
  { name: 'WPC CBIT (Poetry Club)', description: 'Poetry, writing, and spoken-word activities.' },
  { name: 'CBIT Photo Club', description: 'Photography walks, workshops, and exhibitions.' },
  { name: 'UDC (United Dance Crew)', description: 'Dance performances and choreography practice.' },
  { name: 'IEEE', description: 'Technical sessions, projects, and competitions.' },
  { name: 'Chaaya CBIT', description: 'Film appreciation and creative media club.' },
  { name: 'TMC CBIT (Toastmasters)', description: 'Public speaking and leadership practice.' },
  { name: 'CBIT MUN HYD', description: 'Model United Nations and policy discussions.' },
  { name: 'CBIT OSC (Open Source Community)', description: 'Open source contributions and coding sprints.' },
  { name: 'Chaitanya Vaadya', description: 'Music and instrumental performances.' }
];

const ADMIN_NAMES = [
  'Ananya Reddy',
  'Rohit Varma',
  'Ishita Nair',
  'Arjun Menon',
  'Meera Iyer',
  'Karthik Rao',
  'Sneha Kulkarni',
  'Vikram Bhat',
  'Priya Krishnan',
  'Aditya Chawla',
  'Nivedita Sinha'
];

const FIRST_NAMES = [
  'Aarav', 'Vihaan', 'Arjun', 'Reyansh', 'Ishaan', 'Kabir', 'Lakshya', 'Rohan', 'Siddharth', 'Yash',
  'Anika', 'Aadhya', 'Diya', 'Myra', 'Ira', 'Kiara', 'Saanvi', 'Navya', 'Riya', 'Tanvi',
  'Dev', 'Nikhil', 'Rahul', 'Aman', 'Pranav', 'Harsh', 'Nitin', 'Samar', 'Vedant', 'Manav',
  'Pooja', 'Kavya', 'Shruti', 'Neha', 'Aisha', 'Trisha', 'Bhavna', 'Ritika', 'Mitali', 'Sonal'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Menon', 'Verma', 'Gupta', 'Kapoor', 'Singh',
  'Choudhary', 'Mishra', 'Joshi', 'Kulkarni', 'Deshmukh', 'Bose', 'Dutta', 'Mukherjee', 'Banerjee', 'Saxena',
  'Agarwal', 'Bhat', 'Yadav', 'Pillai', 'Chawla', 'Sinha', 'Tripathi', 'Rastogi', 'Malhotra', 'Khurana'
];

const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'CSM', 'AIML', 'DS', 'CHEM'];
const YEARS = ['1st', '2nd', '3rd', '4th'];

function toEmail(name, index, suffix) {
  return `${name.toLowerCase().replace(/[^a-z]/g, '.')}.${suffix}${index}@cbit.edu.in`.replace(/\.{2,}/g, '.');
}

function toRoll(clubIndex, memberIndex) {
  return `CB${String(clubIndex + 1).padStart(2, '0')}M${String(memberIndex + 1).padStart(2, '0')}`;
}

async function ensureFkConstraints() {
  await db.query(
    `DELETE cm FROM club_members cm
     LEFT JOIN clubs c ON c.id = cm.club_id
     WHERE c.id IS NULL`
  );

  await db.query(
    `DELETE cm FROM club_members cm
     LEFT JOIN users u ON u.id = cm.user_id
     WHERE u.id IS NULL`
  );

  const [fkClub] = await db.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'club_members'
       AND COLUMN_NAME = 'club_id'
       AND REFERENCED_TABLE_NAME = 'clubs'`
  );

  if (fkClub.length === 0) {
    await db.query(
      `ALTER TABLE club_members
       ADD CONSTRAINT fk_club_members_club
       FOREIGN KEY (club_id) REFERENCES clubs(id)
       ON DELETE CASCADE`
    );
  }

  const [fkUser] = await db.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'club_members'
       AND COLUMN_NAME = 'user_id'
       AND REFERENCED_TABLE_NAME = 'users'`
  );

  if (fkUser.length === 0) {
    await db.query(
      `ALTER TABLE club_members
       ADD CONSTRAINT fk_club_members_user
       FOREIGN KEY (user_id) REFERENCES users(id)
       ON DELETE CASCADE`
    );
  }
}

async function ensureMemberLimitTriggers() {
  await db.query('DROP TRIGGER IF EXISTS trg_club_members_max15_insert');
  await db.query('DROP TRIGGER IF EXISTS trg_club_members_max15_update');

  await db.query(
    `CREATE TRIGGER trg_club_members_max15_insert
     BEFORE INSERT ON club_members
     FOR EACH ROW
     BEGIN
       DECLARE member_count INT;
       IF LOWER(COALESCE(NEW.role, 'member')) = 'member' THEN
         SELECT COUNT(*) INTO member_count
         FROM club_members
         WHERE club_id = NEW.club_id
           AND LOWER(COALESCE(role, 'member')) = 'member';

         IF member_count >= 15 THEN
           SIGNAL SQLSTATE '45000'
             SET MESSAGE_TEXT = 'Club member limit reached (max 15 members)';
         END IF;
       END IF;
     END`
  );

  await db.query(
    `CREATE TRIGGER trg_club_members_max15_update
     BEFORE UPDATE ON club_members
     FOR EACH ROW
     BEGIN
       DECLARE member_count INT;
       IF LOWER(COALESCE(NEW.role, 'member')) = 'member' THEN
         SELECT COUNT(*) INTO member_count
         FROM club_members
         WHERE club_id = NEW.club_id
           AND LOWER(COALESCE(role, 'member')) = 'member'
           AND id <> OLD.id;

         IF member_count >= 15 THEN
           SIGNAL SQLSTATE '45000'
             SET MESSAGE_TEXT = 'Club member limit reached (max 15 members)';
         END IF;
       END IF;
     END`
  );
}

async function upsertUser({ name, email, phone, role, branch, year, rollNumber }) {
  const [result] = await db.query(
    `INSERT INTO users
      (roll_number, name, email, phone, password, role, branch, year, profile_completed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
      id = LAST_INSERT_ID(id),
      name = VALUES(name),
      phone = VALUES(phone),
      role = VALUES(role),
      branch = VALUES(branch),
      year = VALUES(year),
      roll_number = VALUES(roll_number)`,
    [rollNumber, name, email, phone, PASSWORD_HASH, role, branch, year]
  );

  return result.insertId;
}

async function getOrCreateClub(name, description) {
  const [existing] = await db.query('SELECT id FROM clubs WHERE name = ? ORDER BY id ASC LIMIT 1', [name]);

  if (existing.length > 0) {
    await db.query('UPDATE clubs SET description = ? WHERE id = ?', [description, existing[0].id]);
    return existing[0].id;
  }

  const [inserted] = await db.query(
    'INSERT INTO clubs (name, description) VALUES (?, ?)',
    [name, description]
  );

  return inserted.insertId;
}

(async () => {
  try {
    await ensureFkConstraints();
    await ensureMemberLimitTriggers();

    const summary = [];

    for (let clubIndex = 0; clubIndex < CLUBS.length; clubIndex++) {
      const club = CLUBS[clubIndex];
      const adminName = ADMIN_NAMES[clubIndex];
      const adminEmail = toEmail(adminName, clubIndex + 1, 'admin');
      const adminPhone = `9${String(800000000 + clubIndex).padStart(9, '0')}`;

      const adminId = await upsertUser({
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        role: 'admin',
        branch: BRANCHES[clubIndex % BRANCHES.length],
        year: '4th',
        rollNumber: `CBADMIN${String(clubIndex + 1).padStart(2, '0')}`
      });

      const clubId = await getOrCreateClub(club.name, club.description);

      await db.query('UPDATE clubs SET admin_id = ? WHERE id = ?', [adminId, clubId]);

      await db.query('DELETE FROM club_members WHERE club_id = ?', [clubId]);

      await db.query(
        `INSERT INTO club_members (club_id, user_id, role, status)
         VALUES (?, ?, 'coordinator', 'accepted')`,
        [clubId, adminId]
      );

      for (let memberIndex = 0; memberIndex < 15; memberIndex++) {
        const first = FIRST_NAMES[(clubIndex * 17 + memberIndex) % FIRST_NAMES.length];
        const last = LAST_NAMES[(clubIndex * 11 + memberIndex * 3) % LAST_NAMES.length];
        const memberName = `${first} ${last}`;
        const memberEmail = toEmail(memberName, clubIndex * 20 + memberIndex + 1, 'member');
        const memberPhone = `8${String(100000000 + clubIndex * 20 + memberIndex).padStart(9, '0')}`;

        const memberId = await upsertUser({
          name: memberName,
          email: memberEmail,
          phone: memberPhone,
          role: 'student',
          branch: BRANCHES[(clubIndex + memberIndex) % BRANCHES.length],
          year: YEARS[memberIndex % YEARS.length],
          rollNumber: toRoll(clubIndex, memberIndex)
        });

        await db.query(
          `INSERT INTO club_members (club_id, user_id, role, status)
           VALUES (?, ?, 'member', 'accepted')`,
          [clubId, memberId]
        );
      }

      summary.push({ club_id: clubId, club_name: club.name, admin_id: adminId, members: 15 });
    }

    const [verify] = await db.query(
      `SELECT c.id, c.name, c.admin_id,
              SUM(CASE WHEN LOWER(cm.role) = 'member' THEN 1 ELSE 0 END) AS member_count,
              SUM(CASE WHEN LOWER(cm.role) IN ('coordinator', 'admin') THEN 1 ELSE 0 END) AS admin_entries
       FROM clubs c
       LEFT JOIN club_members cm ON cm.club_id = c.id
       WHERE c.name IN (${CLUBS.map(() => '?').join(',')})
       GROUP BY c.id, c.name, c.admin_id
       ORDER BY c.id`,
      CLUBS.map(c => c.name)
    );

    console.log('Setup complete for listed clubs.');
    console.table(summary);
    console.log('Verification counts:');
    console.table(verify);

    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exit(1);
  }
})();
