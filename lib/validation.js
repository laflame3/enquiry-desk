import { categories, owners, sources, stages } from './db.js';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const validDate = value => {
  if (value === null) return true;
  if (typeof value !== 'string' || !datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export function validateCreate(input) {
  if (!input || typeof input !== 'object') return 'Request body must be an object.';
  if (typeof input.fullName !== 'string' || input.fullName.trim().length < 2 || input.fullName.length > 100) return 'Enter a contact name of 2–100 characters.';
  if (typeof input.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) || input.email.length > 200) return 'Enter a valid email address.';
  if (typeof input.subject !== 'string' || input.subject.trim().length < 3 || input.subject.length > 120) return 'Enter a subject of 3–120 characters.';
  if (!categories.includes(input.category)) return 'Choose a listed enquiry category.';
  if (!sources.includes(input.source)) return 'Choose a listed enquiry source.';
  if (!owners.includes(input.owner)) return 'Choose a listed owner.';
  if (typeof input.notes !== 'string' || input.notes.length > 1000) return 'Notes must be under 1,000 characters.';
  if (!validDate(input.nextFollowUpAt)) return 'Choose a valid follow-up date.';
  return null;
}

export function validateUpdate(input) {
  if (!input || typeof input !== 'object') return 'Request body must be an object.';
  if (!stages.includes(input.stage)) return 'Choose a listed stage.';
  if (!owners.includes(input.owner)) return 'Choose a listed owner.';
  if (!validDate(input.nextFollowUpAt)) return 'Choose a valid follow-up date.';
  return null;
}

export function validateFollowUp(input) {
  if (!input || typeof input !== 'object' || !validDate(input.nextFollowUpAt)) return 'Choose a valid next follow-up date or clear it.';
  return null;
}
