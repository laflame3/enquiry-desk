# Customer enquiry data flow

```text
Website / phone / email / walk-in
                 │
                 ▼
   Staff creates categorised enquiry
                 │
                 ▼
      Contact reused by email
                 │
                 ▼
       Owner + stage + next date
                 │
          ┌──────┴──────┐
          ▼             ▼
   Staff follow-up   Team overview
          │          Due / overdue
          ▼
   Contact recorded
          │
          ▼
     Won / closed lost
```

## Current storage

`contacts` stores one person per normalised email address. `enquiries` stores a membership, booking or general question, its source, stage, owner and follow-up dates. `activity` records creation, changes and follow-up actions. One contact may have multiple enquiries. The prototype models one fictional service team, so it has no account or tenant table.

## Questions for a real pilot

1. Where enquiries arrive, how staff avoid duplicates, and who owns a conversation after a shift change.
2. Which categories and stages reflect actual work. For a golf club, this could include membership tours and group events.
3. Whether acknowledgement or reminders should be automatic, and who approves templates and sending rules.
4. What a manager needs to see daily: response time, unassigned enquiries, overdue follow-ups and completed outcomes.
5. How personal data, access permissions, consent, deletion and retention are handled.

## Next technical slices

After workflow validation, design customer accounts and tenant isolation before connecting real data. Then consider authenticated staff roles, controlled email ingestion and sending, domain-specific enquiry categories, reminders and reporting. Each slice should have an observable user action and a clear owner.
