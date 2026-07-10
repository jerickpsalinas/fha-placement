# FHA Student Placement, Graduation & Schedule Builder — Phase 1

A Next.js + Supabase application for Father's H.A.R.B.O.R. Academy staff to manage
individualized student placement, graduation tracking, and schedule building.

## What's included in Phase 1

- Staff login (Supabase Auth) with four roles: Admin, Counselor, Teacher, Read-only
- Row-Level Security enforcing role permissions at the database level
- Student profiles: demographics, GPA, credits, goals, EDGE interests
- Manual entry forms for adding students
- CSV import for rosters, test scores (MAP/FAST/IXL/ACT/SAT), and transcripts
- IEP/504 tracking with scheduling-relevant accommodation flags
- Florida graduation requirement audit engine (editable reference data, not hardcoded)
- Online learning requirement tracker
- EDGE Program pathway recommendation engine (transparent, rule-based)
- Individualized schedule builder with draft → pending → approved/rejected workflow
- Admin-only approval enforced both in the UI and at the database trigger level
- Audit log of all record changes

## What's NOT in Phase 1 (planned for Phase 2)

- PDF parsing of transcripts/report cards (Phase 1 stores uploaded PDFs as
  attachments on support plans, but does not auto-extract data from them)
- GradeLink integration
- Automated STEAM module assignment and full schedule auto-generation
  (Phase 1 schedule building is staff-assembled, with compliance checks
  surfaced from the audit engine — not yet a one-click auto-fill)
- IXL/MAP/FAST live data sync (Phase 1 uses manual entry or CSV)

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and note your
Project URL and anon key (Settings → API).

### 2. Run the database migrations

In the Supabase dashboard, go to the SQL Editor and run the three migration
files in order:

```
supabase/migrations/0001_init_schema.sql
supabase/migrations/0002_rls_policies.sql
supabase/migrations/0003_seed_reference_data.sql
```

Alternatively, if you have the Supabase CLI installed locally:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

### 3. Create your first admin account

Since the app requires a `staff_profiles` row to log in, you'll need to bootstrap
the first admin manually:

1. In the Supabase dashboard, go to Authentication → Users → "Add user" and
   create yourself with an email and password.
2. Copy that user's UUID.
3. In the SQL Editor, run:

```sql
insert into staff_profiles (id, full_name, role, active)
values ('paste-the-uuid-here', 'Jessica Brant', 'admin', true);
```

After that, you can invite additional staff directly from the app's
**Manage Staff** page.

### 4. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase values:

```bash
cp .env.local.example .env.local
```

You'll need:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API)
- `SUPABASE_SERVICE_ROLE_KEY` (Settings → API — keep this secret; it's only
  used server-side, for inviting new staff members)

### 5. Install dependencies and run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and log in with the admin account you created.

### 6. Deploy

The easiest path is [Vercel](https://vercel.com):

```bash
npm install -g vercel
vercel
```

Add the same three environment variables in the Vercel project settings
(Environment Variables) before deploying to production.

## Notes on the graduation requirements data

`graduation_requirements` and `best_standards` are stored as editable database
rows, not hardcoded logic — this is intentional, since Florida's requirements
are reviewed periodically. The seed migration includes the standard 24-credit
diploma framework for the 2026-2027 school year as a starting point; confirm
current-year figures before relying on the audit output for real graduation
decisions, and update the `graduation_requirements` table directly in Supabase
(or build an admin UI for it in a later phase) as requirements change.

## A note on IEP/504 data

Support plan documents (PDFs) can be attached via `support_plans.document_url`,
which should point to a Supabase Storage object. Phase 1 does not include the
Storage bucket setup or upload UI for these documents — add a private storage
bucket (`supabase storage create iep-documents --no-public`) and a corresponding
upload component before relying on this field in production.
