# Enquiry Desk

Enquiry Desk is a small **customer enquiry and follow-up CRM prototype** for a service team. It tests one reusable workflow: a person asks a question, a team member owns it, moves it through a pipeline, and records the next follow-up. Membership, booking and general enquiries share the same process. All names and addresses are synthetic. This is an independent portfolio exercise, not Clubhouse Revenue Ltd software or a production service.

## Run locally

Requires Node.js 22 or later.

```bash
npm ci --ignore-scripts
npm run dev
```

Open <http://127.0.0.1:3000>. On first run, the app creates `.data/enquiries.sqlite` and five synthetic enquiries. The database is excluded from Git. To reset the sample state, stop the server and remove only `.data/enquiries.sqlite`.

## What the prototype demonstrates

- Add an enquiry with a contact, category, source, owner, notes and next follow-up date.
- Reuse a contact by email across enquiries, rather than creating duplicate contact records.
- Move an enquiry through `New → Contacted → Appointment booked → Won / Closed lost`.
- Reassign an owner, schedule a follow-up and record when contact was made.
- Highlight due and overdue follow-ups and retain a simple activity history.
- Keep data after a server restart using local SQLite.

The UI is built with React and Next.js. Next.js route handlers run in Node.js, validate input and write to SQLite using Node's built-in `node:sqlite` module. That module is experimental in the required Node version, so this is a dependency-light local demo rather than a production database choice.

## How it relates to a golf club

A club could use the same workflow for membership questions, group bookings and other enquiries: record the contact and source, assign a staff owner, set a next action, and see overdue work. The category and stages in this prototype are intentionally broad; a pilot would adapt them to the club's actual process. Club-specific functions such as tee-time integrations, renewal reminders, email inbox synchronisation, multi-club permissions and reporting are **future design questions**, not completed features. Before handling real customer data, a pilot would also need tenant isolation, authentication, privacy and retention rules, a hosted database, monitoring and operational support.

See the [data flow](docs/data-flow.md) for the current model and pilot questions.

## Demo walkthrough

[Watch the 90-second annotated walkthrough](docs/walkthrough.mp4). It is assembled from screenshots captured while exercising the local UI; it is not a continuous screen recording. The [overview](docs/screenshots/01-overview.jpg) and [follow-up activity](docs/screenshots/06-follow-up.jpg) screenshots are also available. The optional `docs/make_walkthrough.py` script needs Pillow and FFmpeg to regenerate the MP4.

1. Inspect the synthetic pipeline and due or overdue enquiries.
2. Open a contact, assign a follow-up date and change the stage to `Contacted`.
3. Record a follow-up; the activity history shows the action.
4. Add a new synthetic booking or general enquiry and choose a staff owner.
5. Refresh to see that the new record persists in SQLite.

The UI does not send email or connect to live systems. Do not enter real customer information.

## Attribution

This project was created independently for a job application exercise. A golf club is one possible use case, informed by the public KCL Careers listing for Clubhouse Revenue Ltd. The interface and synthetic data are original to this demo; no company assets or internal data are included.
