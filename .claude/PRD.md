# Feriearbete.se - Product Requirements Document

## 1. Executive Summary

Feriearbete.se is a comprehensive Swedish youth employment platform that connects young job seekers (typically 15-18 years old) with summer job opportunities offered by municipalities, municipal workplaces, and private companies. The platform's core innovation is a **stratified weighted lottery system** that ensures fair, transparent, and legally compliant distribution of limited summer job positions.

The platform serves multiple stakeholder groups: municipalities administering youth employment programs, workplaces posting available positions, companies seeking young workers, youth members applying for jobs, and guardians who must approve applications for minors.

**Core Value Proposition:**
- **For Municipalities:** Streamlined administration, legally compliant lottery system, full auditability, and reduced manual workload
- **For Youth:** Engaging job search, AI-powered CV/cover letter tools, fair lottery participation, and career development resources
- **For Guardians:** Simple approval workflows with secure identity verification (BankID)
- **For Companies:** Access to a qualified pool of young workers with integrated payment processing

**MVP Goal:** Deliver a fully functional multi-tenant platform with user registration, lottery-based job allocation, guardian verification, and comprehensive admin panels for all stakeholder roles.

**One-Sentence Spec:** "The selection engine runs an auditable, reproducible lottery: applicants are first filtered by eligibility, then assigned via a weighted random priority mechanism that honors job requirements, applicant preferences, and municipality-defined equity rules, producing assignments and ranked reserves with full reporting."

---

## 2. Mission

**Mission Statement:** Democratize youth summer employment in Sweden by providing a fair, transparent, and engaging platform that connects young job seekers with meaningful work opportunities while ensuring legal compliance and administrative efficiency for municipalities and employers.

### Core Principles

1. **Fairness Through Transparency** — Every allocation decision is auditable, reproducible, and explainable to participants
2. **Youth-First Design** — The application experience must be engaging, accessible, and mobile-friendly for the target demographic
3. **Legal Compliance** — All features respect Swedish discrimination law, GDPR, and protected identity requirements
4. **Operational Excellence** — Reduce administrative burden for municipalities while improving outcomes
5. **Inclusivity** — Support multiple languages, accessibility needs, and protected identity workflows
6. **Security by Design** — BankID integration, file quarantine, and proper data handling from day one

---

## 3. Target Users

### 3.1 Youth Members (Primary)
- **Who:** Swedish residents aged 15-18 (primarily), seeking summer employment
- **Goals:**
  - Find and apply for summer jobs in their municipality
  - Build a CV and cover letter with minimal friction
  - Track application status and lottery outcomes
  - Develop employability skills through educational content
- **Pain Points:**
  - Complex application processes that discourage participation
  - Lack of transparency in job allocation decisions
  - Difficulty creating professional application materials
  - Uncertainty about guardian approval requirements

### 3.2 Guardians
- **Who:** Parents or legal guardians of youth members
- **Goals:**
  - Easily verify identity and approve job applications
  - Monitor their children's job search activities
  - Receive timely notifications about application status
- **Pain Points:**
  - Complex verification processes
  - Managing multiple children's applications
  - Lack of visibility into the employment process

### 3.3 Municipality Administrators
- **Who:** Municipal employees managing youth employment programs
- **Goals:**
  - Efficiently manage large-scale summer job programs
  - Ensure fair and legally compliant job allocation
  - Generate reports for stakeholders and auditors
  - Configure lottery rules and eligibility criteria
- **Pain Points:**
  - Manual, error-prone allocation processes
  - Difficulty proving fairness when questioned
  - Managing complex eligibility rules across departments

### 3.4 Workspace Administrators
- **Who:** Staff at municipal facilities (parks, libraries, schools) or departments
- **Goals:**
  - Post available positions within their workspace
  - Manage applicants assigned to their jobs
  - Communicate with assigned youth workers
- **Pain Points:**
  - Limited control over hiring process
  - Difficulty matching skills to positions

### 3.5 Company Administrators
- **Who:** Private employers seeking young workers
- **Goals:**
  - Access a pool of motivated young workers
  - Post job listings and manage applications
  - Use traditional hiring (not lottery) process
- **Pain Points:**
  - Lack of exposure to youth job seekers
  - Administrative overhead of youth employment

### 3.6 Super Administrators
- **Who:** Platform operators (Feriearbete.se team)
- **Goals:**
  - Manage multi-tenant platform operations
  - Configure global settings, skills, tags, and content
  - Monitor platform health and usage
  - Manage CMS, SEO, and marketing content
- **Pain Points:**
  - Scaling support across multiple municipalities
  - Content management for multiple languages

---

## 4. Feature Overview

### 4.1 Core Platform Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Lottery Engine** | Stratified weighted lottery for fair job allocation | P0 |
| **Multi-Role Admin Panel** | Role-specific dashboards for all admin types | P0 |
| **Job Portal** | Search, filter, and apply to jobs | P0 |
| **User Registration** | Multi-step, engaging registration for youth | P0 |
| **Guardian Verification** | BankID and manual verification workflows | P0 |
| **CV/Cover Letter Maker** | AI-assisted document creation | P1 |
| **Messaging System** | Internal communication between admins and users | P1 |
| **Multi-Language Support** | Swedish, English, Arabic, Ukrainian | P1 |
| **Educational Platform** | Courses and learning materials | P2 |
| **CMS & SEO Tools** | Content management and SEO optimization | P2 |
| **Payment System** | Stripe integration for companies | P2 |
| **Analytics Dashboard** | Platform-wide and role-specific analytics | P2 |

---

## 5. Detailed Feature Specifications

### 5.1 The Lottery Engine

The lottery engine is the core differentiator of Feriearbete.se. It implements a **stratified weighted lottery** that balances fairness with municipal policy goals.

#### 5.1.1 Core Design Goals

- **True randomness, but reproducible** — Same inputs + same seed = same result
- **Separation of concerns:**
  - Eligibility (who can be included)
  - Prioritization (who gets higher chance)
  - Assignment (who gets which job)
- **Auditability** — Every run produces a report the municipality can publish internally if questioned
- **Guardrails** — Against illegal/unsafe configs (especially around protected attributes)

#### 5.1.2 Engine Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOTTERY ENGINE PIPELINE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │   Step A     │    │   Step B     │    │     Step C       │   │
│  │  Eligibility │───►│   Lottery    │───►│   Assignment     │   │
│  │   Filter     │    │   Weights    │    │   (RSD Method)   │   │
│  │ (Hard Rules) │    │ (Soft Rules) │    │                  │   │
│  └──────────────┘    └──────────────┘    └──────────────────┘   │
│         │                   │                     │              │
│         ▼                   ▼                     ▼              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  Eligible    │    │   Weighted   │    │   Assigned +     │   │
│  │  Applicants  │    │   Tickets    │    │   Reserve Lists  │   │
│  └──────────────┘    └──────────────┘    └──────────────────┘   │
│                                                                  │
│                              │                                   │
│                              ▼                                   │
│                    ┌──────────────────┐                         │
│                    │   Step D         │                         │
│                    │   Reserves &     │                         │
│                    │   Second Round   │                         │
│                    └──────────────────┘                         │
│                              │                                   │
│                              ▼                                   │
│                    ┌──────────────────┐                         │
│                    │   Audit Report   │                         │
│                    │   (PDF/JSON)     │                         │
│                    └──────────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.1.3 Step A: Eligibility Filter (Hard Rules)

Hard rules exclude applicants entirely. They are binary (pass/fail) and should not "weigh" applicants.

