# Smart Attendance Management System (SAMS) - Current Project Plan

## 1. Project Identity

**Project name:** Smart Attendance Management System (SAMS)

**Goal:** A role-based attendance ERP for Admin, Teacher, and Student workflows, implemented as a single TanStack Start application with SQLite persistence.

**Target users:**

- **Admin:** Manage institution data, students, teachers, timetable, and announcements.
- **Teacher:** View assigned schedule, mark or revise attendance, analyze records, and download reports.
- **Student:** Review attendance history, timetable, notifications, reports, and 75% safe-zone status.

## 2. Current Architecture

SAMS has been rewritten from the old MongoDB/Express/frontend split into one TanStack Start app.

- **Frontend and routing:** React, TanStack Start, TanStack Router.
- **Server boundary:** TanStack Start server functions in `src/lib/sams-actions.ts`.
- **Domain layer:** `src/server/sams-service.ts`.
- **Database layer:** SQLite through `sql.js` in `src/server/sams-db.ts`.
- **Seed data:** `src/server/sams-seed.ts`, automatically inserted when the SQLite database has no users.
- **UI:** DaisyUI and Tailwind through the existing `src/styles.css`; do not edit `src/styles.css` unless explicitly requested.
- **Charts and icons:** Recharts and lucide-react.
- **Reports:** PDFKit through `src/server/pdf-report.ts`; CSV export helpers in service/UI code.
- **Deployment:** Nitro Vite adapter for local build output and Vercel output.
- **PWA:** Installable online-only PWA with `public/manifest.webmanifest` and network-only `public/sw.js`.
- **Docker:** Minimal Dockerfile and Compose setup run `npm run dev` with a persistent `sams-data` volume.

## 3. Persistence and Hosting

Local and Docker development use:

```text
data/sams.sqlite
```

Vercel demo deployments use `/tmp/sams.sqlite` when `VERCEL` is present and `SAMS_DB_FILE` is not set.

Important constraints:

- `/tmp` on Vercel is demo-only scratch storage.
- Sessions, attendance writes, notifications, and report-visible data are not durable on Vercel.
- Real production hosting needs durable storage such as Turso/libSQL, Neon/Vercel Postgres, or Docker with a persistent volume.

## 4. Completed Functional Surface

### Admin

- Dashboard metrics and faculty attendance overview.
- Department and subject creation.
- Student overview with filters, add/remove student, and CSV export.
- Teacher overview with create/remove teacher.
- Timetable filters, add/edit/delete slots, and publish cohort.
- Notification composer for all users, departments, students, or teachers.

### Teacher

- Dashboard with IST date/time and daily schedule completion.
- Attendance roster loading for assigned timetable slots and dates.
- Bulk status updates, remarks, saved-record badges, and last-edited metadata.
- Attendance revision for previously saved assigned classes.
- Analysis console with subject/status/student filters.
- Teacher CSV and PDF report exports.
- Notification feed with unread/read behavior.

### Student

- Dashboard with 75% safe-zone calculations per subject.
- Required classes needed to reach safe status.
- Attendance record filters.
- Timetable and notifications.
- PDF report export.

## 5. Data Integrity Rules

- Sessions are stored in SQLite and checked server-side for every protected read, mutation, and export.
- RBAC must remain server-enforced:
  - Admin-only catalog, timetable, user, and notification management.
  - Teacher-only assigned attendance writes.
  - Student-only personal attendance and report reads.
- Attendance has one logical record per `student_id + subject_id + date`.
- Attendance writes use SQLite `insert ... on conflict(student_id, subject_id, date) do update`.
- Profile identity fields stay unique: login ID, email, student roll number, teacher employee ID, and profile user IDs.
- Student safe-zone status is per subject at a 75% threshold.
- Every 2 late marks count as 1 absent for policy display while preserving raw late counts.

## 6. Current Verification Commands

Use these before committing meaningful changes:

```bash
npm run typecheck
npm run check
npm run build
npm run smoke
```

For Vercel-sensitive changes, also run:

```bash
VERCEL=1 npm run build
```

For Docker-sensitive changes:

```bash
docker compose config
SAMS_PORT=3001 docker compose up -d
curl -I http://localhost:3001
docker compose down
```

## 7. Current Seeded Credentials

- Admin: `ADMIN001` / `Admin@123`
- Teacher: `TCH001` / `Teacher@123`
- Student: `STU001` / `Student@123`

Seed data intentionally covers semesters `1`, `3`, `5`, and `7`, multiple sections, teachers, students, subjects, timetables, historical attendance, and notifications.

## 8. Near-Term Plan

### Priority 1 - Production Persistence Decision

Choose the durable production database target before treating the Vercel deployment as production.

Recommended options:

- Turso/libSQL if staying closest to SQLite.
- Neon/Vercel Postgres if moving to hosted SQL with durable serverless storage.
- Docker deployment with a persistent volume if self-hosting.

### Priority 2 - Hardening and Regression Coverage

- Add focused tests for auth/RBAC service behavior.
- Add service-level tests for attendance upsert and revision behavior.
- Add report smoke tests for student and teacher PDF generation.
- Add CSV format regression tests for admin student and teacher analysis exports.

### Priority 3 - UX Polish

- Keep mobile layouts compact and single-column where needed.
- Keep table overflow intentional and limited to data tables only.
- Preserve unread notification badges in header and role navigation.
- Keep PDF and CSV exports formatted with metadata rows, readable tables, and escaped data.

### Priority 4 - Operational Readiness

- Document the chosen production database migration path.
- Decide whether admin-created admins are required and implement with explicit RBAC if needed.
- Add deployment notes for Vercel previews versus durable production hosting.
- Keep PWA behavior online-only unless auth, persistence, and reports are redesigned for offline use.

## 9. Non-Goals for the Current App

- Do not reintroduce MongoDB, Express, Nginx proxying, or the old multi-service stack.
- Do not add placeholder screens or mock-only visible workflows.
- Do not add offline caching or offline write behavior to the PWA.
- Do not add chat/reply messaging unless it is implemented end to end.
- Do not add new chart or icon libraries unless Recharts or lucide-react cannot satisfy a real requirement.
