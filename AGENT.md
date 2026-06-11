# AGENTS.md

## Project Overview

- **Project name**: Smart Attendance Management System (SAMS)
- **Purpose**: A role-based attendance ERP for Admin, Teacher, and Student workflows.
- **Current architecture**: Single TanStack Start application with server functions, Nitro Vite adapter, and SQLite persistence.
- **Database**: Local SQLite file at `data/sams.sqlite`, initialized and seeded automatically. `SAMS_DB_FILE` can point to an alternate SQLite file. On Vercel, when `SAMS_DB_FILE` is unset, the demo database defaults to `/tmp/sams.sqlite` and auto-seeds there.
- **Styling**: DaisyUI components/themes through the existing `src/styles.css`. Do not edit `src/styles.css` unless explicitly requested.
- **Runtime**: `npm run dev` is the app server. `npm start` aliases to `npm run dev`.
- **Docker**: `docker compose up` runs the same Vite/TanStack dev-server path with persistent data in the `sams-data` volume. Use `docker compose up --watch` for Docker-based development with live source sync. Set `SAMS_PORT=3001` if host port 3000 is already occupied. The Dockerfile should stay minimal: install dependencies, copy the app, create `data/`, run `npm run dev`.

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
- Seed data lives in `src/server/sams-seed.ts`.
- Domain/service logic lives in `src/server/sams-service.ts`.
- Shared types live in `src/lib/sams-types.ts`.
- UI is intentionally consolidated in `src/components/SamsApp.tsx` for simplicity.
- Attendance audit fields are `attendance.updated_at` and `attendance.updated_by`; migrations add them automatically for existing SQLite files.
- Report formatting helpers live in `src/server/pdf-report.ts`.
- PDF reports intentionally import `pdfkit/js/pdfkit.js` with `src/types/pdfkit-cjs.d.ts`. Do not switch this back to the default ESM import; PDFKit's ESM build references `__dirname` and fails in Vercel's ESM server bundle.
- Admin student CSV and teacher analysis CSV must keep metadata rows and proper CSV escaping.
- Student/teacher PDF reports should use table sections rather than unstructured line dumps.
- Messaging is one-way admin notifications. Do not add chat/reply screens unless the feature is implemented end to end.
- Keep mobile layouts usable with single-column forms, horizontally scrollable data tables, and compact header actions.
- Keep unread notification badges visible in the header and role navigation whenever a signed-in user has unread messages.
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