| Rule Type | Description | Configuration |
|-----------|-------------|---------------|
| Age Range | Minimum and maximum age for period/group | Per period |
| Grade Range | School grade requirements (e.g., grades 8-9) | Per period |
| Municipality Residency | Must live in/attend school in municipality | Per municipality |
| Required Skills/Certifications | Must-have qualifications for specific jobs | Per job |
| Availability Overlap | Must be available for majority (≥50%) of period | Per period |
| Custom Field Match | Municipality-defined criteria (single values, not free text) | Per municipality |

**Output:** `EligibleApplicants[]`

#### 5.1.4 Step B: Lottery Weights (Soft Rules)

Soft rules adjust probability without excluding. Uses a "ticket" system for transparency.

Each eligible applicant gets a base weight = 1.0, then optional multipliers/bonuses.

| Weight Factor | Default Tickets | Configurable | Notes |
|---------------|-----------------|--------------|-------|
| Base (everyone) | 10 | No | Ensures minimum chance |
| Target Age Group | +3 | Yes | Priority cohorts |
| Target Grade Group | +2 | Yes | Priority cohorts |
| Required Skill Match | +1 to +5 | Yes, per job | Job-specific boost |
| Preferred Skill Match | +1 to +5 | Yes, per job | "Nice-to-have" skills |
| "Didn't get job last period" | +5 | Yes | Equity booster |
| "Already got job this year" | Cap or reduce | Yes | Prevent monopolization |
| Custom Field Match | Configurable | Yes | E.g., gymnasieprogram match |

**Important:** This is still random—you're just changing the probability.

**Gender Weighting:**
- **Default:** OFF (gender-blind lottery)
- **If enabled:**
  - Requires legal basis acknowledgement ("legal basis / internal policy reference" field)
  - Soft weighting only (not strict 60/40 quotas)
  - Warning banner displayed in UI
  - Logged in audit report
  - Platform is not giving legal advice—building a safer product

**Output:** `WeightedApplicants[]` with ticket counts

#### 5.1.5 Step C: Assignment (Random Serial Dictatorship - RSD)

The recommended algorithm for fair, explainable allocation:

```
Algorithm: Weighted Random Serial Dictatorship (RSD)

1. Generate weighted random order:
   - For each applicant: random_number / ticket_count
   - Sort ascending (higher tickets = earlier expected position)
   - Alternative: use exponential race method

2. Process in order:
   FOR each applicant in weighted_order:
     FOR each job in applicant.ranked_preferences:
       IF job.has_capacity AND applicant.meets_requirements:
         ASSIGN applicant to job
         BREAK
     IF not assigned AND applicant.accepts_any_job:
       ASSIGN to any remaining eligible job
     ELSE:
       ADD to reserve_list (ranked by weighted position)

3. Generate reserve lists:
   - Per-job reserve list
   - Group-level reserve list
```

This is easy to explain to politicians, admins, and parents: "Everyone gets a lottery position. When it's your turn, we try to give you your highest choice that still has spots."

#### 5.1.6 Step D: Reserves and Second Round

- Produce `Assigned` and `ReserveRanked` lists
- If someone declines, offer next eligible reserve for that job
- Or re-run only among reserves, depending on policy

#### 5.1.7 Application Modes

Municipalities can configure per-group:

| Mode | Description | Use Case |
|------|-------------|----------|
| **Mode A: Rank Top N** | Youth ranks up to N jobs (default 5, max 10). Optional: "I accept any job in this group if I don't get my ranked picks" checkbox | Recommended default |
| **Mode B: Pure Group Lottery** | Apply to group only, random job assignment (still respects eligibility) | Large homogeneous groups |
| **Mode C: Single Job** | Apply to one specific job only, more like traditional job posting | Company jobs, specialized positions |

#### 5.1.8 Municipality Admin Settings (Per Period/Group)

**Application Settings:**
- Enable ranking: Off / On
- Max ranked jobs: 3 / 5 / 10
- Allow "accept any job in group": Yes / No
- Allow applying to multiple groups in same period: Yes / No
- Max total applications per period (anti-gaming): e.g., 1-2 groups

**Allocation Settings:**
- Assignment algorithm: "Lottery with preferences" (default)
- Preference strictness:
  - **Strict:** Only assign within ranked picks; otherwise unassigned/reserve
  - **Flexible:** Try ranked picks first, then "any job" if youth opted in, else reserve
- Reserve handling: per job reserve list + group reserve list

**Multiple Groups Policy:**
- Best practice: Allow multiple group applications but enforce one win per period (unless seats remain)
- Engine rule: once assigned in one group, remove from other group lotteries (or keep as reserve only)

#### 5.1.9 Period & Group Rules

**Majority Inside Period Rule:**
- For each job, compute overlap hours with each period
- Assign job to the period where overlap is max, but only if overlap ≥ 50%
- If no period passes threshold, job must be manually assigned
- This avoids edge cases and makes it explainable

#### 5.1.10 Simulation Preview (Killer Feature)

Before committing to a lottery run, admins can run 1,000 simulated lotteries to preview:
- Expected distribution by age/grade/gender
- Number of "repeat winners" predicted
- Probability of getting any job per applicant cohort
- Impact of different weight configurations

This helps admins set weights responsibly instead of guessing.

#### 5.1.11 Audit Report

Auto-generated comprehensive report (PDF/JSON) containing:
- Period, group, jobs included, capacities
- Application counts and eligibility breakdown
- Eligibility rules used
- Weight formula in human-readable form
- Random seed, timestamp, engine version
- Complete outcome lists and reserve lists
- Distribution summary statistics
- Compliance flags and warnings

This is exactly what municipalities need when questions come.

#### 5.1.12 Guardrails

**1) Protected Attributes (Gender)**

Swedish discrimination rules are strict. There is some allowance for "positiv särbehandling" in hiring, but only under specific conditions.

| Guardrail | Implementation |
|-----------|----------------|
| Default | Gender-blind lottery |
| If enabled | Off by default |
| Requirements | Legal basis / internal policy reference field + admin acknowledgement |
| Method | Soft weighting only, not strict quotas |
| Visibility | Warning banner shown, logged in audit report |

**2) Custom Fields**

Custom fields are powerful but risky. Add "field type + allowed use" concept:

| Field Type | Examples | Allowed |
|------------|----------|---------|
| Operational | Availability, distance, driver's license | ✅ OK |
| Sensitive | Health, ethnicity, religion | ❌ Blocked or heavily restricted |

**3) Anti-Gaming Controls**

- Applicants shouldn't see exact weighting details ("+5 tickets if X"), only high-level policy text
- Lock the configuration when applications close
- Prevent configuration changes mid-lottery

#### 5.1.13 Admin Experience - Policy Builder Wizard

1. Select group + jobs included
2. Define eligibility rules (hard filters)
3. Define prioritization rules (soft weights)
4. Select assignment method (RSD default)
5. Configure reserve policy
6. Preview + run simulation
7. Execute lottery

---

### 5.2 User Roles & Permissions

#### 5.2.1 Role Hierarchy

```
┌────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN                              │
│  (Platform-wide: all municipalities, global settings)           │
└───────────────────────────┬────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  MUNICIPALITY │   │  MUNICIPALITY │   │    COMPANY    │
│     ADMIN     │   │     ADMIN     │   │     ADMIN     │
│ (Org-scoped)  │   │ (Org-scoped)  │   │ (Org-scoped)  │
└───────┬───────┘   └───────┬───────┘   └───────────────┘
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│   WORKSPACE   │   │   WORKSPACE   │
│     ADMIN     │   │     ADMIN     │
│(Workspace-    │   │(Workspace-    │
│  scoped)      │   │  scoped)      │
└───────────────┘   └───────────────┘
```

