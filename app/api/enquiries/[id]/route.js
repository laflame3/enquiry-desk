import { listActivity, listEnquiries, updateEnquiry } from '../../../../lib/db.js';
import { validateUpdate } from '../../../../lib/validation.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const enquiry = listEnquiries().find(item => item.id === params.id);
  if (!enquiry) return Response.json({ error: 'Enquiry not found.' }, { status: 404 });
  return Response.json({ enquiry, activity: listActivity(params.id) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request, { params }) {
  let input;
  try { input = await request.json(); } catch { return Response.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  const error = validateUpdate(input);
  if (error) return Response.json({ error }, { status: 400 });
  if (!updateEnquiry(params.id, input)) return Response.json({ error: 'Enquiry not found.' }, { status: 404 });
  return Response.json({ ok: true });
}
