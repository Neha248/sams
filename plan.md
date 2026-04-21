# Smart Attendance Management System (SAMS) - Master Project Plan

## 1. Executive Summary & Identity
**Project Name:** Smart Attendance Management System (SAMS)
**Core Objective:** Design and implement a complete, production-ready full-stack Enterprise Resource Planning (ERP) application focused specifically on University/School attendance management.
**Target User Identity:** Minsu Agrahari (Primary stakeholder/example logged-in persona testing Admin/Teacher/Student workflows).

---

## 2. UI/UX Design System: "Neo-Shinjuku Night"
The entire application was designed via the **Google Stitch MCP Server** (Project ID: `5939056300520780389`). The design constraints strictly adhere to the following UI aesthetic rules:
*   **Theme:** Tokyo minimalism, highly premium, futuristic, dark mode.
*   **Color Palette:**
    *   **Primary/Base:** Deep Navy / Charcoal (`#0e1322`, `#161d30`).
    *   **Accents:** Tokyo Neon Blue (`#00D4FF`), Neon Cyan (`#00ffff`), and Soft Red / Crimson (`#FF4B6E`).
    *   **Secondary Text/Borders:** White / Light Grays with low opacity.
*   **Typography:** Google Inter font (modern, editorial-style readability).
*   **Key Aesthetics:** Glassmorphism (`backdrop-blur-md`), ambient glows (no heavy solid borders), asymmetrical layouts, and smooth micro-animations.

---

## 3. System Architecture & Stack

The project uses a fully Dockerized client-server architecture.

### **Frontend (Client)**
*   **Framework:** React 18 initialized via Vite (`template react-ts`).
*   **Styling:** Tailwind CSS + custom configuration in `tailwind.config.js` to enforce the Neo-Shinjuku variables. Shadcn UI conceptual logic.
*   **State Management:** Zustand with local-storage persistence (`sams-auth` key).
*   **Routing:** React Router v6.
*   **API Client:** Axios with an authentication interceptor that auto-injects JWT tokens into headers. 
*   **Icons/Charts:** Lucide-React and Recharts.

### **Backend (API)**
*   **Runtime:** Node.js powered by Express.
*   **Language:** TypeScript (strict mode).
*   **Database:** MongoDB inside a Docker container (accessed via Mongoose).
*   **Authentication:** Custom JSON Web Tokens (JWT) combined with Bcrypt password hashing.
*   **Validation:** Zod library strictly enforcing request payload typing across endpoints.
*   **PDF Exports:** `pdfkit` module handles translating attendance arrays into heavily-branded, pixel-perfect A4 reports.

### **Infrastructure (Docker)**
*   **Backend Node Container** (Internal Port 5000)
*   **MongoDB Image** (Internal Port 27017, mounted to persistence volumes)
*   **Mongo-Express** (GUI on Port 8081 for DB inspection)
*   **Frontend Nginx Container** (Reverse proxies `/api` to Node backend, serves statically built React UI on Port 80/5173).

---

## 4. Core Business Logics & Workflows

### Role-Based Access Control (RBAC)
There are three user tiers, enforced at the API route level and frontend interface level:
1.  **Admin:** Full read/write access. Creates users, subjects, departments, builds timetables, and blasts notifications.
2.  **Teacher:** View timetable assignments, mark daily student attendance via UI pucks, view section-wide analytics.
3.  **Student:** View personal history. Subject to automated safety metrics (the system calculates exactly how many classes are required to pass the minimum threshold).

### The "75% Rule" Metric
The system heavily emphasizes dynamic calculation of a "Safe Line".
*   If attendance goes `< 75%`, warnings highlight in Crimson (`#FF4B6E`) and the backend calculates precisely `Required Classes = number needed to reach 75%`.
*   If attendance is `>= 75%`, UI highlights in Neon Blue (`#00D4FF`) showing safe status.

---

## 5. Database Schema Structure (Mongoose)

*   `User`: Base identity layer. Handles login credentials, `userId`, hashed `password`, and enum `role`.
*   `StudentProfile`: Maps to `User`. Adds `rollNumber`, `departmentId`, `semester`, `section`.
*   `TeacherProfile`: Maps to `User`. Adds `employeeId`, arrays of assigned `departments` and `subjects`.
*   `Department`: `name` and `code`.
*   `Subject`: `name`, `code`, linked `departmentId`, `credits`.
*   `Timetable`: Links teachers to subjects, rooms, timeslots, and target semantic cohorts (e.g. CS - Semester 5 - Section A).
*   `Attendance`: **Crucial compound index ensures no duplicate inserts per student+date+subject.** Tracks `present | absent | late`.
*   `Notification`: System alerts supporting various target priorities and target scopes (e.g. blast to "All Students in CS Sem 5").

---

## 6. Endpoints Overview

The Node API (`/api/*`) exposes:
*   **Auth:** `POST /login`, `POST /logout`, `GET /me`
*   **Student:** `GET /dashboard`, `GET /attendance`, `GET /timetable`, `GET /notifications`
*   **Teacher:** `GET /dashboard`, `GET /timetable`, `POST /attendance/mark`, `GET /analytics`
*   **Admin:** `GET /dashboard`, `POST /student/create`, `POST /teacher/create`, `POST /timetable/create`, etc.

---

## 7. Current Project Status & "To-Do" For Next Dev

**What has been completed:**
1.  Full frontend scaffold (`package.json`, Vite, Tailwind, Layout logic, Login screen routing).
2.  Full backend API architecture (`models/`, `controllers/`, `routers/`, `middlewares/`, `services/`, `utils/`).
3.  `docker-compose.yml` mapped and connected smoothly.
4.  A heavy-duty asynchronous `scripts/seed.ts` file capable of initializing all departments, 55 users, timetables, and simulating 30 days of randomized attendance data instantly.

**Next Immediate Steps for Continuation:**
1.  **Run the Stack:** Execute `docker-compose up --build -d` and confirm Nginx successfully proxy-passes requests from Vite to Node.
2.  **Verify DB Seed:** Run `npm run seed` inside the backend container and log in as `ADMIN001` or `STU001` to test the state integration.
3.  **Expand Frontend UI:** Currently, `Dashboard.tsx` is a basic functional template. A future AI iteration should translate the detailed raw visual component specs generated via the initial Stitch sessions into precise React+Tailwind TSX code pieces (Student Dash cards, Timetable drag-and-drop cells, Admin data tables).
4.  **PDF Endpoints Hookup:** Connect a frontend download button to the backend `generateStudentPDF` streaming service.