#### 5.2.2 Super Admin Capabilities

Super admins are the global admins that control the platform. They can:

- CRUD all other roles
- CRUD all municipalities
- CRUD all workplaces
- CRUD all companies
- Manage all job posts
- CRUD list of skills (used for CV maker, job postings, lottery weighting)
- CRUD list of TAGS (for tagging jobs, improving search results)
- CRUD Interests (youth users can use for profile)
- Manage the start page (multi-language)
- Manage the contact page (multi-language, testimonials, promo blocks)
- Manage CMS feature
- Manage SEO content (with built-in AI)

#### 5.2.3 Municipality Admin Capabilities

Municipality admins manage everything within their municipality organization:

- CRUD municipality admins for same organization
- CRUD workspace admins for workspaces within municipality
- CRUD periods for lottery feature
- CRUD jobs and assign them to workplaces
- CRUD workplaces
- CRUD users (youth members and guardians) assigned to municipality
- CRUD custom fields (for lottery engine, e.g., school attendance)
- CRUD regions (sets of municipalities listed within same region)
- Send messages to users within their municipality

#### 5.2.4 Workspace Admin Capabilities

Workspace admins manage local workspaces (faculty, department, facility):

- CRUD workspace admins within same workspace
- CRUD "lottery" jobs and assign to periods/groups (created by municipality admin)
- CRUD "normal" jobs (not in lottery system)
- Manage users who got spots at lottery jobs (view, remove from job - not delete)
- Manage users who applied to normal jobs (view, assign, remove from application)
- Send messages to users within their workspace (applied to their jobs)

#### 5.2.5 Company Admin Capabilities

Company admins manage their company (separate entity from municipality):

- CRUD company admins within same company
- CRUD normal job posts (cannot use lottery engine)
- Manage users who apply to their jobs (view, assign, remove from application)
- Send messages to users who applied to company jobs

#### 5.2.6 Youth Member Capabilities

Youth members apply for jobs on the platform:

- CRUD their own profile
- Add guardians to connect with
- Apply to municipality jobs, workspace direct jobs, and company jobs
- Build CV and cover letter
- View application status and lottery results

#### 5.2.7 Guardian Capabilities

Guardians are linked to youth members:

- Approve job applications from youth members (if required)
- View list of connected youth members
- See what jobs each youth member has applied for
- Verify identity via BankID or document upload

#### 5.2.8 Permission Matrix

| Action | Super Admin | Municipality Admin | Workspace Admin | Company Admin | Youth | Guardian |
|--------|-------------|-------------------|-----------------|---------------|-------|----------|
| CRUD Municipalities | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| CRUD Skills/Tags/Interests | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage CMS/SEO | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| CRUD Workplaces (own muni) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD Periods/Groups | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Configure Lottery Rules | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD Lottery Jobs | ✅ | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| CRUD Normal Jobs | ✅ | ✅ | ✅ (own) | ✅ (own) | ❌ | ❌ |
| Run Lottery | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Applicants | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ❌ | ❌ |
| Send Messages | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | Reply | Reply |
| CRUD Custom Fields | ✅ | ✅ (own) | ❌ | ❌ | ❌ | ❌ |
| Apply to Jobs | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Approve Applications | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

### 5.3 Registration & Authentication

#### 5.3.1 Youth Registration Flow

The registration needs to be **very fun and engaging** so that youth members want to join.

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUTH REGISTRATION FLOW                       │
│                   (Engaging, Step-by-Step)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Account Basics          Step 2: Personal Info          │
│  ┌────────────────────┐          ┌────────────────────┐         │
│  │ • Email (required) │          │ • First/Last Name  │         │
│  │ • Password         │          │   (mandatory)      │         │
│  │ • Email verify     │          │ • Phone Number     │         │
│  └────────────────────┘          │   (mandatory, int) │         │
│           │                      │ • Date of Birth    │         │
│           ▼                      │   (mandatory)      │         │
│                                  │ • Gender           │         │
│                                  │   (mandatory)      │         │
│                                  │ • Identifying      │         │
│                                  │   Gender (optional)│         │
│                                  └────────────────────┘         │
│                                           │                     │
│                                           ▼                     │
│  Step 3: Location & Education    Step 4: Municipality Fields    │
│  ┌────────────────────┐          ┌────────────────────┐         │
│  │ • Municipality     │          │ • School           │         │
│  │   (mandatory)      │          │ • District         │         │
│  │ • Grade            │          │ • Gymnasieprogram  │         │
│  │   (mandatory)      │          │ • Driver's License │         │
│  │                    │          │ • (Custom fields)  │         │
│  └────────────────────┘          └────────────────────┘         │
│           │                               │                     │
│           ▼                               ▼                     │
│  Step 5: Complete!                                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ • Profile created                                       │    │
│  │ • Ready to apply                                        │    │
│  │ • Add guardian (if needed for job requirements)         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Required Fields:**
- Email address (mandatory)
- Password (mandatory)
- First and last name (mandatory)
- Phone number (mandatory, integer)
- Municipality (mandatory)
- Gender (mandatory)
- Identifying gender (optional)
- Date of birth (mandatory)
- Grade (mandatory)
- Custom fields (as defined by selected municipality)

**Improvement:** Let the youth apply immediately so they don't miss the deadline. The application enters the lottery pool but can only be finalized/assigned once the guardian verifies.

#### 5.3.2 Guardian Registration & Verification

**Adding a Guardian:**

If a job requires guardian approval, the youth member must add a guardian to their account:

1. Youth adds guardian email from profile
2. System sends magic link (email link) to guardian
3. Guardian clicks link and registers:
   - First and last name
   - Date of birth
   - Phone number
   - Email address
   - Set password

**Verification Methods:**

| Method | Process | Auto-Approved? |
|--------|---------|----------------|
| BankID | Authenticate via GrandID (Svensk e-identitet) | Yes - automatically verified |
| Document Upload | Upload ID card/driving license | No - manual approval needed by municipality admin |
| Protected Identity | Reference code + in-person verification | Manual + No PII stored |

**BankID Verification Fields (Auto-Populated):**
- First and last name
- Date of birth

**Protected Identity (Skyddad Identitet) Workflow:**

Handling Skyddad Identitet requires moving verification of the person off the cloud, while keeping verification of the application on the cloud.

**The "Ghost Protocol" Workflow:**

