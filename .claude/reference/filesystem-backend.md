# Backend Architecture & File System: Feriearbete

This document outlines the file system structure, architectural patterns, and tech stack for the **Feriearbete** backend. The system follows a "Central API Hub" pattern using Django and Django Ninja.

## 1. Technology Stack
* **Framework:** Django 5.2 LTS (supported until April 2028)
* **Python:** 3.12
* **API Interface:** Django Ninja (Type-safe REST APIs)
* **Database:** PostgreSQL 16
* **Async/Queues:** Celery + Redis (Lottery execution, Email, Virus Scanning)
* **Auth:** Mozilla-django-oidc (BankID via GrandID)
* **Search:** Meilisearch
* **Storage:** MinIO (S3 Compatible)
* **Virus Scanning:** ClamAV

---

## 2. Architectural Pattern: "The Central Hub"
The project uses a strict separation of concerns:
1.  **`backend/api`**: The Gateway. It contains the central router and exposes endpoints. It does **not** contain business logic.
2.  **`backend/apps`**: The Logic. Contains pure domain logic modules.
    * **`services.py`**: Handles WRITES (Create, Update, Delete) and complex logic (e.g., Lottery algorithm).
    * **`selectors.py`**: Handles READS (Queries, Filters, Reporting).
    * **`tasks.py`**: Async background jobs via Celery.

---

## 3. Root Directory Structure

The root structure ensures modularity and scalability.

