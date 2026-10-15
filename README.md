# Fairway Desk

Fairway Desk is a small **golf club membership enquiry CRM prototype**. It tests one workflow: a prospective member asks a question, a staff member owns the enquiry, moves it through a pipeline, and records when to follow up. All names and addresses are synthetic. This is an independent portfolio exercise, not Clubhouse Revenue Ltd software or a production service.

## Run locally

Requires Node.js 22 or later.

```bash
npm ci --ignore-scripts
npm run dev
```

Open <http://127.0.0.1:3000>. On first run, the app creates `.data/clubhouse.sqlite` and five synthetic enquiries. The database is excluded from Git. To return to the sample state, stop the server and remove only `.data/clubhouse.sqlite`.

## What the prototype demonstrates

- Add a membership enquiry with a contact, source, owner, notes and next follow-up date.
- Reuse a contact by email across enquiries, rather than creating duplicate contact records.
- Move an enquiry through `New → Contacted → Tour booked → Joined / Closed lost`.
- Reassign an owner, schedule a follow-up and record when contact was made.
- Highlight due and overdue follow-ups and retain a simple activity history.
- Keep data after a server restart using local SQLite.

The UI is built with React and Next.js. Next.js route handlers run in Node.js, validate input and write to SQLite using Node's built-in `node:sqlite` module. Node.js 22 currently marks that module experimental; it is a useful dependency-light choice for this local demo, not a production database decision.

## Product reasoning

The first slice is intentionally limited to membership enquiries. The job description also mentions society and event bookings, email inbox synchronisation, GM compliance reminders, club accounts, staff permissions, reporting and integrations. Those are **proposed later slices**, not features of this prototype. A real pilot would first clarify who records each enquiry, what counts as a useful response, and which pipeline stages match the club's work. The architecture would then need tenant isolation, authentication, consent and retention controls, email provider integration, a hosted database, monitoring and operational support.

See [data flow](docs/data-flow.md) for the current model and a real pilot's open decisions.

## Demo walkthrough

[Watch the 90-second annotated walkthrough](docs/walkthrough.mp4). It is assembled from screenshots captured while exercising the local UI; it is not a continuous screen recording. [Overview screenshot](docs/screenshots/01-overview.jpg) and [follow-up activity screenshot](docs/screenshots/06-follow-up.jpg) are also available.

The video is included in the repository. Its optional source script, `docs/make_walkthrough.py`, needs Pillow and FFmpeg to regenerate the MP4 from the captured screenshots.

1. Open the overview and inspect the synthetic overdue enquiries.
2. Select Maya Patel, assign a follow-up date and change the stage to `Contacted`.
3. Record a follow-up; the activity history shows the action.
4. Add a new synthetic enquiry and choose a staff owner.
5. Refresh the page to see that the new record persists.

The UI does not send email or connect to live club systems. Do not enter real customer information.

## Attribution

This project was created independently for a job application exercise. Product requirements were interpreted from the public KCL Careers listing for Clubhouse Revenue Ltd. The interface and synthetic data are original to this demo; no company assets or internal data are included.