1. **The Trigger:** During application, youth toggles: "Jag har skyddad identitet / Kan ej använda BankID"
2. **The Lock:** System skips Guardian BankID step. Application enters `Pending_Manual_Verification` status
3. **The Key:** System generates random, non-sequential Application ID (e.g., #X9-B22). Youth instructed to contact municipality coordinator (phone or physical visit) with this code
4. **The Override:**
   - Admin logs into Admin Panel
   - Searches for #X9-B22
   - Sees blank placeholder for Guardian
   - Clicks "Manually Verify Guardian"
   - **Crucially:** Admin manually checks papers/ID in real world. System never records guardian's real name or youth's secret address. Only records timestamp and Admin ID who clicked the button

**Why this works:** Fulfills legal requirement of guardian consent without ever storing sensitive data that would endanger the youth if database were leaked.

**Guardian-Youth Relationships:**
- One guardian can be guardian to many youth members
- One youth member can have several guardians (any verified guardian can approve)
- Guardians see list of connected youth members and their job applications

#### 5.3.3 Authentication Features

| Feature | Description |
|---------|-------------|
| 2-Step Verification | Email code required for login |
| 30-Day Device Remember | Optional "remember this device" checkbox |
| Forgot Password | Email-based password reset flow |
| Login | Email + password authentication |

---

### 5.4 Job Portal

#### 5.4.1 Job Types

**Lottery Jobs:**
- Use periods, groups, and the lottery engine
- Created by municipality and workspace admins
- Fair allocation through weighted lottery

**Normal Jobs:**
- Traditional job postings without lottery
- Created by municipality, workspace, and company admins
- Standard application process (view, assign, remove)

#### 5.4.2 Job Listing Display

**Hierarchy Display for Lottery Jobs:**
```
┌─────────────────────────────────────────────────────────────────┐
│                        JOB SEARCH PAGE                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PERIODS (Lottery Jobs) - Show first at top              │    │
│  │ ┌─────────────────────┐  ┌─────────────────────┐        │    │
│  │ │ Summer 2025         │  │ Easter Break 2025   │        │    │
│  │ │ Jun 15 - Aug 15     │  │ Apr 10 - Apr 18     │        │    │
│  │ │ 156 jobs available  │  │ 24 jobs available   │        │    │
│  │ │ Deadline: May 1     │  │ Deadline: Mar 15    │        │    │
│  │ │ [View Groups →]     │  │ [View Groups →]     │        │    │
│  │ └─────────────────────┘  └─────────────────────┘        │    │
│  │                                                          │    │
│  │ Drill down: Period → Groups → Jobs in group              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ NORMAL JOBS (Direct Application) - Listed below         │    │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │    │
│  │ │ Park Worker │ │ Café Staff  │ │ Lifeguard   │         │    │
│  │ │ Gothenburg  │ │ ICA Maxi    │ │ Simhallen   │         │    │
│  │ │ [Apply →]   │ │ [Apply →]   │ │ [Apply →]   │         │    │
│  │ └─────────────┘ └─────────────┘ └─────────────┘         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Display options: Cards view | List view                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Design Rationale:** Show periods first with "selling" information, then drill down to groups, then see all jobs in that group. Better than showing all jobs without knowing what group or period they belong to.

#### 5.4.3 Eligibility-Based Display

**Only show jobs for users that are eligible:**
- Age within specified range
- Grade within specified range
- Municipality match (if required)
- Required skills/certifications (if any)

Jobs not matching user's profile are hidden from their view.

#### 5.4.4 Job Visibility Rules (Who Can Apply)

Admins set who can apply based on location:

| Scope | Who Can See/Apply |
|-------|-------------------|
| Same Municipality Only | Users registered in that municipality |
| Municipality + Neighbors | Users from selected neighboring municipalities (admin lists which) |
| Same Region | Users from any municipality in the region (admin creates regions) |
| System-Wide | All registered users (all of Sweden) |

#### 5.4.5 Search & Filter Features

Smart, appealing search engine with great filters:

| Filter | Options |
|--------|---------|
| Location | Municipality, district, radius |
| Job Type | Lottery, Normal |
| Period | Available periods |
| Category | Tags assigned by admins |
| Skills Match | Based on profile skills |
| Availability | Date range overlap |

#### 5.4.6 Match Feature

AI-powered job matching based on:
- User interests and skills
- Previous experience
- Profile completion
- Location preferences

**Notification Feature:** Users can ask the system to match jobs and send notifications when a matching job is available.

#### 5.4.7 Favorite Jobs

Users can like/favorite jobs and add them to a list for easy access later.

#### 5.4.8 Local GEO Detection

- Platform detects municipality before user is logged in
- Populate DB with all Swedish municipalities
- Add GEO location detection for municipality
- Manual municipality selection also available

---

### 5.5 Youth Application Process

#### 5.5.1 Eligibility & Onboarding

1. Youth creates profile (DOB, grade, municipality, contact info, optional skills/certificates, gender, email, phone)
2. System shows which periods and groups they're eligible for

#### 5.5.2 Choose Group(s) to Apply To

For each group (e.g., "Outdoor jobs"):
- Youth clicks "Apply to this group"

#### 5.5.3 Job Selection (Based on Municipality Mode)

**Mode A - Rank Top N Jobs (Recommended):**
- Youth picks up to 10 jobs (default 5) and ranks them 1-N
- Optional checkbox: "I accept any job in this group if I don't get my ranked picks"

**Mode B - No Ranking (Pure Group Lottery):**
- Youth applies to the group only
- Allocation is random among all jobs (still respects eligibility)

**Mode C - Single-Job Application:**
- Youth applies to one job only
- More like traditional job posting
- Useful for company/workspace direct jobs

#### 5.5.4 Availability & Constraints

Even for feriejobb, capture:
- Availability dates/weeks (simple checkboxes)
- "Can work weekends/evenings" (if relevant)
- Optional travel radius/preferred locations (if municipality uses it)

These are mostly hard filters to avoid placing someone into an impossible slot.

#### 5.5.5 Confirmation

Show:
- Group applied to
- Ranked list (if enabled)
- Deadline and next steps
- Clear text: "Placement is done by lottery according to municipality rules."

---

### 5.6 CV & Cover Letter Maker

#### 5.6.1 Design Philosophy

- Smart and very easy - doesn't require youth to write much
- Better to select and click things to add
- AI-powered assistance
- Clean and easy to use

#### 5.6.2 AI-Powered CV Builder

AI "interviews" the youth member with questions they can answer, mostly by click and select, avoiding text questions as much as possible.

```
┌─────────────────────────────────────────────────────────────────┐
│                     CV BUILDER INTERVIEW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Q1: "What skills do you have?" [Multi-select from list]        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ☑ Communication    ☑ Teamwork    ☐ Leadership          │    │
│  │ ☑ Problem Solving  ☐ Customer Service  ☐ Computer      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Q2: "Any hobbies or activities?" [Multi-select + optional text]│
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ☑ Sports          ☑ Music       ☐ Art/Crafts           │    │
│  │ ☐ Gaming          ☑ Volunteering ☐ Other: _________    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Q3: "Select your achievements" [Radio/Select]                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ○ School representative  ○ Team captain                 │    │
│  │ ○ Competition winner     ○ Volunteer leader             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [Generate CV →]                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

When interview is done, CV is generated. When a job is granted, it automatically adds to the CV.

#### 5.6.3 Cover Letter Builder

Same AI-assisted approach with focus on:
- Characteristics questions (things employers want to know)
- Personality and charisma questions
- Motivation for working
- Availability and flexibility

When interview is over, AI writes a cover letter.

#### 5.6.4 Document Features

| Feature | Description |
|---------|-------------|
| Edit | Nice editor for manual adjustments to CV and cover letter |
| Download | Export as PDF format |
| Use in Applications | Attach to job applications |
| Auto-Update | New jobs automatically added to CV |
| References | Add reference contacts that can be assigned to applications |

#### 5.6.5 Skills & Interests

In profile, user can add:
- Skills (selected from pre-created ones by super admin)
- Interests (selected from pre-created ones by super admin)

Used for recommendations and matching to jobs.

---

### 5.7 Messaging System

#### 5.7.1 Message Types

| Type | Sender | Recipients | Replies Allowed |
|------|--------|------------|-----------------|
| Bulk - All Applicants | Admin | All who applied | Configurable by admin |
| Bulk - Assigned | Admin | Users who got jobs (lottery and normal) | Configurable |
| Bulk - Not Assigned | Admin | Users who didn't get jobs | Configurable |
| Bulk - Waitlist | Admin | Users on reserve/waiting list | Configurable |
| Direct | Admin | Individual user | Default Yes (admin can disable) |

**Only direct messages allow for replies from users.** Admin can set if message allows replies or not.

#### 5.7.2 Admin Scoping

| Admin Role | Can Message |
|------------|-------------|
| Super Admin | All users |
| Municipality Admin | Users in their municipality |
| Workspace Admin | Users who applied to their workspace jobs |
| Company Admin | Users who applied to their company jobs |

---

### 5.8 Multi-Language Support

#### 5.8.1 Supported Languages

| Language | Code | Priority |
|----------|------|----------|
| Swedish | sv | Primary |
| English | en | Secondary |
| Arabic | ar | Secondary |
| Ukrainian | uk | Secondary |

More languages will be added later.

#### 5.8.2 Translatable Content

Every string should be translatable:
- All UI strings
- Email templates
- CMS pages
- Start page sections
- Contact page
- Job descriptions
- Notification messages

---

### 5.9 Admin Panels (Separate from Django Built-in Admin)

#### 5.9.1 Super Admin Features

| Section | Features |
|---------|----------|
| Municipalities | CRUD all municipalities |
| Users | CRUD all user types |
| Skills | Global skill list for CV/job matching/lottery weighting |
| Tags | Job categorization tags for search |
| Interests | Profile interests for matching |
| Start Page | Hero, promo slider, testimonials, customer logos, CTA (multi-language) |
| Contact Page | Contact info, testimonials, promo blocks, SEO (multi-language) |
| CMS | Page builder, blog posts, templates, SEO pages |
| Plans | Stripe plan builder for companies |
| Analytics | Platform-wide metrics |
| SEO | AI-powered SEO content management |

#### 5.9.2 Municipality Admin Features

| Section | Features |
|---------|----------|
| Admins | CRUD municipality and workspace admins |
| Workplaces | CRUD workspaces |
| Periods | Create lottery periods with groups |
| Jobs | CRUD jobs, assign to workplaces |
| Custom Fields | Define municipality-specific fields (for lottery engine) |
| Regions | Define regional municipality groups |
| Users | CRUD youth members and guardians |
| Lottery | Configure rules, run simulation, execute lottery, view results |
| Messages | Send bulk and direct messages |
| Analytics | Municipality-specific metrics |

#### 5.9.3 Workspace Admin Features

| Section | Features |
|---------|----------|
| Admins | CRUD workspace admins |
| Lottery Jobs | CRUD jobs for periods/groups |
| Normal Jobs | CRUD traditional job postings |
| Applicants | View/manage assigned and applicant lists |
| Messages | Communicate with workspace applicants |

#### 5.9.4 Company Admin Features

| Section | Features |
|---------|----------|
| Admins | CRUD company admins |
| Profile | Company public profile |
| Jobs | CRUD normal job postings (no lottery) |
| Applicants | View, assign, remove applicants |
| Messages | Communicate with job applicants |
| Billing | Manage Stripe subscription/credits |

---

### 5.10 Company & Organization Profiles

Both municipalities, workspaces, and companies should have public profiles:
- Organization description
- Logo and branding
- Contact information
- All jobs from that vendor listed (or at least latest 3)
- Link to full job list

---

### 5.11 Payment System (Companies Only)

**Improvement:** Stripe implementation strictly for private companies purchasing job slots. Municipalities need "Enterprise/Invoice" tier that bypasses Stripe and grants access based on contract duration.

#### 5.11.1 Stripe Integration

| Feature | Description |
|---------|-------------|
| Credit Purchase | Buy job posting credits |
| Subscription | Monthly/annual unlimited posting plans |
| Invoice (Municipalities) | Enterprise tier bypassing Stripe |

#### 5.11.2 Plan Builder

Super admin can configure:
- Credit packages (e.g., 5 jobs for X SEK)
- Subscription tiers (e.g., Basic, Pro, Enterprise)
- Feature limits per tier
- Contract durations for municipalities

---

### 5.12 Educational Platform

Learning center where super admin can build courses for users.

#### 5.12.1 Course Structure

```
Course (targeted to specific roles or all roles)
├── Chapter 1
│   ├── Lecture 1.1 (Video - YouTube)
│   ├── Lecture 1.2 (Text-based)
│   └── Quiz 1
├── Chapter 2
│   ├── Lecture 2.1 (Video)
│   └── Lecture 2.2 (Text)
└── Certificate
```

#### 5.12.2 Course Features

- Informational about the platform
- Helping youth members better apply for jobs
- Targeted to specific roles (or selected roles or all roles)
- Look, feel, and function similar to LinkedIn Learning

---

### 5.13 CMS & SEO

#### 5.13.1 Page Builder

| Feature | Description |
|---------|-------------|
| Templates | Pre-designed page layouts for pages and blog posts |
| Draft/Publish | Workflow states |
| SEO Fields | Title, description, keywords, OG tags |
| SEO Score | Real-time SEO quality measurement tool |
| Multi-language | Per-language versions |
| Menu Assignment | Navigation, footer, or no menu |

#### 5.13.2 Blog

- Blog post creation with all SEO elements
- SEO measurement tool to see how well prepared it is
- Display on start page and dedicated blog section

#### 5.13.3 AI-Powered SEO Pages

Super admin can:
1. Add target keywords
2. Assign to AI to create SEO page
3. AI generates page with image and all important SEO elements
4. High ranking potential for given keyword in platform context
5. Review and publish

---

### 5.14 Start Page Management

Super admin manages start page sections (all multi-language):

| Section | Description |
|---------|-------------|
| Hero Section | Hero image or background video, title, tagline, call to action |
| Customer Section | Customer logos rolling near footer (B&W, light up on hover) |
| Promo Section Slider | Slider with images and text, nicely animated |
| Testimonials | Testimonials from customers using platform |
| Call 2 Action Box | Let users know how to register and login |
| SEO Elements | All SEO elements for better optimization |

---

### 5.15 Contact Page Management

Super admin manages contact page with:
- Contact information
- Testimonials
- Promo blocks
- All SEO elements
- Multi-language support

---

### 5.16 Analytics Platform

Role-specific analytics dashboards:

| Role | Available Metrics |
|------|-------------------|
| Super Admin | Platform-wide: users, jobs, applications, conversions |
| Municipality Admin | Local: applicants, lottery stats, job fill rates |
| Workspace Admin | Workspace: application counts, assignment success |
| Company Admin | Company: job views, application rates |

---

### 5.17 Custom Fields

#### 5.17.1 Pre-defined Municipal Fields

4 standard, non-sensitive fields that allow municipalities to organize logistics without touching GDPR "Special Categories" (health/religion). Municipalities populate each field with their own items (schools, districts may vary).

| Field | Why | Data Type |
|-------|-----|-----------|
| School | Municipalities often have quotas per school | Dropdown (populated by admin) |
| Residential District (Bostadsområde/Stadsdel) | Minimize travel costs/time - don't assign kid from North to park job on South | Dropdown (populated by admin) |
| High School Program (Gymnasieprogram) | Matching - youth studying "Vård och omsorg" higher priority for Elderly Care job | Dropdown (standard Swedish list: Teknik, Samhäll, Fordon, etc.) |
| Driver's License Status (Körkort/Mopedkort) | Operational necessity - some jobs require driving | Multi-select (AM-kort, B-kort, Traktorkort, None) |

Plus grade and age from registration fields.

#### 5.17.2 Custom Field Governance

| Field Type | Examples | Usage |
|------------|----------|-------|
| Operational | Availability, distance, driver's license | ✅ Allowed for eligibility/weights |
| Sensitive | Health, ethnicity, religion | ❌ Blocked or heavily restricted |

---

### 5.18 Geo-Location Features

#### 5.18.1 Municipality Detection

- Automatic detection before login
- Manual selection during registration
- IP-based initial suggestion

#### 5.18.2 Swedish Municipalities Database

Pre-populated database with:
- All Swedish municipalities (290)
- Geographic coordinates
- Region assignments

---

## 6. Technology Stack

### 6.1 Infrastructure (Ops)

| Component | Technology | Notes |
|-----------|------------|-------|
| Provider | Hetzner (AX Series AMD Ryzen) | Self-hosted |
| OS | Ubuntu 22.04/24.04 LTS | |
| Orchestration | Coolify | Self-hosted PaaS - all services as Docker containers |
| Proxy | Traefik | Auto-SSL via Let's Encrypt |
| Containers | Docker | All services containerized |

### 6.2 Backend Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Django | 5.2 LTS (supported until April 2028) |
| Python | Python | 3.12 |
| API Interface | Django Ninja | Latest stable |
| Database | PostgreSQL | 16 |
| Async/Queues | Celery + Redis | Mandatory for: Lottery Algorithm, Email sending, Virus Scanning |
| Auth | mozilla-django-oidc | Connecting to GrandID (Svensk e-identitet) for BankID |
| Search | Meilisearch | Dockerized |

### 6.3 Frontend Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 15.x (App Router) |
| React | React | 19.x |
| Styling | Tailwind CSS + shadcn/ui | Components |
| State/Data | TanStack Query | v5 |
| Validation | Zod | Must mirror Backend Pydantic schemas |
| Language | TypeScript | Strict mode |
| Node.js | Node.js | 20 LTS or 22 LTS |

### 6.4 File Handling & Security (The "Quarantine Protocol")

```
┌─────────────────────────────────────────────────────────────────┐
│                    FILE QUARANTINE PROTOCOL                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Upload                                                     │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────┐                                               │
│  │    MinIO     │                                               │
│  │  quarantine  │  (Private bucket)                             │
│  │    bucket    │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Celery Task  │                                               │
│  │   triggers   │                                               │
│  │   ClamAV     │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│    ┌────┴────┐                                                  │
│    │         │                                                   │
│    ▼         ▼                                                   │
│  CLEAN     DIRTY                                                │
│    │         │                                                   │
│    ▼         ▼                                                   │
│  ┌────────┐ ┌────────┐                                          │
│  │ clean- │ │ Delete │                                          │
│  │ media  │ │ + Log  │                                          │
│  │ bucket │ │        │                                          │
│  └────────┘ └────────┘                                          │
│  (public-read                                                    │
│   or presigned)                                                  │
│                                                                  │
│  Image Delivery: Imgproxy → Next.js <Image />                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Component | Technology |
|-----------|------------|
| Storage | MinIO (S3 compatible, self-hosted on Hetzner) |
| Buckets | `quarantine` (private), `clean-media` (public-read or presigned) |
| Virus Scanning | ClamAV (Dockerized) |
| Image Delivery | Imgproxy (Frontend uses Next.js `<Image />` pointed at self-hosted Imgproxy) |

### 6.5 External Services

| Service | Provider | Purpose |
|---------|----------|---------|
| Email | Postmark | Transactional API (do not use local SMTP) |
| Payments | Stripe | Only for private companies, not Municipalities |
| Identity | GrandID | Swedish BankID (Svensk e-identitet) |

---

## 7. Data Model

### 7.1 Core Entities

```
┌─────────────────────────────────────────────────────────────────┐
│                       ENTITY RELATIONSHIPS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Municipality ──────┬───────── Region                           │
│       │             │                                            │
│       │        Workspace ─────── Job                             │
│       │             │             │                              │
│       │             └─────────────┤                              │
│       │                           │                              │
│       ▼                           ▼                              │
│  Period ──── Group ──── LotteryRun ──── Assignment               │
│       │                     │                                    │
│       │                     ▼                                    │
│       │              AuditReport                                 │
│       │                                                          │
│  User ──────┬───── Guardian                                     │
│       │     │                                                    │
│       │     └───── Application ───── Job                        │
│       │                                                          │
│       └───── CV ───── CoverLetter                               │
│                                                                  │
│  Company ──────── Job                                            │
│                                                                  │
│  CustomFieldDefinition ───── CustomFieldValue                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Key Tables

#### Users
```sql
users
├── id (PK)
├── email (unique)
├── password_hash
├── role (enum: youth, guardian, muni_admin, workspace_admin, company_admin, super_admin)
├── first_name
├── last_name
├── phone (integer)
├── date_of_birth
├── gender
├── identifying_gender (nullable)
├── municipality_id (FK)
├── grade
├── is_verified
├── is_protected_identity
├── created_at
└── updated_at
```

#### Municipalities
```sql
municipalities
├── id (PK)
├── name
├── slug
├── region_id (FK, nullable)
├── geo_lat
├── geo_lng
├── settings (JSON)
├── created_at
└── updated_at
```

#### Jobs
```sql
jobs
├── id (PK)
├── title
├── description
├── requirements
├── type (enum: lottery, normal)
├── municipality_id (FK, nullable)
├── workspace_id (FK, nullable)
├── company_id (FK, nullable)
├── period_id (FK, nullable)
├── group_id (FK, nullable)
├── capacity
├── min_age
├── max_age
├── min_grade
├── max_grade
├── required_skills (JSON)
├── preferred_skills (JSON)
├── visibility_scope (enum: same_municipality, municipality_neighbors, same_region, system_wide)
├── status (enum: draft, published, closed)
├── created_at
└── updated_at
```

#### Periods & Groups
```sql
periods
├── id (PK)
├── municipality_id (FK)
├── name
├── start_date
├── end_date
├── application_deadline
├── eligibility_rules (JSON)
├── lottery_weights (JSON)
├── application_mode (enum: rank_top_n, pure_group, single_job)
├── max_ranked_jobs
├── allow_accept_any
├── allow_multiple_groups
├── max_applications_per_period
├── preference_strictness (enum: strict, flexible)
├── status (enum: draft, open, closed, completed)
├── created_at
└── updated_at

groups
├── id (PK)
├── period_id (FK)
├── name
├── description
├── created_at
└── updated_at
```

#### Applications
```sql
applications
├── id (PK)
├── user_id (FK)
├── job_id (FK, nullable for group applications)
├── group_id (FK, nullable for single job applications)
├── period_id (FK)
├── ranked_preferences (JSON, nullable)
├── accept_any_job (boolean)
├── guardian_approved (boolean)
├── guardian_id (FK, nullable)
├── status (enum: pending, pending_guardian, in_lottery, assigned, reserve, rejected, withdrawn)
├── assigned_job_id (FK, nullable)
├── reserve_position (nullable)
├── created_at
└── updated_at
```

#### Lottery Runs
```sql
lottery_runs
├── id (PK)
├── period_id (FK)
├── group_id (FK)
├── seed
├── engine_version
├── configuration_snapshot (JSON)
├── results (JSON)
├── audit_report_url
├── run_at
├── run_by_user_id (FK)
└── created_at
```

#### Guardians
```sql
guardian_youth_links
├── id (PK)
├── guardian_user_id (FK)
├── youth_user_id (FK)
├── verification_method (enum: bankid, document_upload, manual)
├── verified_at
├── verified_by_admin_id (FK, nullable)
├── created_at
└── updated_at
```

### 7.3 Custom Fields

```sql
custom_field_definitions
├── id (PK)
├── municipality_id (FK)
├── name
├── field_type (enum: dropdown, multi_select, text, number)
├── options (JSON, for dropdown/multi_select)
├── is_required
├── is_sensitive (boolean, affects lottery eligibility)
├── use_in_eligibility (boolean)
├── use_in_weights (boolean)
├── display_order
├── created_at
└── updated_at

custom_field_values
├── id (PK)
├── user_id (FK)
├── field_definition_id (FK)
├── value (JSON)
├── created_at
└── updated_at
```

---

## 8. API Design

### 8.1 API Structure

Base URL: `/api/v1`

Using Django Ninja for type-safe, fast REST APIs with Pydantic schemas.

### 8.2 Authentication Endpoints

```
POST   /api/v1/auth/register          # Youth registration
POST   /api/v1/auth/login             # Login with email/password
POST   /api/v1/auth/verify-email      # Email verification
POST   /api/v1/auth/forgot-password   # Password reset request
POST   /api/v1/auth/reset-password    # Password reset
POST   /api/v1/auth/2fa/send          # Send 2FA code
POST   /api/v1/auth/2fa/verify        # 2FA code verification
POST   /api/v1/auth/bankid/init       # Initialize BankID auth
POST   /api/v1/auth/bankid/complete   # Complete BankID auth
```

### 8.3 User Endpoints

```
GET    /api/v1/users/me               # Current user profile
PUT    /api/v1/users/me               # Update profile
GET    /api/v1/users/me/applications  # User's applications
GET    /api/v1/users/me/cv            # User's CV
PUT    /api/v1/users/me/cv            # Update CV
GET    /api/v1/users/me/cover-letter  # User's cover letter
PUT    /api/v1/users/me/cover-letter  # Update cover letter
GET    /api/v1/users/me/skills        # User's skills
PUT    /api/v1/users/me/skills        # Update skills
GET    /api/v1/users/me/interests     # User's interests
PUT    /api/v1/users/me/interests     # Update interests
GET    /api/v1/users/me/favorites     # User's favorite jobs
POST   /api/v1/users/me/favorites     # Add favorite job
DELETE /api/v1/users/me/favorites/{id}# Remove favorite job

# Guardian management
POST   /api/v1/users/me/guardians     # Add guardian (send magic link)
GET    /api/v1/users/me/guardians     # List guardians
DELETE /api/v1/users/me/guardians/{id}# Remove guardian
```

### 8.4 Job Endpoints

```
GET    /api/v1/jobs                   # List jobs (filtered by eligibility)
GET    /api/v1/jobs/{id}              # Job details
GET    /api/v1/jobs/search            # Search jobs with filters
GET    /api/v1/jobs/match             # AI-matched jobs for user

# Periods & Groups
GET    /api/v1/periods                # List available periods
GET    /api/v1/periods/{id}           # Period details
GET    /api/v1/periods/{id}/groups    # Groups in period
GET    /api/v1/groups/{id}            # Group details
GET    /api/v1/groups/{id}/jobs       # Jobs in group

# Applications
POST   /api/v1/applications           # Create application
GET    /api/v1/applications/{id}      # Application status
PUT    /api/v1/applications/{id}      # Update application (rankings)
DELETE /api/v1/applications/{id}      # Withdraw application
```

### 8.5 Guardian Endpoints

```
GET    /api/v1/guardian/youth         # List connected youth members
GET    /api/v1/guardian/applications  # All pending applications for approval
POST   /api/v1/guardian/applications/{id}/approve  # Approve application
POST   /api/v1/guardian/verify/bankid # Verify via BankID
POST   /api/v1/guardian/verify/document # Upload document for verification
```

### 8.6 Admin Endpoints

```
# Municipality Admin
GET    /api/v1/admin/municipalities/{id}/users
POST   /api/v1/admin/municipalities/{id}/users
GET    /api/v1/admin/municipalities/{id}/jobs
POST   /api/v1/admin/municipalities/{id}/jobs
GET    /api/v1/admin/municipalities/{id}/workspaces
POST   /api/v1/admin/municipalities/{id}/workspaces
GET    /api/v1/admin/municipalities/{id}/custom-fields
POST   /api/v1/admin/municipalities/{id}/custom-fields

# Periods & Lottery
POST   /api/v1/admin/periods
PUT    /api/v1/admin/periods/{id}
POST   /api/v1/admin/periods/{id}/groups
GET    /api/v1/admin/periods/{id}/lottery/preview  # Simulation preview (1000 runs)
POST   /api/v1/admin/periods/{id}/lottery/run      # Execute lottery
GET    /api/v1/admin/periods/{id}/lottery/results  # Lottery results
GET    /api/v1/admin/periods/{id}/audit-report     # Download audit report (PDF/JSON)

# Workspace Admin
GET    /api/v1/admin/workspaces/{id}/jobs
POST   /api/v1/admin/workspaces/{id}/jobs
GET    /api/v1/admin/workspaces/{id}/applicants
PUT    /api/v1/admin/workspaces/{id}/applicants/{id}/assign
DELETE /api/v1/admin/workspaces/{id}/applicants/{id}/remove

# Company Admin
GET    /api/v1/admin/companies/{id}/jobs
POST   /api/v1/admin/companies/{id}/jobs
GET    /api/v1/admin/companies/{id}/applicants
PUT    /api/v1/admin/companies/{id}/applicants/{id}/assign

# Super Admin
GET    /api/v1/admin/municipalities
POST   /api/v1/admin/municipalities
GET    /api/v1/admin/skills
POST   /api/v1/admin/skills
GET    /api/v1/admin/tags
POST   /api/v1/admin/tags
GET    /api/v1/admin/interests
POST   /api/v1/admin/interests
# ... CMS, SEO, etc.
```

### 8.7 Messaging Endpoints

```
GET    /api/v1/messages               # User's messages
GET    /api/v1/messages/{id}          # Message detail
POST   /api/v1/messages/{id}/reply    # Reply to message (if allowed)

# Admin
POST   /api/v1/admin/messages/bulk    # Send bulk message
POST   /api/v1/admin/messages/direct  # Send direct message
```

---

## 9. Security Considerations

### 9.1 Authentication & Authorization

| Measure | Implementation |
|---------|----------------|
| Password Hashing | Argon2id |
| Session Management | JWT with refresh tokens |
| 2FA | Email-based OTP |
| BankID | GrandID integration via OIDC |
| RBAC | Django permission system |
| Device Remember | 30-day secure cookie |

### 9.2 Data Protection

| Measure | Implementation |
|---------|----------------|
| Encryption at Rest | PostgreSQL encryption |
| Encryption in Transit | TLS 1.3 (Traefik auto-SSL) |
| PII Handling | Minimal storage, protected identity support |
| File Scanning | ClamAV quarantine protocol |
| GDPR Compliance | Right to deletion, data export |
| Protected Identity | No PII stored for skyddad identitet |

### 9.3 Application Security

| Measure | Implementation |
|---------|----------------|
| Input Validation | Pydantic schemas (Django Ninja) |
| SQL Injection | Django ORM |
| XSS Prevention | React auto-escaping, CSP headers |
| CSRF | Django middleware |
| Rate Limiting | Redis-based throttling |
| Anti-Gaming | Locked configs, hidden weights |

---

## 10. Implementation Phases

### Phase 1: Foundation (MVP Core)

**Goal:** Basic platform with user registration and job listing

**Deliverables:**
- [ ] Django backend with Django Ninja API
- [ ] PostgreSQL database with core schema
- [ ] Next.js frontend scaffolding with shadcn/ui
- [ ] User registration (youth and admin)
- [ ] Basic authentication (email/password)
- [ ] Municipality and job models
- [ ] Simple job listing and search
- [ ] Basic admin panel structure (separate from Django admin)

**Validation:** Users can register, admins can create jobs, users can view jobs

---

### Phase 2: Lottery Engine

**Goal:** Fully functional lottery system

**Deliverables:**
- [ ] Period and group management
- [ ] Eligibility rules engine (hard filters)
- [ ] Weighting system (soft rules with tickets)
- [ ] RSD assignment algorithm
- [ ] Simulation preview (1000 runs)
- [ ] Audit report generation (PDF/JSON)
- [ ] Application flow with ranking
- [ ] Reserve list management

**Validation:** Complete lottery run with audit trail

---

### Phase 3: Guardian Verification

**Goal:** BankID and manual verification workflows

**Deliverables:**
- [ ] GrandID integration (mozilla-django-oidc)
- [ ] Document upload for manual verification
- [ ] Protected identity (skyddad identitet) workflow
- [ ] Guardian-youth linking via magic link
- [ ] Application approval flow
- [ ] 2FA implementation

**Validation:** Guardian can verify via BankID and approve applications

---

### Phase 4: CV & Cover Letter

**Goal:** AI-assisted document creation

**Deliverables:**
- [ ] CV builder with interview flow (click/select focused)
- [ ] Cover letter builder with AI assistance
- [ ] PDF generation
- [ ] Document attachment to applications
- [ ] Skills and interests management
- [ ] References feature
- [ ] Auto-update CV when job assigned

**Validation:** Youth can create and download CV/cover letter

---

### Phase 5: Messaging & Communication

**Goal:** Internal communication system

**Deliverables:**
- [ ] Messaging inbox
- [ ] Bulk messaging for admins (all applicants, assigned, not assigned, waitlist)
- [ ] Direct messaging with reply control
- [ ] Email notifications (Postmark integration)
- [ ] Admin scoping for messages

**Validation:** Admins can send bulk messages, users can receive and reply

---

### Phase 6: Multi-Language & CMS

**Goal:** Localization and content management

**Deliverables:**
- [ ] i18n framework setup
- [ ] Swedish, English, Arabic, Ukrainian translations
- [ ] CMS page builder with templates
- [ ] Blog system with SEO tools
- [ ] Start page management (all sections)
- [ ] Contact page management
- [ ] SEO measurement tools

**Validation:** Platform fully functional in all four languages

---

### Phase 7: Payments & Companies

**Goal:** Company onboarding and billing

**Deliverables:**
- [ ] Stripe integration
- [ ] Plan builder (credits and subscriptions)
- [ ] Company registration flow
- [ ] Company admin panel
- [ ] Company/organization profiles
- [ ] Invoice tier for municipalities (bypasses Stripe)

**Validation:** Company can purchase credits and post jobs

---

### Phase 8: Educational Platform

**Goal:** Learning center for users

**Deliverables:**
- [ ] Course structure (chapters, lectures)
- [ ] Video (YouTube) and text lectures
- [ ] Progress tracking
- [ ] Role-based course targeting
- [ ] Certificate generation
- [ ] LinkedIn Learning-style UX

**Validation:** Youth can complete courses and earn certificates

---

### Phase 9: Analytics & SEO

**Goal:** Data insights and search optimization

**Deliverables:**
- [ ] Analytics dashboards per role
- [ ] AI-powered SEO page generator
- [ ] SEO measurement tools
- [ ] Performance monitoring

**Validation:** Admins have visibility into key metrics

---

### Phase 10: Advanced Features & Polish

**Goal:** Production-ready platform

**Deliverables:**
- [ ] Custom fields with governance
- [ ] Geo-location detection
- [ ] Match feature with notifications
- [ ] Meilisearch integration
- [ ] File quarantine protocol (MinIO + ClamAV + Imgproxy)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] Documentation
- [ ] Monitoring and alerting (Coolify)
- [ ] Backup procedures

