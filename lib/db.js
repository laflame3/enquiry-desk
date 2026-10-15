import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const dataDir = path.join(process.cwd(), '.data');
let database;
const schema = `
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  enquiry_type TEXT NOT NULL CHECK (enquiry_type = 'Membership'),
  source TEXT NOT NULL,
  subject TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('New', 'Contacted', 'Tour booked', 'Joined', 'Closed lost')),
  owner TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  next_follow_up_at TEXT,
  last_contacted_at TEXT
);
CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  enquiry_id TEXT NOT NULL REFERENCES enquiries(id),
  kind TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS enquiries_stage_idx ON enquiries(stage);
CREATE INDEX IF NOT EXISTS enquiries_follow_up_idx ON enquiries(next_follow_up_at);
CREATE INDEX IF NOT EXISTS activity_enquiry_idx ON activity(enquiry_id, created_at);
`;

function seed(database) {
  const seedContact = database.prepare('INSERT INTO contacts (id, full_name, email, created_at) VALUES (?, ?, ?, ?)');
  const seedEnquiry = database.prepare(`INSERT INTO enquiries
  (id, contact_id, enquiry_type, source, subject, stage, owner, notes, created_at, next_follow_up_at, last_contacted_at)
  VALUES (?, ?, 'Membership', ?, ?, ?, ?, ?, ?, ?, ?)`);
  const seedActivity = database.prepare('INSERT INTO activity (id, enquiry_id, kind, detail, created_at) VALUES (?, ?, ?, ?, ?)');
  const today = new Date();
  const iso = dayOffset => new Date(today.getTime() + dayOffset * 86400000).toISOString().slice(0, 10);
  const timestamp = dayOffset => new Date(today.getTime() + dayOffset * 86400000).toISOString();
  const rows = [
    ['Maya Patel', 'maya.patel@example.com', 'Website', 'Individual membership', 'New', 'Alex Morgan', 'Interested in weekday membership options.', -2, -1, null],
    ['Oliver Reed', 'oliver.reed@example.com', 'Phone', 'Family membership', 'Contacted', 'Sam Taylor', 'Asked about junior membership and a club tour.', -7, 1, -3],
    ['Sophie Chen', 'sophie.chen@example.com', 'Email', 'Full membership', 'Tour booked', 'Alex Morgan', 'Tour arranged for next week.', -10, 2, -2],
    ['Daniel Brooks', 'daniel.brooks@example.com', 'Walk-in', 'Young adult membership', 'Joined', 'Sam Taylor', 'Membership confirmed.', -20, null, -5],
    ['Aisha Khan', 'aisha.khan@example.com', 'Website', 'Flexible membership', 'New', 'Sam Taylor', 'Would like information on joining fees.', -1, 0, null]
  ];
    for (const [index, row] of rows.entries()) {
      const [name, email, source, subject, stage, owner, notes, created, due, contacted] = row;
      const contactId = `seed-contact-${index + 1}`;
      const enquiryId = `seed-enquiry-${index + 1}`;
      seedContact.run(contactId, name, email, timestamp(created));
      seedEnquiry.run(enquiryId, contactId, source, subject, stage, owner, notes, timestamp(created), due === null ? null : iso(due), contacted === null ? null : timestamp(contacted));
      seedActivity.run(`seed-activity-${index + 1}`, enquiryId, 'created', 'Synthetic membership enquiry added', timestamp(created));
    }
}

function getDatabase() {
  if (database) return database;
  mkdirSync(dataDir, { recursive: true });
  const opened = new DatabaseSync(path.join(dataDir, 'clubhouse.sqlite'));
  opened.exec('PRAGMA busy_timeout = 5000;');
  opened.exec('PRAGMA journal_mode = WAL;');
  opened.exec('PRAGMA foreign_keys = ON;');
  opened.exec(schema);
  opened.exec('BEGIN IMMEDIATE');
  try {
    if (opened.prepare('SELECT COUNT(*) AS count FROM enquiries').get().count === 0) seed(opened);
    opened.exec('COMMIT');
  } catch (error) {
    opened.exec('ROLLBACK');
    opened.close();
    throw error;
  }
  database = opened;
  return database;
}

