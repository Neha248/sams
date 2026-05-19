# Smart Attendance Management System (SAMS)

Full-stack attendance platform for Admin, Teacher, and Student workflows.

## Teacher Module (V2)

```text
Teacher
├── Dashboard         — Readonly schedule terminal
├── Mark Attendance   — Attendance marking workflow (frontend staging)
└── Analysis Console  — Readonly extraction & analytics (`/teacher/analysis`)
```

**Theme:** Neo-Shinjuku Night — dark navy, glassmorphism, neon cyan accents.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Zustand, Axios, React Router
- Backend: Node.js, Express, TypeScript, Mongoose, JWT, bcrypt, Zod, PDFKit
- Infra: Docker, Docker Compose, Nginx, MongoDB, Mongo Express

## Updated Project Structure

```bash
SAMS-update/
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   │   └── db.ts
│   │   ├── controllers/
│   │   │   ├── admin.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── student.controller.ts
│   │   │   └── teacher.controller.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── role.middleware.ts
│   │   ├── models/
│   │   │   ├── Attendance.model.ts
│   │   │   ├── Department.model.ts
│   │   │   ├── Notification.model.ts
│   │   │   ├── StudentProfile.model.ts
│   │   │   ├── Subject.model.ts
│   │   │   ├── TeacherProfile.model.ts
│   │   │   ├── Timetable.model.ts
│   │   │   └── User.model.ts
│   │   ├── routes/
│   │   │   ├── admin.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── student.routes.ts
│   │   │   └── teacher.routes.ts
│   │   ├── services/
│   │   │   └── pdf.service.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   ├── logger.ts
│   │   │   └── response.ts
│   │   └── validators/
│   │       ├── attendance.validator.ts
│   │       ├── auth.validator.ts
│   │       └── timetable.validator.ts
│   ├── scripts/
│   │   └── seed.ts
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── attendance/
│   │   │   │   ├── AttendanceFilters.tsx
│   │   │   │   ├── AttendanceTable.tsx
│   │   │   │   ├── AttendanceReviewModal.tsx
│   │   │   │   └── AttendanceSummaryChart.tsx
│   │   │   └── analytics/
│   │   │       ├── AnalyticsFilters.tsx
│   │   │       ├── AnalyticsTable.tsx
│   │   │       ├── AttendanceOverviewChart.tsx
│   │   │       ├── StudentTrendChart.tsx
│   │   │       └── ExportPanel.tsx
│   │   ├── lib/
│   │   │   ├── axios.ts
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── AdminNotifications.tsx
│   │   │   ├── AdminStudents.tsx
│   │   │   ├── Attendance.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Notifications.tsx
│   │   │   ├── TeacherAnalytics.tsx
│   │   │   ├── TeacherAttendance.tsx
│   │   │   └── Timetable.tsx
│   │   ├── store/
│   │   │   └── authStore.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 18+
- npm
- Docker Desktop (for Docker setup)
- MongoDB locally (only for non-Docker setup)

## Installation and Setup

### 1) Clone and install dependencies

```bash
git clone <your-repo-url>
cd SAMS-update

cd backend
npm install

cd ../frontend
npm install
```

### 2) Configure backend environment

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/attendance_system
JWT_SECRET=sams_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:5173
```

## Run Modes

### Option A: Local Development (Node + local MongoDB)

1. Start MongoDB on `localhost:27017`.
2. Start backend:

```bash
cd backend
npm run dev
```

3. Start frontend in a new terminal:

```bash
cd frontend
npm run dev
```

4. Seed data (required for test login):

```bash
cd backend
npm run seed
```

5. Open:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend health: [http://localhost:5000/health](http://localhost:5000/health)

### Option B: Docker Compose

1. From project root:

```bash
docker-compose up --build -d
```

2. Check running services:

```bash
docker-compose ps
```

Expected services:
- `sams-backend`
- `sams-frontend`
- `attendance-mongodb`
- `sams-mongo-express`

3. Seed the database:

```bash
docker exec -it sams-backend npm run seed
```

4. Open:
- Frontend: use `docker-compose ps` and open host port mapped to container `80`
- Backend health: open host port mapped to container `5000` + `/health`
- Mongo Express: [http://localhost:8081](http://localhost:8081)

## Login Credentials (Important)

### SAMS App login credentials (after seed)

Use these in the app login form:

- Admin: `ADMIN001` / `Admin@123` (role: `admin`)
- Teacher: `TCH001` / `Teacher@123` (role: `teacher`)
- Student: `STU001` / `Student@123` (role: `student`)

### Mongo Express credentials (NOT app login)

Only for [http://localhost:8081](http://localhost:8081):

- Username: `admin`
- Password: `admin123`

## Routes by Role

- Student: `/`, `/attendance`, `/timetable`, `/notifications`
- Teacher: `/`, `/teacher/attendance`, `/teacher/analysis`, `/timetable`
- Admin: `/`, `/admin/students`, `/admin/notifications`

## Teacher Analysis Console

**Route:** `/teacher/analysis`  
**Page:** `frontend/src/pages/TeacherAnalytics.tsx`

**Purpose:** Attendance extraction and visualization terminal (readonly).

### Features

- Department, semester, section, and subject filters
- Student search with roll-number identity resolution
- Status filtering (Present / Absent / Late, multi-select)
- Attendance extraction results table (search + pagination)
- Cohort analytics and student-level trend visualization
- CSV export (frontend-only)

### Analytics Modes

| Mode | Condition | Charts |
| :--- | :--- | :--- |
| **All students** | Student search empty | Present vs Absent (pie) |
| **Single student** | Name + university roll or class roll | Present vs Absent (pie) + attendance trend (line: Present / Absent / Late over date) |

### Tech

- Recharts, React, TypeScript
- Glassmorphism UI, Neo-Shinjuku theme

### Current State

- **READ ONLY** — frontend analytics and mock/read staging only
- No DB mutation from this screen
- No backend PDF report generation yet

### Future

- PDF export (`pdf.service.ts`)
- Attendance aggregation pipelines
- Historical trends from live `GET /teacher/analytics`
- Realtime analytics (deferred)

## Common Troubleshooting

### Mongo URI undefined / backend fails to connect

- Ensure `backend/.env` exists.
- Ensure `MONGO_URI` is present in `.env`.
- Restart backend after editing `.env`.

### Invalid credentials on login

- Seed database first (`npm run seed` in backend).
- Use `ADMIN001` / `Admin@123` (not `admin/admin123`).
- Ensure correct role selected in login form.

### API not reachable from frontend

- Confirm backend is running and `/health` returns `{ status: "ok" }`.
- In local mode, ensure frontend runs on `5173` and backend on `5000`.

## Useful Commands

```bash
# Local backend
cd backend && npm run dev

# Local frontend
cd frontend && npm run dev

# Seed
cd backend && npm run seed

# Docker up/down
docker-compose up --build -d
docker-compose down
```