**Validation:** Platform ready for public launch

---

## 11. Success Metrics

### 11.1 Platform KPIs

| Metric | Target |
|--------|--------|
| User Registration Completion Rate | >80% |
| Job Application Submission Rate | >60% of eligible users |
| Guardian Verification Rate | >90% within 7 days |
| Lottery Run Success Rate | 100% |
| User Satisfaction Score | >4.0/5.0 |

### 11.2 Technical KPIs

| Metric | Target |
|--------|--------|
| Page Load Time | <2 seconds |
| API Response Time (p95) | <500ms |
| Uptime | >99.5% |
| Lottery Simulation Time | <30 seconds for 1000 runs |
| File Scan Time | <5 seconds per file |

---

## 12. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Lottery fairness disputes | High | Medium | Comprehensive audit reports, simulation previews, explainable algorithm |
| BankID integration issues | High | Low | Fallback manual verification, GrandID support |
| Data breach | Critical | Low | Security audit, encryption, minimal PII storage, protected identity workflow |
| Performance under load | Medium | Medium | Load testing, caching, CDN, Celery for async tasks |
| Multi-language quality | Medium | Medium | Professional translations, user feedback |
| Scope creep | High | High | Strict MVP adherence, phase gates |
| GDPR non-compliance | Critical | Low | Legal review, data protection practices |
| Swedish discrimination law violation | Critical | Low | Default gender-blind, guardrails, legal acknowledgements |