export const owners = ['Alex Morgan', 'Sam Taylor'];
export const stages = ['New', 'Contacted', 'Tour booked', 'Joined', 'Closed lost'];
export const sources = ['Website', 'Email', 'Phone', 'Walk-in'];

export function listEnquiries() {
  const database = getDatabase();
  return database.prepare(`
    SELECT e.*, c.full_name, c.email
    FROM enquiries e JOIN contacts c ON c.id = e.contact_id
    ORDER BY e.created_at DESC
  `).all();
}

export function listActivity(enquiryId) {
  const database = getDatabase();
  return database.prepare('SELECT * FROM activity WHERE enquiry_id = ? ORDER BY created_at DESC, rowid DESC').all(enquiryId);
}

export function createEnquiry(input) {
  const database = getDatabase();
  const now = new Date().toISOString();
  const email = input.email.trim().toLowerCase();
  let contact = database.prepare('SELECT id FROM contacts WHERE email = ?').get(email);
  database.exec('BEGIN');
  try {
    if (!contact) {
      contact = { id: randomUUID() };
      database.prepare('INSERT INTO contacts (id, full_name, email, created_at) VALUES (?, ?, ?, ?)')
        .run(contact.id, input.fullName.trim(), email, now);
    }
    const id = randomUUID();
    database.prepare(`INSERT INTO enquiries
      (id, contact_id, enquiry_type, source, subject, stage, owner, notes, created_at, next_follow_up_at)
      VALUES (?, ?, 'Membership', ?, ?, 'New', ?, ?, ?, ?)`).run(
      id, contact.id, input.source, input.subject.trim(), input.owner, input.notes.trim(), now, input.nextFollowUpAt
    );
    database.prepare('INSERT INTO activity (id, enquiry_id, kind, detail, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(randomUUID(), id, 'created', 'Membership enquiry added', now);
    database.exec('COMMIT');
    return id;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function updateEnquiry(id, input) {
  const database = getDatabase();
  const current = database.prepare('SELECT id, stage, owner, next_follow_up_at FROM enquiries WHERE id = ?').get(id);
  if (!current) return false;
  const now = new Date().toISOString();
  database.exec('BEGIN');
  try {
    database.prepare('UPDATE enquiries SET stage = ?, owner = ?, next_follow_up_at = ? WHERE id = ?')
      .run(input.stage, input.owner, input.nextFollowUpAt, id);
    for (const [key, label] of [['stage', 'Stage'], ['owner', 'Owner'], ['next_follow_up_at', 'Follow-up date']]) {
      const nextValue = key === 'next_follow_up_at' ? input.nextFollowUpAt : input[key];
      if (current[key] !== nextValue) {
        database.prepare('INSERT INTO activity (id, enquiry_id, kind, detail, created_at) VALUES (?, ?, ?, ?, ?)')
          .run(randomUUID(), id, 'updated', `${label}: ${current[key] || 'none'} → ${nextValue || 'none'}`, now);
      }
    }
    database.exec('COMMIT');
    return true;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function recordFollowUp(id, nextFollowUpAt) {
  const database = getDatabase();
  if (!database.prepare('SELECT id FROM enquiries WHERE id = ?').get(id)) return false;
  const now = new Date().toISOString();
  database.exec('BEGIN');
  try {
    database.prepare('UPDATE enquiries SET last_contacted_at = ?, next_follow_up_at = ? WHERE id = ?')
      .run(now, nextFollowUpAt, id);
    database.prepare('INSERT INTO activity (id, enquiry_id, kind, detail, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(randomUUID(), id, 'follow_up', `Follow-up recorded; next due ${nextFollowUpAt || 'none'}`, now);
    database.exec('COMMIT');
    return true;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}
