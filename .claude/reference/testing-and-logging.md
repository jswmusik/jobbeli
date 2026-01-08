Here is the complete Testing & Logging Best Practices guide (testing_and_logging.md) tailored specifically for the Feriearbete stack (Django, Celery, Next.js).It adapts the structure of your reference file but replaces the content with Django/Postgres/Celery specifics, focusing on the critical "Lottery" and "Ghost Protocol" workflows.Markdown# Testing & Logging Best Practices: Feriearbete

A reference guide for structured logging (Django + Celery) and comprehensive testing strategies for the Feriearbete platform.

---

## Table of Contents

**Part 1: Logging with structlog**
1. [Why structlog in Django](#1-why-structlog-in-django)
2. [Configuration (Django & Celery)](#2-configuration-django--celery)
3. [Context Binding (Request & Task IDs)](#3-context-binding-request--task-ids)
4. [Structured Exception Handling](#4-structured-exception-handling)

**Part 2: Testing Strategy**
5. [The Feriearbete Testing Pyramid](#5-the-feriearbete-testing-pyramid)
6. [Backend Unit Testing (Lottery Engine)](#6-backend-unit-testing-lottery-engine)
7. [Integration Testing (Django Ninja)](#7-integration-testing-django-ninja)
8. [Frontend Component Testing (Vitest)](#8-frontend-component-testing-vitest)
9. [E2E Testing (Playwright & Ghost Protocol)](#9-e2e-testing-playwright--ghost-protocol)
10. [Test Organization](#10-test-organization)

---

# Part 1: Logging with structlog

## 1. Why structlog in Django

[cite_start]The **Lottery Engine** and **Ghost Protocol** require strict auditability[cite: 73, 149]. Standard text logs are insufficient for debugging distributed Celery tasks or tracing a specific Youth's application through the lottery.

### Key Benefits for this Project
* **Audit Trails**: JSON output allows querying logs by `youth_id` or `lottery_period_id`.
* **Celery Tracing**: Bind a unique `task_id` to every log emitted during the lottery execution.
* **Environment Aware**: Pretty colors for local dev, JSON for Hetzner/Production.

---

## 2. Configuration (Django & Celery)

### `backend/config/settings/base.py`

```python
import structlog

# Define shared processors for both Django and Celery
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.CallsiteParameterAdder(
            {structlog.processors.CallsiteParameter.FILENAME, 
             structlog.processors.CallsiteParameter.LINENO}
        ),
        structlog.processors.JSONRenderer() if not DEBUG else structlog.dev.ConsoleRenderer(),
    ],
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)
Celery Integration (backend/config/celery_app.py)Crucial for debugging the Lottery Algorithm1.Pythonfrom celery.signals import task_prerun
import structlog

@task_prerun.connect
def configure_structlog_for_celery(task_id, task, *args, **kwargs):
    # Bind the Task ID to all logs in this worker process
    structlog.contextvars.bind_contextvars(
        task_id=task_id,
        task_name=task.name
    )
3. Context Binding (Request & Task IDs)Middleware (backend/config/middleware.py)Tracks requests across the API Hub.Pythonimport uuid
import structlog

logger = structlog.get_logger()

class RequestIDMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        
        # Bind context for the duration of this request
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            path=request.path,
            method=request.method,
            user_id=request.user.id if request.user.is_authenticated else None
        )

        response = self.get_response(request)
        response["X-Request-ID"] = request_id
        
        if response.status_code >= 400:
            logger.error("Request failed", status=response.status_code)
        
        return response
Domain Service BindingInside Lottery Services, bind the specific context to trace allocation logic.Python# apps/lottery/services/allocation.py
log = structlog.get_logger()

def run_allocation(period_id: int):
    # Bind period_id so we don't have to repeat it in every log line
    log = log.bind(period_id=period_id)
    
    log.info("Starting allocation run")
    try:
        # ... RSD Algorithm ...
        log.info("Allocation finished", matched_count=500)
    except Exception as e:
        log.exception("Allocation failed")
4. Structured Exception HandlingEnsure the Ghost Protocol and BankID failures are logged with data, not just stack traces.Python# apps/users/services/auth.py
try:
    user = authenticate_bankid(token)
except BankIDError as e:
    # Log the specific error code from GrandID for debugging
    logger.error(
        "BankID authentication failed", 
        error_code=e.code, 
        ip_address=request.META['REMOTE_ADDR']
    )
    raise
Part 2: Testing Strategy5. The Feriearbete Testing PyramidLayerToolFocus AreaE2E (10%)PlaywrightCritical Paths: Youth Apply -> Guardian Approve -> Admin Verify. Ghost Protocol.Integration (20%)pytest-djangoAPI Endpoints (Django Ninja), Database Constraints, Celery Tasks.Unit (70%)pytestLottery Algorithm, Weighted Ticket Calculation, Eligibility Filters.6. Backend Unit Testing (Lottery Engine)The Lottery Engine MUST be deterministic2. Unit tests here are critical.Setup (backend/apps/lottery/tests/test_rsd.py)Pythonimport pytest
from apps.lottery.algorithm.rsd import RandomSerialDictatorship

# Pure logic test - No database required!
def test_rsd_allocation_is_deterministic():
    applicants = [{"id": 1, "score": 10}, {"id": 2, "score": 5}]
    jobs = [{"id": "A", "capacity": 1}]
    seed = 12345

    # Run 1
    engine_1 = RandomSerialDictatorship(applicants, jobs, seed=seed)
    result_1 = engine_1.run()

    # Run 2 (Same seed)
    engine_2 = RandomSerialDictatorship(applicants, jobs, seed=seed)
    result_2 = engine_2.run()

    assert result_1 == result_2
Testing Weights 3Pythondef test_age_weighting():
    youth = YouthProfile(age=17)
    # Config: 17 year olds get +2 tickets
    tickets = calculate_tickets(youth, config={"age_17_bonus": 2})
    assert tickets == 3  # Base 1 + Bonus 2
7. Integration Testing (Django Ninja)Test the API endpoints and Database Interactions.Setup (backend/conftest.py)Pythonimport pytest
from ninja.testing import TestClient
from api.router import router

@pytest.fixture
def api_client():
    return TestClient(router)

@pytest.fixture
def youth_user(db):
    # Use FactoryBoy for complex models
    return YouthFactory.create()
API Test (backend/apps/jobs/tests/test_api.py)Python@pytest.mark.django_db
def test_apply_for_job_success(api_client, youth_user, job):
    # Authenticate via header or mock
    headers = {"Authorization": f"Bearer {youth_user.token}"}
    
    response = api_client.post(
        f"/jobs/{job.id}/apply",
        headers=headers,
        json={"priority": 1}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "pending"
    
    # Verify DB state
    assert Application.objects.filter(youth=youth_user, job=job).exists()
8. Frontend Component Testing (Vitest)Focus on Domain Components logic (Forms, Validation, State)4.Setup (frontend/vitest.config.ts)TypeScriptimport { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
Testing the Job Form (frontend/src/components/domains/jobs/JobForm.test.tsx)TypeScriptimport { render, screen, fireEvent } from '@testing-library/react'
import { JobForm } from './JobForm'

test('validates required fields', async () => {
  render(<JobForm onSubmit={vi.fn()} />)
  
  // Submit empty form
  fireEvent.click(screen.getByRole('button', { name: /save/i }))
  
  // Check Zod validation messages
  expect(await screen.findByText(/title is required/i)).toBeInTheDocument()
})

test('renders custom fields based on municipality config', () => {
    const config = { "school": ["A", "B"] }
    render(<JobForm customFieldConfig={config} />)
    
    // Should see the dropdown for School
    expect(screen.getByLabelText(/school/i)).toBeInTheDocument()
})
9. E2E Testing (Playwright & Ghost Protocol)End-to-End tests are mandatory for the Ghost Protocol (Protected Identity) workflow to ensure privacy isn't leaked 5.Config (frontend/playwright.config.ts)TypeScriptuse: {
  baseURL: 'http://localhost:3000',
  storageState: 'playwright/.auth/admin.json', // Pre-login state
}
The Ghost Protocol Test (tests/e2e/ghost_protocol.spec.ts)TypeScripttest('Ghost Protocol: Admin verifies protected identity manually', async ({ page }) => {
  // 1. Youth Apply (Mocked or Real)
  // Assume Youth applied and got Ref Code: #X9-B22

  // 2. Admin logs in
  await page.goto('/admin/users');
  
  // 3. Search for Ref Code
  await page.getByPlaceholder('Search users...').fill('#X9-B22');
  
  // 4. Verify Privacy UI
  const userRow = page.getByRole('row').filter({ hasText: '#X9-B22' });
  await expect(userRow).toBeVisible();
  // ENSURE Real Name is NOT visible
  await expect(userRow).not.toContainText('John Doe'); 

  // 5. Manual Verification
  await userRow.getByRole('button', { name: /verify manually/i }).click();
  
  // 6. Confirm Modal
  await page.getByRole('dialog').getByRole('button', { name: /confirm/i }).click();
  
  // 7. Verify Status Change
  await expect(userRow.getByText('Verified')).toBeVisible();
});
10. Test OrganizationKeep tests close to the logic in Django (Apps structure) and Next.js (Feature structure).Plaintext/backend
├── /apps
│   ├── /lottery
│   │   ├── /tests
│   │   │   ├── test_rsd.py          # Unit (Algorithm)
│   │   │   ├── test_tasks.py        # Integration (Celery)
│   │   │   └── test_api.py          # Integration (Ninja)
│   ├── /users
│   │   ├── /tests
│   │       ├── test_ghost.py        # Unit (Privacy Logic)

/frontend
├── /src
│   ├── /components
│   │   ├── /domains
│   │   │   ├── /jobs
│   │   │   │   └── __tests__        # Component Tests
│   │   │   │       └── JobCard.test.tsx
├── /tests
│   ├── /e2e
│   │   ├── ghost_protocol.spec.ts
│   │   ├── lottery_run.spec.ts
Quick CommandsBash# Backend (Pytest)
pytest apps/lottery                  # Run specific app tests
pytest -m "not slow"                 # Skip slow simulations
pytest --cov=apps                    # Check coverage

# Frontend (Vitest)
npm run test                         # Run unit/component tests

# E2E (Playwright)
npx playwright test ghost_protocol   # Run specific workflow