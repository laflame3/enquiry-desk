import { recordFollowUp } from '../../../../../lib/db.js';
import { validateFollowUp } from '../../../../../lib/validation.js';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  let input;
  try { input = await request.json(); } catch { return Response.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  const error = validateFollowUp(input);
  if (error) return Response.json({ error }, { status: 400 });
  if (!recordFollowUp(params.id, input.nextFollowUpAt)) return Response.json({ error: 'Enquiry not found.' }, { status: 404 });
  return Response.json({ ok: true });
}
