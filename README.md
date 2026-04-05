# 🚀 Tydy — Frontend

Frontend application for a QR-based task management and supervision platform.

## 🌐 Demo

Live Demo: [https://tydy.pro](https://tydy.pro)

## 🔐 Demo Access

The application is currently deployed but requires authentication.

Demo access can be provided upon request.

## ⚙️ Tech Stack

- React 19
- Vite 6
- Tailwind CSS 4
- Redux Toolkit + RTK Query
- React Router 7
- Vite PWA Plugin
- ApexCharts
- QR scanning libraries: `html5-qrcode` and `@zxing/browser`
- PDF and export tooling: `jspdf`, `jspdf-autotable`, `xlsx`, `file-saver`

## 🏗️ Architecture

The frontend follows a modular React architecture built around role-based navigation and centralized state management.

- `src/auth` handles authentication flows
- `src/components` contains shared layout and UI building blocks
- `src/views/dashboard` contains admin and supervisor interfaces
- `src/views/empleados` contains the employee workflow for QR scanning and task execution
- `src/redux/slices` manages client-side state
- `src/redux/api` centralizes API communication through RTK Query

### Architectural highlights

- Role-based routing for admin, supervisor, employee, and client-facing flows
- Centralized API layer with auth-aware headers and automatic logout on `401`
- QR-driven task execution flow connected to real-time activity logging
- PWA support for installability and update handling
- Multi-tenant structure designed around companies, locations, areas, and task lists

## 🚀 Run Local

### Requirements

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## 🧠 About the Project

Tydy is a functional full-stack application designed to manage and supervise task execution in real-world environments such as cleaning services, maintenance operations, and field teams.

The platform enables companies to track and validate work performed across multiple locations using QR-based workflows.

### 🔍 How it works

- Employees go to a specific location and scan a QR code
- Each QR code loads a predefined checklist of tasks assigned to that area
- Tasks are completed and marked in real-time
- Every interaction generates logs and records for tracking and reporting

### 👥 Role-based system

Tydy supports multiple user roles, each with a dedicated interface:

- **Admin** → Manages companies, employees, locations, areas, and task lists
- **Supervisor** → Oversees operations and monitors task execution
- **Employee** → Scans QR codes and completes assigned tasks
- **Client** → Views reports and service activity

### 🏢 System structure

- Companies → Locations → Areas
- Employees are assigned to specific areas
- Task lists are created per area
- QR codes are automatically generated for each task list

### 📊 Key capabilities

- QR-based task execution
- Real-time activity tracking
- Automated record generation
- Admin dashboard with full system control
- Multi-tenant structure (supports multiple companies)

---

### 🚀 Current Status

Tydy is currently running as an MVP and is being tested in real companies, validating real-world usage and workflows.
