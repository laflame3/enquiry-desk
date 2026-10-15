# Membership enquiry data flow

```text
Website / phone / email / walk-in
                 │
                 ▼
        Staff creates enquiry
                 │
                 ▼
      Contact deduplicated by email
                 │
                 ▼
       Owner + stage + next date
                 │
          ┌──────┴──────┐
          ▼             ▼
   Staff follow-up   GM overview
          │          Due / overdue
          ▼
   Contact recorded
          │
          ▼
   Joined / closed lost
```

## Current storage

`contacts` stores one person per normalised email address. `enquiries` stores each membership question, its source, stage, owner and follow-up dates. `activity` records creation, changes and follow-up actions. One contact may have multiple enquiries. The prototype models one sample club, so it has no account or tenant table.

## What to validate with a club before a real pilot

1. Where enquiries currently arrive, how staff avoid duplicates, and who owns a conversation after a shift changes.
2. Which stages reflect actual decisions, including tours, applications, joins and lost leads.
3. Whether an acknowledgement should be automatic, and who approves templates and sending rules.
4. What a GM needs to see daily: response time, enquiries without an owner, overdue follow-ups and completed joins.
5. How the club handles personal data, access permissions, consent, deletion and retention.

## Next technical slices

After workflow validation, design club accounts and tenant isolation before connecting real customer data. Then add authenticated staff roles, controlled email ingestion/sending, society and event enquiry types, GM renewal/compliance tasks, and reporting. Each slice should have an observable user action and a clear owner rather than an all-at-once platform specification.