```text
/backend
├── /config                         # Django Project Configuration
│   ├── __init__.py
│   ├── asgi.py
│   ├── wsgi.py
│   ├── urls.py                     # Entry point (Imports api.urls)
│   ├── celery_app.py               # Celery Worker Config
│   └── settings/
│       ├── base.py
│       ├── local.py
│       └── production.py           # Hetzner/S3/Sentry config
│
├── /api                            # <--- THE CENTRAL HUB
│   ├── __init__.py
│   ├── apps.py
│   ├── router.py                   # Registers ALL ViewSets from apps
│   ├── urls.py                     # Exposes the router to config/urls.py
│   ├── permissions.py              # Global permissions (IsSuperAdmin)
│   ├── renderers.py                # JSON response formatting
│   └── exception_handlers.py       # Global error catching
│
├── /apps                           # <--- FEATURE MODULES
│   ├── /users                      # Auth, Profiles, BankID
│   ├── /organizations              # Municipalities, Companies
│   ├── /jobs                       # Listings, Applications
│   ├── /lottery                    # The Selection Engine
│   ├── /cv_builder                 # AI Resume/Cover Letter
│   ├── /communication              # Internal Messaging
│   ├── /education                  # LMS/Courses
│   ├── /cms                        # Marketing Pages/SEO
│   ├── /finance                    # Stripe/Invoicing
│   ├── /files                      # Quarantine/Virus Scanning
│   └── /analytics                  # Data Reporting
│
├── manage.py
├── Dockerfile
├── entrypoint.sh
└── requirements.txt

A. Users App (/apps/users)
Handles Youth, Guardians, Protected Identity (Skyddad Identitet), and BankID auth.

Plaintext

/apps/users
├── models.py           # User, YouthProfile, GuardianProfile
├── managers.py         # BankID User Creation Logic
├── serializers.py      # UserSerializer, BankIDAuthSerializer
├── views.py            # AuthViewSet, ProfileViewSet
├── permissions.py      # IsYouth, IsGuardian, IsMunicipalityAdmin
├── services/
│   ├── auth.py              # handle_bankid_login, create_magic_link
│   ├── onboarding.py        # link_guardian_to_youth
│   └── ghost_protocol.py    # handle_protected_identity_verification
└── selectors.py        # get_youth_profile, get_guardians_for_youth
B. Organizations App (/apps/organizations)
Handles Municipalities, Companies, Workspaces, and Regions.

Plaintext

/apps/organizations
├── models.py           # Municipality, Company, Workplace, Region
├── serializers.py      # MunicipalityConfigSerializer, CompanySerializer
├── views.py            # MunicipalityViewSet, CompanyViewSet
├── services/
│   ├── invite.py            # invite_admin_user
│   └── config.py            # update_municipality_settings
└── selectors.py        # get_municipalities_by_region
C. Jobs App (/apps/jobs)
Handles Normal Jobs, Lottery Jobs, Applications, and Custom Fields.

Plaintext

/apps/jobs
├── models.py           # Job, Application, CustomField
├── serializers.py      # JobSerializer, ApplicationSerializer
├── views.py            # JobViewSet, ApplicationViewSet
├── services/
│   ├── job_manager.py       # create_job, assign_custom_fields
│   └── application.py       # submit_application (Checks eligibility)
└── selectors.py        # get_eligible_jobs_for_youth
D. Lottery App (/apps/lottery)

Core Engine: Random Serial Dictatorship (RSD), Periods, Groups, Simulation.

Plaintext

/apps/lottery
├── models.py           # Period, Group, LotteryConfig, AllocationResult
├── serializers.py      # LotteryRunSerializer, SimulationReportSerializer
├── views.py            # LotteryControlViewSet
├── tasks.py            # Celery: run_lottery_task, run_simulation_task
├── algorithm/
│   ├── rsd.py               # Random Serial Dictatorship Logic
│   ├── weighting.py         # Ticket calculation (Soft rules)
│   ├── eligibility.py       # Hard filters (Age, Grade)
│   └── simulator.py         # Run 1000x simulations
└── services/
    └── reporting.py         # Generate Audit PDF/JSON
E. CV Builder App (/apps/cv_builder)
AI-powered Resume and Cover Letter generation.

Plaintext

/apps/cv_builder
├── models.py           # CV, CoverLetter, Skill, Interest
├── serializers.py      # CVSerializer, GenerateCVPromptSerializer
├── views.py            # CVViewSet
├── services/
│   ├── ai_client.py         # OpenAI/LLM Integration
│   └── generator.py         # generate_cv_content
└── pdf/
    └── renderer.py          # Convert CV to PDF
F. Communication App (/apps/communication)
Internal messaging system (Bulk/Direct).

Plaintext

/apps/communication
├── models.py           # Message, Thread, MessageRecipient
├── serializers.py      # MessageSerializer
├── views.py            # MessageViewSet
├── services/
│   └── messenger.py         # send_bulk_message, send_direct_message
└── tasks.py            # Celery: send_email_notifications
G. CMS App (/apps/cms)
Startpage, Blog, SEO Engine, Page Builder.

Plaintext

/apps/cms
├── models.py           # Page, BlogPost, HeroSection
├── serializers.py      # PageSerializer, BlogSerializer
├── views.py            # CMSViewSet
├── services/
│   └── seo_engine.py        # AI SEO Page Generator
└── selectors.py        # get_published_pages
H. Education App (/apps/education)
Learning Management System (LMS).

Plaintext

/apps/education
├── models.py           # Course, Chapter, Lecture, UserProgress
├── serializers.py      # CourseSerializer, ProgressSerializer
├── views.py            # EducationViewSet
└── services/
    └── progress.py          # mark_lecture_complete
I. Finance App (/apps/finance)
Stripe for companies, Invoice generation for Municipalities.

Plaintext

/apps/finance
├── models.py           # Plan, Subscription, Invoice
├── serializers.py      # PlanSerializer, CheckoutSessionSerializer
├── views.py            # PaymentViewSet
└── services/
    ├── stripe_service.py    # create_checkout_session
    └── invoice_service.py   # generate_municipality_invoice
J. Files App (/apps/files)
Security layer: Quarantine -> Virus Scan -> Clean Storage.

Plaintext

/apps/files
├── models.py           # FileUpload (status: 'quarantine'|'clean')
├── views.py            # FileUploadViewSet
├── tasks.py            # Celery: scan_file_clamav_task
└── services/
    ├── storage.py           # MinIO S3 wrapper
    └── scanner.py           # ClamAV Interaction logic
5. Critical Configuration Files (The "Glue")
A. The Central Router (backend/api/router.py)
This file aggregates all endpoints so urls.py remains clean .

Python

from rest_framework.routers import DefaultRouter
# Import ViewSets from all apps
from apps.users.views import AuthViewSet, UserViewSet
from apps.jobs.views import JobViewSet
from apps.lottery.views import LotteryControlViewSet
from apps.cv_builder.views import CVViewSet
# ... import all others

router = DefaultRouter()

# --- Public Routes ---
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'jobs', JobViewSet, basename='jobs')

# --- Protected Routes ---
router.register(r'users', UserViewSet, basename='users')
router.register(r'lottery', LotteryControlViewSet, basename='lottery')
router.register(r'cv', CVViewSet, basename='cv')
B. The API URL Configuration (backend/api/urls.py)
Exposes the router to the Django project .

Python

from django.urls import path, include
from .router import router

urlpatterns = [
    path('', include(router.urls)),
]
C. The Project URL Configuration (backend/config/urls.py)
The main entry point for the server .

Python

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('super-admin/', admin.site.urls), # Django Native Admin (Fallback)
    path('api/v1/', include('api.urls')),  # <--- The Main API
]