---

## 13. Appendix

### 13.1 Swedish Municipalities

The platform will be pre-populated with all 290 Swedish municipalities including:
- Name (Swedish)
- Region assignment
- Geographic coordinates
- Population data

### 13.2 Standard Skill Categories

Pre-defined skills for CV and job matching (managed by super admin):
- Communication
- Teamwork
- Customer Service
- Computer Skills
- Physical Work
- Driving (AM-kort, B-kort, Traktorkort)
- Languages
- First Aid
- Food Handling
- Childcare
- Animal Care
- Gardening/Outdoor Work

### 13.3 Standard Gymnasieprogram

Swedish high school programs for custom field:
- Teknik
- Naturvetenskap
- Samhällsvetenskap
- Ekonomi
- Humanistiska
- Estetiska
- Bygg och anläggning
- El och energi
- Fordon och transport
- Handel och administration
- Hantverksprogrammet
- Hotell och turism
- Industritekniska
- Naturbruk
- Restaurang och livsmedel
- VVS och fastighet
- Vård och omsorg
- Barn och fritid

### 13.4 Lottery Weight Examples

**Example 1: Age Priority**
```
Base: 10 tickets
Age 16: +3 tickets
Age 17: +2 tickets
Age 15: +1 ticket
```

**Example 2: Equity Booster**
```
Base: 10 tickets
No job last year: +5 tickets
Got job last year: 0 additional
Got 2+ jobs last year: -3 tickets (minimum 1)
```

**Example 3: Skill Match**
```
Base: 10 tickets
Required skill match: +5 tickets
Preferred skill match: +2 tickets
Gymnasieprogram match: +3 tickets
```

### 13.5 Glossary

| Term | Definition |
|------|------------|
| Feriearbete | Summer job (Swedish) |
| Kommun | Municipality |
| Arbetsplats | Workplace |
| Vårdnadshavare | Guardian |
| Ungdom | Youth |
| Lotteri | Lottery |
| Period | Time period for job allocation |
| Grupp | Group of similar jobs within a period |
| BankID | Swedish electronic identification |
| Skyddad Identitet | Protected identity status |
| GrandID | Swedish e-identity provider |
| Positiv särbehandling | Positive discrimination (legally allowed in specific cases) |
| Gymnasieprogram | High school program |
| Körkort | Driver's license |
| Bostadsområde | Residential district |

---

## 14. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-08 | Claude | Initial comprehensive PRD creation |

---

*This PRD is a living document and will be updated as requirements evolve.*
