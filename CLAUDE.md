# Feriearbete Platform

A multi-tenant SaaS for Swedish municipalities to manage youth summer job lotteries.

## Tech Stack

- **Backend**: Django 5.2 LTS + Django Ninja, PostgreSQL 16, Celery + Redis, Python 3.12
- **Frontend**: Next.js 15.x (App Router), React 19, TypeScript (strict), Tailwind CSS, shadcn/ui
- **Runtime**: Node.js 20 LTS or 22 LTS
- **Search**: Meilisearch
- **Storage**: MinIO (S3 Compatible) + ClamAV (virus scanning)
- **Auth**: GrandID (BankID) via mozilla-django-oidc

## Project Structure

```
feriearbete/
├── backend/
│   ├── config/               # Django settings (base, local, production)
│   │   ├── settings/
│   │   ├── urls.py           # Entry point → imports api.urls
│   │   └── celery_app.py     # Celery worker config
│   ├── api/                  # Central API Router ("The Hub")
│   │   ├── router.py         # Registers all endpoints from apps
│   │   ├── permissions.py    # Global permissions (IsSuperAdmin, etc.)
│   │   └── schemas.py        # Shared Pydantic schemas
│   ├── apps/                 # Domain logic modules
│   │   ├── users/            # Auth, Guardian, Ghost Protocol
│   │   ├── jobs/             # Job listings (lottery + normal)
│   │   ├── lottery/          # THE CORE: Lottery engine
│   │   ├── municipalities/   # Multi-tenant org management
│   │   ├── cv_builder/       # AI-powered CV/Cover letter
│   │   ├── messaging/        # Internal messaging system
│   │   ├── cms/              # CMS, SEO, blog
│   │   └── files/            # MinIO + ClamAV quarantine
│   │   # Each app contains:
│   │   #   services.py   → Business logic (WRITES)
│   │   #   selectors.py  → Queries (READS)
│   │   #   tasks.py      → Celery background jobs
│   │   #   schemas.py    → Pydantic input/output schemas
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/              # App Router ("Fortresses" by role)
│   │   │   ├── (public)/     # Marketing, SEO pages
│   │   │   ├── (auth)/       # Login, BankID, registration
│   │   │   ├── (admin)/      # Super Admin dashboard
│   │   │   ├── (municipality)/ # Municipality admin (lottery config)
│   │   │   ├── (company)/    # Company admin
│   │   │   ├── (youth)/      # Youth dashboard (mobile-first)
│   │   │   └── (guardian)/   # Guardian approval portal
│   │   ├── components/
│   │   │   ├── ui/           # shadcn/ui primitives
│   │   │   ├── shared/       # Navbar, Footer, LanguageSwitch
│   │   │   └── domains/      # Feature components (matches backend apps)
│   │   │       ├── jobs/     # JobCard, JobSearch, JobRanking
│   │   │       ├── lottery/  # LotterySimulation, AuditReport
│   │   │       ├── cv-builder/
│   │   │       └── users/    # GuardianVerification, GhostProtocol
│   │   ├── lib/
│   │   │   ├── api/          # Fetch wrappers (match Django endpoints)
│   │   │   ├── hooks/        # TanStack Query hooks
│   │   │   └── validations/  # Zod schemas (mirror backend Pydantic)
│   │   └── middleware.ts     # Route protection by role
│   └── package.json
└── .claude/
    ├── PRD.md                # Master Product Requirements Document
    ├── reference/            # Technical architecture docs
    └── commands/             # Claude Code slash commands
```

## Commands

```bash
# Backend (Django)
cd backend
source venv/bin/activate
python manage.py runserver 8000
celery -A config worker -l info              # Celery worker
celery -A config beat -l info                # Celery scheduler

# Frontend (Next.js)
cd frontend
npm run dev                                  # Dev server (port 3000)
npm run build                                # Production build
npm run lint                                 # ESLint + TypeScript check

# Database
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Testing (Backend)
cd backend
pytest apps/lottery -v                       # Test Lottery Engine
pytest apps/users -v                         # Test Auth/Ghost Protocol
pytest --cov=apps --cov-report=html          # Full coverage report

# Testing (Frontend)
cd frontend
npm run test                                 # Unit tests (Vitest)
npx playwright test                          # E2E tests

# Docker (via Coolify)
docker-compose up -d                         # Local development
```

## Reference Documentation

Read these documents before implementing features:

| Document | Purpose |
|----------|---------|
| [.claude/PRD.md](.claude/PRD.md) | **Single Source of Truth** - All features, lottery logic, roles, API spec |
| [.claude/reference/filesystem-backend.md](.claude/reference/filesystem-backend.md) | Django app structure, Central Hub pattern, services/selectors |
| [.claude/reference/filesystem-frontend.md](.claude/reference/filesystem-frontend.md) | Next.js App Router, Fortress pattern, component hierarchy |
| [.claude/reference/components.md](.claude/reference/components.md) | UI primitives and domain component inventory |
| [.claude/reference/design.md](.claude/reference/design.md) | Design system, colors, typography, spacing |
| [.claude/reference/testing-and-logging.md](.claude/reference/testing-and-logging.md) | structlog config, Testing Pyramid, Playwright E2E |
| [.claude/reference/deployment-best-practices.md](.claude/reference/deployment-best-practices.md) | Hetzner, Coolify, Traefik, production config |

## Code Conventions

### Backend (Django + Django Ninja)

