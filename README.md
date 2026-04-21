# Smart Attendance Management System (SAMS)

A complete, production-ready full-stack application for managing university/school student and staff attendance. Built with a pristine **"Neo-Shinjuku Night"** visual aesthetic encompassing glassmorphism, neon glows, and sleek deep navy tones.

## 🚀 Tech Stack

**Frontend:**

- **React 18** & **Vite** (TypeScript)
- **Tailwind CSS v3** (Custom Neo-Shinjuku Theme)
- **Zustand** (State Management & Persisted Auth)
- **Lucide React** (Icons) & **React Router v6**
- **Axios** (With automatic token interception)

**Backend:**

- **Node.js** & **Express**
- **TypeScript** & **Zod** (Input Validation)
- **MongoDB** via **Mongoose**
- **JWT** (Authentication) & **Bcrypt** (Password Hashing)
- **PDFKit** (Automated Report Generation)

**Infrastructure:**

- **Docker** & **Docker Compose** (Containerization)
- **Mongo Express** (Database Admin UI)
- **Nginx** (Frontend Web Server & API proxy routing)

---

## 📂 Project Structure

```bash
/
├── backend/                  # Express + TypeScript Server
│   ├── src/
│   │   ├── config/           # Database configuration
│   │   ├── controllers/      # API Logic (Admin, Teacher, Student)
│   │   ├── models/           # Mongoose schemas
│   │   ├── middlewares/      # JWT verify, Roles, and Global Error handlers
│   │   ├── routes/           # Express routers
│   │   ├── services/         # PDF generation service
│   │   ├── utils/            # JWT helpers, format templates, logging
│   │   └── validators/       # Zod schemas for validation
│   ├── scripts/
│   │   └── seed.ts           # Development data generation script
│   └── Dockerfile            # Backend Container build strategy
│
├── frontend/                 # Vite + React Interface
│   ├── src/
│   │   ├── components/       # Reusable UI Elements (AppLayout, Cards)
│   │   ├── lib/              # Axios instance and Utility classes
│   │   ├── pages/            # Login, Dashboards and Routes
│   │   └── store/            # Zustand global state (authStore)
│   ├── tailwind.config.js    # Design tokens & color system
│   ├── nginx.conf            # Nginx routing logic for Docker
│   └── Dockerfile            # Frontend Container build strategy
│
└── docker-compose.yml        # Orchestration (Mongo, Backend, Frontend)
```

---

## 🛠️ How to Run the Project

You can run SAMS in two ways:

- **Option A:** Local development (frontend + backend with local MongoDB)
- **Option B:** Full Docker stack (recommended for quick setup)

### Prerequisites

- **Node.js** (v18+)
- **Docker Desktop** (required for Docker option)
- **MongoDB** (required only for local development option)

### Option A: Run Locally (without Docker)

1. Install dependencies:

```bash
cd backend
npm install
cd ../frontend
npm install
cd ..
```

1. Set backend environment in `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/attendance_system
JWT_SECRET=sams_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:5173
```

1. Start MongoDB locally (make sure it is running on port `27017`).
2. Start backend:

```bash
cd backend
npm run dev
```

1. In a new terminal, start frontend:

```bash
cd frontend
npm run dev
```

1. Op

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend health: [http://localhost:5000/health](http://localhost:5000/health)
- Login: use the seeded demo accounts (see **Built-in Test Accounts** below)

### Option B: Run with Docker Compose

1. From project root (where `docker-compose.yml` exists), run:

```bash
docker-compose up --build -d
```

1. Validate containers:

```bash
docker-compose ps
```

You should see:

1. `sams-frontend`
2. `sams-backend`
3. `attendance-mongodb`
4. `sams-mongo-express`

1. Seed the database:

```bash
docker exec -it sams-backend npm run seed
```

1. Open:

- Frontend: use `docker-compose ps` and open the host port mapped to container port `80`
- Backend health: use `docker-compose ps` and open `http://localhost:<backend_port>/health` where `<backend_port>` maps to container port `5000`
- Mongo Express: [http://localhost:8081](http://localhost:8081)
  - Username: `admin`
  - Password: `admin123`

### Important: How Frontend connects to Backend

- The frontend calls the API via **relative** URLs (`/api/...`).
- **Docker mode**: Nginx in the frontend container proxies `/api/`* to the backend container.
- **Local dev mode**: Vite dev server proxies `/api/`* to `http://localhost:5000`.

---

## 🌍 Accessing the Application

Now that the system is fully running, you can access the environments using either local ports (Option A) or Docker mapped ports (Option B).

### 1. Frontend Application

- **Local run (Option A)**: [http://localhost:5173](http://localhost:5173)
- **Docker run (Option B)**: run `docker-compose ps` and open the host port mapped to container port `80`

### 2. Database Administrator Panel (Mongo Express)

- **URL**: [http://localhost:8081](http://localhost:8081)
- **Username**: `admin`
- **Password**: `admin123`
*(This GUI allows you to safely look inside MongoDB and verify records without terminal queries).*

### 3. Backend API Service

- **Local run (Option A)**: [http://localhost:5000/health](http://localhost:5000/health)
- **Docker run (Option B)**: run `docker-compose ps` and open `http://localhost:<backend_port>/health` where `<backend_port>` maps to container port `5000`
*(If you see `{ "status": "ok" }`, your backend is online and accepting API streams).*

### 4. Notes on Ports

- In local backend dev mode, if port `5000` is already in use, the server automatically falls back to another free port and logs the exact URL.
- In Docker mode, frontend and backend host ports are assigned dynamically to avoid port-collision failures on busy machines.

---

## ✅ Available Role Pages (Frontend)

After login, pages are available based on role:

- **Student**
  - `/` Dashboard
  - `/attendance` My Attendance (+ **Download PDF**)
  - `/timetable` Timetable
  - `/notifications` Notifications
- **Teacher**
  - `/` Dashboard
  - `/teacher/attendance` Mark Attendance
  - `/timetable` Timetable
  - `/teacher/analytics` Analytics (+ **Download PDF**)
- **Admin**
  - `/` Dashboard
  - `/admin/students` Student Management (deactivate)
  - `/admin/notifications` Notification Center

### Logout

- A **Logout** button is available on every protected page via the shared `AppLayout` (sidebar + top header).

## 📄 PDF Reports (APIs)

- **Student report**: `GET /api/student/report/pdf`
- **Teacher report**: `GET /api/teacher/report/pdf`

---

## 🔐 Built-in Test Accounts

The seed script generated the following ready-to-use profiles. You can use these down the frontend portal:


| Role              | User ID    | Password      |
| ----------------- | ---------- | ------------- |
| **Admin Panel**   | `ADMIN001` | `Admin@123`   |
| **Teacher Panel** | `TCH001`   | `Teacher@123` |
| **Student Panel** | `STU001`   | `Student@123` |


*(Note: The system contains TCH001 to TCH005 and STU001 to STU050)*

---

## 🛑 Stopping the Application

When you want to spin everything down and release system memory, run:

```bash
docker-compose down
```

*Note: Because volumes are configured in the `docker-compose.yml`, MongoDB standard data is persisted safely to disk. Next time you run `up`, the data will still be there unless you forcefully delete volumes.*