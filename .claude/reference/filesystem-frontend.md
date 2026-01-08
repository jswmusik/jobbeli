# Frontend Architecture & File System: Feriearbete

This document outlines the file system structure, architectural patterns, and component hierarchy for the **Feriearbete** frontend. The system relies on **Next.js 15.x (App Router)** using a "Fortress" routing strategy to separate user roles.

## 1. Technology Stack
* **Framework:** Next.js 15.x (App Router)
* **React:** React 19.x
* **Language:** Strict TypeScript
* **Runtime:** Node.js 20 LTS or 22 LTS
* **Styling:** Tailwind CSS + shadcn/ui components
* **State/Data:** TanStack Query v5 (React Query)
* **Validation:** Zod (Mirrors Backend Pydantic schemas)
* **Image Optimization:** `next/image` + Imgproxy

---

## 2. Root Directory Structure
The structure emphasizes a clear separation between **Routing** (`/app`), **UI Logic** (`/components`), and **Data Logic** (`/lib`).

```text
/frontend
├── /public                     # Static assets (fonts, images)
├── /src
│   ├── /app                    # <--- ROUTING (The Fortresses)
│   │   ├── (public)            # Marketing & SEO
│   │   ├── (auth)              # Login & BankID
│   │   ├── (admin)             # Super Admin Dashboard
│   │   ├── (municipality)      # Municipality Dashboard (Heavy Logic)
│   │   ├── (company)           # Company Dashboard
│   │   ├── (youth)             # Youth Dashboard (Mobile First)
│   │   └── (guardian)          # Guardian Approval Portal
│   │
│   ├── /components             # <--- UI BLOCKS
│   │   ├── /ui                 # Shadcn primitives (Button, Input, Dialog)
│   │   ├── /shared             # Global (Navbar, Footer, LanguageSwitch)
│   │   └── /domains            # FEATURE MODULES (Matches Backend Apps)
│   │       ├── /auth
│   │       ├── /jobs
│   │       ├── /lottery
│   │       ├── /cv-builder
│   │       ├── /education
│   │       ├── /users
│   │       ├── /cms
│   │       └── /files
│   │
│   ├── /lib                    # <--- UTILS & API
│   │   ├── /api                # Axios/Fetch wrappers (Matches Django ViewSets)
│   │   ├── /hooks              # React Query hooks (useJob, useLotteryRun)
│   │   ├── /validations        # Zod Schemas (Matches Backend Serializers)
│   │   └── utils.ts            # CN helper, Date formatting
│   │
│   ├── middleware.ts           # Route Protection (Role checks)
│   └── types.ts                # Global TypeScript definitions
│
├── next.config.mjs             # Image optimization config
├── tailwind.config.ts
├── Dockerfile
└── package.json

Here is the complete Markdown file (frontend_structure.md) for the Feriearbete frontend. This document maps the architecture defined in your Master Blueprint to the Next.js App Router structure.

You can copy the content below and save it as frontend_structure.md.

Markdown

# Frontend Architecture & File System: Feriearbete

This document outlines the file system structure, architectural patterns, and component hierarchy for the **Feriearbete** frontend. The system relies on **Next.js 14+ (App Router)** using a "Fortress" routing strategy to separate user roles.

## 1. Technology Stack
* [cite_start]**Framework:** Next.js 14+ (App Router) [cite: 463]
* [cite_start]**Language:** Strict TypeScript [cite: 467]
* [cite_start]**Styling:** Tailwind CSS + shadcn/ui components [cite: 464]
* [cite_start]**State/Data:** TanStack Query (React Query) [cite: 465]
* [cite_start]**Validation:** Zod (Mirrors Backend Pydantic schemas) [cite: 466]
* [cite_start]**Image Optimization:** `next/image` + Imgproxy [cite: 474]

---

## 2. Root Directory Structure
[cite_start]The structure emphasizes a clear separation between **Routing** (`/app`), **UI Logic** (`/components`), and **Data Logic** (`/lib`) [cite: 689-727].

```text
/frontend
├── /public                     # Static assets (fonts, images)
├── /src
│   ├── /app                    # <--- ROUTING (The Fortresses)
│   │   ├── (public)            # Marketing & SEO
│   │   ├── (auth)              # Login & BankID
│   │   ├── (admin)             # Super Admin Dashboard
│   │   ├── (municipality)      # Municipality Dashboard (Heavy Logic)
│   │   ├── (company)           # Company Dashboard
│   │   ├── (youth)             # Youth Dashboard (Mobile First)
│   │   └── (guardian)          # Guardian Approval Portal
│   │
│   ├── /components             # <--- UI BLOCKS
│   │   ├── /ui                 # Shadcn primitives (Button, Input, Dialog)
│   │   ├── /shared             # Global (Navbar, Footer, LanguageSwitch)
│   │   └── /domains            # FEATURE MODULES (Matches Backend Apps)
│   │       ├── /auth
│   │       ├── /jobs
│   │       ├── /lottery
│   │       ├── /cv-builder
│   │       ├── /education
│   │       ├── /users
│   │       ├── /cms
│   │       └── /files
│   │
│   ├── /lib                    # <--- UTILS & API
│   │   ├── /api                # Axios/Fetch wrappers (Matches Django ViewSets)
│   │   ├── /hooks              # React Query hooks (useJob, useLotteryRun)
│   │   ├── /validations        # Zod Schemas (Matches Backend Serializers)
│   │   └── utils.ts            # CN helper, Date formatting
│   │
│   ├── middleware.ts           # Route Protection (Role checks)
│   └── types.ts                # Global TypeScript definitions
│
├── next.config.mjs             # Image optimization config
├── tailwind.config.ts
├── Dockerfile
└── package.json
3. The App Router (Role-Based Fortresses)
The application is split into distinct "Route Groups" (indicated by parenthesis) to isolate layouts and access control .