```python
# Pattern: Service Layer - Views ONLY call services.py or selectors.py
# NEVER put business logic in views/endpoints

# services.py - WRITES
def create_lottery_run(*, period_id: int, admin_user: User) -> LotteryRun:
    with transaction.atomic():
        period = Period.objects.select_for_update().get(id=period_id)
        # ... lottery logic
        return lottery_run

# selectors.py - READS
def get_eligible_applicants(*, period_id: int) -> QuerySet[Application]:
    return Application.objects.filter(
        period_id=period_id,
        status=ApplicationStatus.IN_LOTTERY
    ).select_related('user', 'group')

# schemas.py - Pydantic for type-safe APIs
class LotteryRunOut(Schema):
    id: int
    seed: str
    results: dict
    audit_report_url: str | None
```

**Key Rules:**
- Use `transaction.atomic()` + `select_for_update()` for lottery allocation
- Use `JSONField` for municipality custom attributes and lottery configs
- All Celery tasks must be idempotent
- Log with `structlog` - always include `request_id`, `user_id`

### Frontend (Next.js + TypeScript)

```typescript
// Data fetching: TanStack Query for ALL GET requests
const { data: jobs } = useQuery({
  queryKey: ['jobs', municipalityId],
  queryFn: () => api.jobs.list(municipalityId),
});

// Forms: react-hook-form + zod
const schema = z.object({
  rankedJobs: z.array(z.number()).max(10),
  acceptAnyJob: z.boolean(),
});

// Zod schemas MUST mirror backend Pydantic schemas
```

**Key Rules:**
- NEVER calculate lottery results on the client
- Use Server Components for SEO pages, Client Components for interactive features
- All API calls go through `lib/api/` wrappers
- Mobile-first for youth dashboard

## Logging & Observability

```python
import structlog

log = structlog.get_logger()

# Always bind context
log.info("lottery_allocation_started",
    period_id=period.id,
    applicant_count=len(applicants),
    seed=seed
)

# In Celery tasks
@app.task(bind=True)
def run_lottery_task(self, period_id: int):
    structlog.contextvars.bind_contextvars(
        task_id=self.request.id,
        period_id=period_id
    )
    log.info("lottery_task_started")
```

## Critical Workflows ("Danger Zone")

### 1. Lottery Engine
The lottery MUST be deterministic and auditable. See PRD Section 5.1.

```python
# CRITICAL: Same seed + same inputs = same results
# Algorithm: Weighted Random Serial Dictatorship (RSD)
#
# Step A: Eligibility Filter (hard rules) → EligibleApplicants
# Step B: Lottery Weights (soft rules) → WeightedApplicants with tickets
# Step C: RSD Assignment → Assigned + Reserve lists
# Step D: Generate Audit Report (PDF/JSON)

# NEVER modify lottery config after applications close
# ALWAYS generate audit report with seed, timestamp, engine version
```

### 2. Ghost Protocol (Protected Identity)
For users with `is_protected_identity=True`, NEVER store PII.

```python
# The flow:
# 1. Youth toggles "Skyddad identitet" checkbox
# 2. Application enters Pending_Manual_Verification status
# 3. System generates reference code (e.g., #X9-B22)
# 4. Admin verifies in-person, clicks "Manually Verify"
# 5. System stores ONLY: timestamp + admin_id (NO guardian name/address)
```

### 3. BankID Integration
Handle GrandID callbacks securely.

```python
# Location: apps/users/services/auth.py
# CRITICAL: Validate all OIDC callbacks
# Auto-populate: first_name, last_name, date_of_birth from BankID
# Guardian is auto-verified when BankID succeeds
```

### 4. File Quarantine Protocol
All uploads go through ClamAV scanning.

```
Upload → MinIO (quarantine bucket) → Celery task → ClamAV scan
  ├── CLEAN → Move to clean-media bucket
  └── DIRTY → Delete + Log security event
```

## Multi-Language Support

Languages: Swedish (sv), English (en), Arabic (ar), Ukrainian (uk)

```typescript
// Frontend: next-intl
import { useTranslations } from 'next-intl';
const t = useTranslations('jobs');
// <p>{t('apply_button')}</p>

// Backend: Django translation
from django.utils.translation import gettext_lazy as _
error_message = _("Application deadline has passed")
```

## Role-Based Access Control

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| Super Admin | Platform-wide | CRUD all entities, CMS, SEO, skills/tags |
| Municipality Admin | Own municipality | Lottery config, periods, jobs, users |
| Workspace Admin | Own workspace | Jobs (lottery + normal), applicant management |
| Company Admin | Own company | Normal jobs only (no lottery) |
| Youth | Own profile | Apply to jobs, CV builder, view results |
| Guardian | Linked youth | Approve applications, verify identity |

## Database Considerations

```python
# Use JSONB for flexible municipality configs
class Municipality(models.Model):
    settings = models.JSONField(default=dict)  # custom_fields, lottery_weights

# Lottery allocation requires row-level locking
with transaction.atomic():
    period = Period.objects.select_for_update().get(id=period_id)
    # ... allocate jobs

# Index frequently filtered fields
class Application(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=['period_id', 'status']),
            models.Index(fields=['user_id', 'created_at']),
        ]
```

## Quick Reference

```bash
# Create new Django app
cd backend
python manage.py startapp new_feature
mv new_feature apps/
# Add to INSTALLED_APPS as 'apps.new_feature'

# Add shadcn component
cd frontend
npx shadcn-ui@latest add button

# Generate Zod schema from backend
# (Manual process - copy Pydantic schema structure to Zod)
```

## Testing Checklist

Before submitting code:

- [ ] Backend: `pytest apps/ -v` passes
- [ ] Frontend: `npm run test` passes
- [ ] Frontend: `npm run lint` passes
- [ ] Lottery changes: Test with same seed produces same results
- [ ] Ghost Protocol changes: Verify NO PII stored for protected users
- [ ] New endpoints: Add to API documentation
- [ ] New components: Add Storybook story (if applicable)
