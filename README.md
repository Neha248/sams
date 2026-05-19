# Smart Attendance Management System (SAMS)

Full-stack attendance platform for Admin, Teacher, and Student workflows.

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
│   │   │   └── AppLayout.tsx
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
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/attendance_system
JWT_SECRET=sams_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:5173
```

## Run Modes

### Option A: Local Development (Node + MongoDB)

**You need MongoDB on port 27017 before the backend will start.**

#### Start MongoDB (pick one)

**A) Docker (recommended)** — start **Docker Desktop**, then from project root:

```powershell
.\scripts\start-mongo.ps1
```

Or: `docker compose -f docker-compose.mongo.yml up -d`

**B) MongoDB installed on Windows** — start the **MongoDB Server** service in `services.msc`.

#### Free port 5001 (if local backend says port in use)

```powershell
.\scripts\free-port.ps1
```

This stops **Node only** on port **5001** (never kills Docker). Docker’s backend stays on **5000**; local `npm run dev` uses **5001** so both can run together with MongoDB in Docker.

#### Run app

1. Confirm MongoDB: port 27017 is listening.
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
   - Backend health: [http://localhost:5001/health](http://localhost:5001/health)

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
- Teacher: `/`, `/teacher/attendance`, `/teacher/analytics`, `/timetable`
- Admin: `/`, `/admin/students`, `/admin/teachers`, `/admin/timetable`, `/admin/notifications`

After seeding, students and teachers are spread across **semesters 1, 3, 5, and 7**. Use the semester filter on the admin Students and Teachers pages to browse each cohort.

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
- In local mode: frontend `5173`, backend **`5001`** (see `backend/.env` and `frontend/.env.development`).
- Vite proxies `/api` to `http://localhost:5001`. Docker full-stack backend uses **5000** — no conflict.
- Do **not** run `.\scripts\free-port.ps1 -Port 5000` — that can break Docker. Use default `5001` only.

### `/admin/timetable` shows "Route not found"

- That text comes from the **backend** (API not reachable on the proxy target), not a missing React page.
- Confirm `http://localhost:5001/health` works and restart `npm run dev` in `frontend` after changing ports.
- Restart backend after pulling timetable changes; confirm `GET /api/admin/timetable/overview` works.
- Log in as **admin** and open `http://localhost:5173/admin/timetable`.

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