A. Municipality Portal (src/app/(municipality))
The "Power User" interface for administering jobs and lotteries .

Plaintext

src/app/(municipality)
├── layout.tsx                  # Sidebar, Admin Header, AuthCheck
├── page.tsx                    # Dashboard Overview (Stats)
│
├── /jobs                       # JOB MANAGEMENT
│   ├── page.tsx                # [LIST] <JobDataTable />
│   ├── /create
│   │   └── page.tsx            # [CREATE] <JobForm onSubmit={api.create} />
│   └── /[id]
│       ├── page.tsx            # [VIEW] <JobDetailView />
│       └── /edit
│           └── page.tsx        # [EDIT] <JobForm initialData={job} />
│
├── /lottery                    # LOTTERY ENGINE
│   ├── page.tsx                # Dashboard (Active Period status)
│   ├── /config
│   │   └── page.tsx            # Settings (Periods, Groups)
│   └── /run
│       └── page.tsx            # The Execution Screen (Run/Simulate)
│
├── /users                      # USER MANAGEMENT
│   ├── page.tsx                # List of Youth/Guardians
│   └── /[id]
│       └── page.tsx            # Detailed view (w/ Protected Identity flag)
│
└── /settings                   # ORG SETTINGS
    └── page.tsx                # Custom Fields, Logo, Invoice Info
B. Youth Portal (src/app/(youth))
A mobile-first, gamified interface for applicants .

Plaintext

src/app/(youth)
├── layout.tsx                  # Mobile Bottom Nav, Fun Header
├── page.tsx                    # "My Feed" (Status updates)
│
├── /jobs                       # JOB SEARCH
│   ├── page.tsx                # Search & Filter (Swipeable cards?)
│   └── /[id]
│       └── page.tsx            # Job Details + "Apply" Button
│
├── /cv                         # CV BUILDER (AI)
│   ├── page.tsx                # View My CV
│   └── /builder
│       └── page.tsx            # Multi-step AI Wizard
│
├── /education                  # LMS (Academy)
│   ├── page.tsx                # Course Catalog
│   └── /[courseId]
│       ├── page.tsx            # Course Overview
│       └── /learn
│           └── page.tsx        # Video Player / Quiz Interface
│
└── /profile
    └── page.tsx                # Edit Personal Info / Bank Account
C. Public & Auth (src/app/(public) & (auth))
Handles marketing, SEO, and the onboarding flow .

Plaintext

