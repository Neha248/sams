# AGENTS.md

## Project Overview

- **Project name**: Smart Attendance Management System (SAMS)
- **Purpose**: A role-based attendance ERP for Admin, Teacher, and Student workflows.
- **Target users**: Admins manage institution data and announcements, teachers mark/revise assigned attendance and analyze records, and students review their own attendance, timetable, notifications, and safe-zone status.
- **Current architecture**: Single TanStack Start application with server functions, Nitro Vite adapter, and SQLite persistence.
- **Database**: Local SQLite file at `data/sams.sqlite`, initialized and seeded automatically. `SAMS_DB_FILE` can point to an alternate SQLite file. On Vercel, when `SAMS_DB_FILE` is unset, the demo database defaults to `/tmp/sams.sqlite` and auto-seeds there.
- **Styling**: DaisyUI components/themes through the existing `src/styles.css`. Do not edit `src/styles.css` unless explicitly requested.
- **Runtime**: `npm run dev` is the app server. `npm start` aliases to `npm run dev`.
- **Docker**: `docker compose up` runs the same Vite/TanStack dev-server path with persistent data in the `sams-data` volume. Use `docker compose up --watch` for Docker-based development with live source sync. Set `SAMS_PORT=3001` if host port 3000 is already occupied. The Dockerfile should stay minimal: install dependencies, copy the app, create `data/`, run `npm run dev`.
- **PWA**: The app is installable through `public/manifest.webmanifest` and `public/sw.js`. The service worker must stay network-only; SAMS is not an offline app.

## Core Workflows

- **Admin**
  - Dashboard metrics, department/subject creation, and department-filtered faculty attendance.
  - Student overview, CSV export, add/remove student.
  - Teacher assignment overview, create/remove teacher.
  - Timetable filter, add, edit, delete, publish cohort.
  - Notifications/messages to all users, departments, students, or teachers.

- **Teacher**
  - Dashboard with IST date/time and today schedule completion.
  - Mark attendance with roster loading, bulk status updates, remarks, saved-record badges, last-edited metadata, and SQLite upsert persistence.
  - Teachers can revise attendance later for their own assigned timetable slots and dates.
  - Analysis console with subject/status/student filters, CSV export, and PDF report.
  - Notifications with unread counts and read receipts.

- **Student**
  - Dashboard with 75% safe-zone calculations per subject.
  - Attendance record filters.
  - Timetable and notifications.
  - Notification read receipts.
  - PDF report export.

## Implementation Notes

- Server functions live in `src/lib/sams-actions.ts`.
- SQLite schema, migration, and persistence live in `src/server/sams-db.ts`.
- Seed data lives in `src/server/sams-seed.ts`; it intentionally covers semesters `1`, `3`, `5`, and `7`, multiple sections, students, teachers, subjects, timetable slots, attendance history, and notifications.
- Domain/service logic lives in `src/server/sams-service.ts`.
- Shared types live in `src/lib/sams-types.ts`.
- UI is intentionally consolidated in `src/components/SamsApp.tsx` for simplicity.
- Authorization is server-enforced in `src/server/sams-service.ts` by loading the session token from SQLite and checking the required role for each protected read, mutation, and export. Do not rely on client-side route visibility as authorization.
- Keep RBAC explicit for all new workflows: admin-only catalog/timetable/notification management, teacher-only assigned attendance writes, and student-only personal attendance/report reads.
- Attendance integrity depends on the SQLite `UNIQUE (student_id, subject_id, date)` constraint and `insert ... on conflict` upsert in `submitAttendance`. Preserve that one-record-per-student-subject-date rule when changing attendance writes.
- Profile identity constraints are part of the data model: `users.login_id`, `users.email`, `student_profiles.user_id`, `student_profiles.roll_number`, `teacher_profiles.user_id`, and `teacher_profiles.employee_id` stay unique.
- Student safe-zone logic is per subject at the 75% threshold. The UI should continue showing classes needed to become safe, and the policy display treats every 2 late marks as 1 absent while still preserving the raw `late` count.
- Attendance audit fields are `attendance.updated_at` and `attendance.updated_by`; migrations add them automatically for existing SQLite files.
- Report formatting helpers live in `src/server/pdf-report.ts`.
- PDF reports intentionally import `pdfkit/js/pdfkit.js` with `src/types/pdfkit-cjs.d.ts`. Do not switch this back to the default ESM import; PDFKit's ESM build references `__dirname` and fails in Vercel's ESM server bundle.
- Use `recharts` for charts and `lucide-react` for icons; do not add new chart or icon libraries unless there is a real capability gap.
- Admin student CSV and teacher analysis CSV must keep metadata rows and proper CSV escaping.
- Student/teacher PDF reports should use table sections rather than unstructured line dumps.
- Messaging is one-way admin notifications. Do not add chat/reply screens unless the feature is implemented end to end.
- Teacher analysis is read-only. It may filter, chart, export CSV, or download the teacher PDF report, but it must not mutate attendance records.
- Do not add placeholder screens, mock datasets, TODO-only flows, or fake frontend-only behavior for visible features. Any new visible workflow should be backed by the SQLite/service layer end to end.
- Keep mobile layouts usable with single-column forms, horizontally scrollable data tables, and compact header actions.
- Keep unread notification badges visible in the header and role navigation whenever a signed-in user has unread messages.
- Keep PWA assets simple and static. Do not add precaching or offline fallbacks unless the app's server-backed auth, reports, and SQLite persistence are redesigned for offline use.
- Vercel `/tmp` storage is demo-only scratch space; sessions and attendance writes are not durable there. Use durable database storage before treating a Vercel deployment as production.
- `npm run smoke` resets and uses `data/sams-smoke.sqlite`, not the normal development database.
- The old source app remains under `./sams` for reference only.

## Verification

```bash
npm run typecheck
npm run check
npm run build
npm run smoke
docker compose config
SAMS_PORT=3001 docker compose up -d
curl -I http://localhost:3001
docker compose down
```

## Seeded Credentials

- Admin: `ADMIN001` / `Admin@123`
- Teacher: `TCH001` / `Teacher@123`
- Student: `STU001` / `Student@123`
