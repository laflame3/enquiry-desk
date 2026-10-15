import { createEnquiry, listEnquiries } from '../../../lib/db.js';
import { validateCreate } from '../../../lib/validation.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ enquiries: listEnquiries() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  let input;
  try { input = await request.json(); } catch { return Response.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  const error = validateCreate(input);
  if (error) return Response.json({ error }, { status: 400 });
  const id = createEnquiry(input);
  return Response.json({ id }, { status: 201 });
}