src/app/(public)
├── layout.tsx                  # Public Navbar
├── page.tsx                    # Landing Page (CMS Powered)
├── /blog                       # SEO Blog
│   ├── page.tsx                # Blog List
│   └── /[slug]
│       └── page.tsx            # Blog Post (Rendered from Backend JSON)
└── /contact
    └── page.tsx

src/app/(auth)
├── /login
│   └── page.tsx                # BankID / Email Toggle
├── /register
│   └── page.tsx                # Youth Onboarding Flow
└── /verify-guardian
    └── [token]
        └── page.tsx            # Guardian Approval Landing Page
4. Component Architecture (The "Domains")
Specific feature logic lives here, mirroring the backend apps .

A. Jobs Domain (src/components/domains/jobs)
Plaintext

/jobs
├── job-form.tsx                # <--- THE MASTER FORM (Create & Edit)
├── job-data-table.tsx          # Admin Table (Sorting, Filtering)
├── job-card.tsx                # Youth View (Visual card)
├── job-filters.tsx             # Sidebar filters
├── custom-fields-renderer.tsx  # Renders the specific muni fields
├── application-modal.tsx       # The "Apply Now" popup
└── application-status.tsx      # Visual stepper (Applied -> Lottery -> Matched)
B. Lottery Domain (src/components/domains/lottery)
Plaintext

/lottery
├── period-config-form.tsx      # Set dates for summer periods
├── simulation-runner.tsx       # "Start Simulation" button + Progress Bar
├── allocation-chart.tsx        # Recharts graph showing distribution
├── unmatched-youth-table.tsx   # List of losers + "Manual Assign" action
└── report-viewer.tsx           # PDF Viewer/Download for results
C. CV Domain (src/components/domains/cv-builder)
Plaintext

/cv-builder
├── ai-assistant-chat.tsx       # Chat interface for "Help me write this"
├── cv-preview.tsx              # Real-time PDF preview
├── skill-selector.tsx          # Tag input for skills
└── experience-timeline.tsx     # Drag-and-drop work history
D. Files & Security (src/components/domains/files)
Plaintext

/files
├── secure-upload-dropzone.tsx  # Drag & drop area with upload progress
├── virus-scan-status.tsx       # Animated icon: Scanning -> Safe/Infected
└── file-preview-list.tsx       # List of uploaded files with "Delete" buttons
E. Identity & Auth (src/components/domains/auth)
Plaintext

/auth
├── bankid-login-button.tsx     # Standardized "Log in with BankID" branding
├── guardian-verify-card.tsx    # The landing page for Guardians to click "Approve"
├── protected-id-shield.tsx     # Icon + Tooltip for anonymous users
└── manual-verify-modal.tsx     # Admin override for protected identities

5. UI Primitives (Design System)
Use standard Shadcn/UI components. Do not build these from scratch .

Inputs: Button, Input, Textarea, Checkbox, Switch, RadioGroup, Select, Combobox, DatePicker, Slider, Form.

Layout: Card, Sheet, Dialog, ScrollArea, Tabs, Separator, AspectRatio.

Data Display: Table, Badge, Avatar, Accordion, HoverCard.

Feedback: Toast, Alert, Skeleton, Progress, Tooltip, DropdownMenu.

6. The Data Layer (API & Zod)
Separate data definitions from UI components.

A. Validation Schemas (src/lib/validations/jobs.ts)
Must match backend serializers.py .

TypeScript

import { z } from "zod";

export const jobSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  spots: z.number().min(1),
  custom_fields: z.record(z.string(), z.any()), // JSONField
  // ...
});

export type JobFormValues = z.infer<typeof jobSchema>;
B. API Client (src/lib/api/jobs.ts)
The bridge to Django .

TypeScript

import axios from "./axios-client";
import { JobFormValues } from "@/lib/validations/jobs";

export const jobsApi = {
  getAll: (params: any) => axios.get("/jobs/", { params }),
  getOne: (id: string) => axios.get(`/jobs/${id}/`),
  create: (data: JobFormValues) => axios.post("/jobs/", data),
  update: (id: string, data: JobFormValues) => axios.put(`/jobs/${id}/`, data),
  apply: (id: string) => axios.post(`/jobs/${id}/apply/`),
};
