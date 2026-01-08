# PostgreSQL 16 & Django Best Practices: Feriearbete

A reference guide for the **Feriearbete** backend, specifically optimized for the "Central API Hub" architecture, the Lottery Engine, and JSONB Custom Fields.

---

## Table of Contents

1. [Architecture & Stack](#1-architecture--stack)
2. [Schema Design (JSONB & Arrays)](#2-schema-design-jsonb--arrays)
3. [Indexing Strategies](#3-indexing-strategies)
4. [Concurrency & Locking (The Lottery)](#4-concurrency--locking-the-lottery)
5. [Query Optimization in Django](#5-query-optimization-in-django)
6. [Data Integrity & Constraints](#6-data-integrity--constraints)
7. [Maintenance & Performance](#7-maintenance--performance)
8. [Anti-Patterns](#8-anti-patterns)

---

## 1. Architecture & Stack

### The Stack
* **Database:** PostgreSQL 16
* **Interface:** Django 5.x (via `psycopg` driver)
* **Search:** Meilisearch (Synced via Signals/Celery, not dependent on Postgres FTS)
* **Connection Pooling:** PgBouncer (Recommended for production)

### When to use Postgres features vs Django Logic
Since we use the **Service Layer Pattern** (`/apps/services.py`):
* **Business Logic:** Keep in Python (Services).
* **Data Integrity:** Keep in Postgres (Constraints, Foreign Keys).
* **Search:** Simple filters in Postgres; Complex text search in Meilisearch.

---

## 2. Schema Design (JSONB & Arrays)

### 2.1. Handling Custom Fields
The project relies heavily on municipal "Custom Fields" (e.g., School, District). In Postgres, use `JSONB` (Binary JSON), not `JSON` (Text). `JSONB` supports indexing and faster querying.

**Django Model:**
```python
from django.db import models

class Job(models.Model):
    # ... standard fields ...
    # Store custom fields as: {"school": "Centralskolan", "driver_license": ["AM"]}
    custom_attributes = models.JSONField(default=dict, blank=True)

    Here is the complete .md file. You can save this as postgres-django-best-practices.md.Markdown# PostgreSQL 16 & Django Best Practices: Feriearbete

A reference guide for the **Feriearbete** backend, specifically optimized for the "Central API Hub" architecture, the Lottery Engine, and JSONB Custom Fields.

---

## Table of Contents

1. [Architecture & Stack](#1-architecture--stack)
2. [Schema Design (JSONB & Arrays)](#2-schema-design-jsonb--arrays)
3. [Indexing Strategies](#3-indexing-strategies)
4. [Concurrency & Locking (The Lottery)](#4-concurrency--locking-the-lottery)
5. [Query Optimization in Django](#5-query-optimization-in-django)
6. [Data Integrity & Constraints](#6-data-integrity--constraints)
7. [Maintenance & Performance](#7-maintenance--performance)
8. [Anti-Patterns](#8-anti-patterns)

---

## 1. Architecture & Stack

### The Stack
* **Database:** PostgreSQL 16
* **Interface:** Django 5.x (via `psycopg` driver)
* **Search:** Meilisearch (Synced via Signals/Celery, not dependent on Postgres FTS)
* **Connection Pooling:** PgBouncer (Recommended for production)

### When to use Postgres features vs Django Logic
Since we use the **Service Layer Pattern** (`/apps/services.py`):
* **Business Logic:** Keep in Python (Services).
* **Data Integrity:** Keep in Postgres (Constraints, Foreign Keys).
* **Search:** Simple filters in Postgres; Complex text search in Meilisearch.

---

## 2. Schema Design (JSONB & Arrays)

### 2.1. Handling Custom Fields
The project relies heavily on municipal "Custom Fields" (e.g., School, District). In Postgres, use `JSONB` (Binary JSON), not `JSON` (Text). `JSONB` supports indexing and faster querying.

**Django Model:**
```python
from django.db import models

class Job(models.Model):
    # ... standard fields ...
    # Store custom fields as: {"school": "Centralskolan", "driver_license": ["AM"]}
    custom_attributes = models.JSONField(default=dict, blank=True)
Postgres Implementation:Postgres stores this as efficient binary. You can query keys directly.2.2. Arrays for Multi-SelectsFor fields like "Driver's Licenses" (AM-kort, B-kort), use Postgres ArrayField instead of a separate Many-to-Many table if the list is short and rarely changes.Pythonfrom django.contrib.postgres.fields import ArrayField

class YouthProfile(models.Model):
    # Avoids an extra JOIN table for simple tags
    licenses = ArrayField(models.CharField(max_length=10), blank=True, default=list)
2.3. UUID vs BigIntInternal IDs: Use BigAutoField (64-bit integer) for primary keys. It is faster for JOINs and creates smaller indexes than UUIDs.Public IDs: Use a separate uuid field or the "Ghost Protocol" ID (#X9-B22) for public URLs to prevent ID enumeration.3. Indexing Strategies3.1. GIN Indexes (Critical for Custom Fields)Standard B-Tree indexes don't work inside JSON. Use GIN (Generalized Inverted Index) to filter by custom fields (e.g., "Find all jobs in 'Centralskolan'").Pythonfrom django.contrib.postgres.indexes import GinIndex

class Job(models.Model):
    class Meta:
        indexes = [
            # Enables fast filtering: Job.objects.filter(custom_attributes__school="Centralskolan")
            GinIndex(fields=['custom_attributes'], name='job_custom_attr_gin'),
        ]
3.2. Partial Indexes (Active vs Archive)The database will grow with historical data. Most queries only care about the current period.SQL-- Only index active jobs. Reduces index size significantly.
CREATE INDEX idx_active_jobs ON apps_jobs_job(status) WHERE status = 'published';
Django:Pythonmodels.Index(fields=['status'], name='active_jobs_idx', condition=models.Q(status='published'))
3.3. Composite Indexes for Lottery FilteringThe lottery engine filters by Period + Group + Age. Create a composite index in this specific order (Equality first, Range last).SQL-- Good for: WHERE period_id=1 AND group_id=2 AND age >= 16
CREATE INDEX idx_lottery_match ON apps_users_youthprofile(period_id, group_id, age);
4. Concurrency & Locking (The Lottery)4.1. The "Double Booking" ProblemWhen the RSD (Random Serial Dictatorship) algorithm runs, thousands of assignments happen in seconds. You must prevent two youth from grabbing the last spot in a job simultaneously.4.2. Solution: select_for_update()Use pessimistic locking. This tells Postgres: "Lock these rows until my transaction finishes."Pythonfrom django.db import transaction

# Inside /apps/lottery/services/allocation.py
@transaction.atomic
def assign_job(youth_id, job_id):
    # LOCK the job row. Other transactions wait here.
    job = Job.objects.select_for_update().get(id=job_id)

    if job.spots_taken < job.total_spots:
        Application.objects.create(youth_id=youth_id, job=job, status='assigned')
        job.spots_taken += 1
        job.save()
    else:
        raise JobFullError()
4.3. Skip Locked (For Queue Workers)If you have multiple Celery workers processing queue items, use skip_locked to prevent them from grabbing the same task.Python# Worker grabs the next available task that isn't being worked on
task = Queue.objects.select_for_update(skip_locked=True).first()
5. Query Optimization in Django5.1. N+1 Problem (The silent killer)Fetching related objects in a loop.BAD:Pythonjobs = Job.objects.all()
for job in jobs:
    print(job.municipality.name)  # Triggers 1 SQL query per job
GOOD:Python# select_related (SQL JOIN) for ForeignKey
jobs = Job.objects.select_related('municipality').all()

# prefetch_related (Python-side join) for ManyToMany
jobs = Job.objects.prefetch_related('skills').all()
5.2. Iterators for Large DataWhen processing the "Simulation Preview" (1,000 runs), do not load all objects into RAM.Python# Stream results from DB instead of loading all at once
for applicant in Applicant.objects.filter(period=p).iterator(chunk_size=2000):
    process_applicant(applicant)
5.3. Existence ChecksBAD: if User.objects.filter(id=1).count() > 0: (Counts all rows)GOOD: if User.objects.filter(id=1).exists(): (Stops at first match)6. Data Integrity & Constraints6.1. Database Level ValidationDon't rely solely on Zod/Pydantic. Enforce hard rules in Postgres.Pythonclass Application(models.Model):
    class Meta:
        constraints = [
            # Ensure a youth can't apply to the same job twice
            models.UniqueConstraint(fields=['youth', 'job'], name='unique_application'),
            
            # Ensure status is valid
            models.CheckConstraint(
                check=models.Q(status__in=['pending', 'assigned', 'reserve']), 
                name='valid_status_check'
            )
        ]
6.2. Foreign Key behaviorFor the Lottery, if a Period is deleted, we likely want to Cascade delete the settings, but SET NULL for the historical AllocationResults to keep the audit trail.Pythonperiod = models.ForeignKey(Period, on_delete=models.CASCADE)
historical_record = models.ForeignKey(Period, on_delete=models.SET_NULL, null=True)
7. Maintenance & Performance7.1. Vacuum & AnalyzePostgres uses MVCC (Multi-Version Concurrency Control). Updates create new row versions; old ones are "dead tuples."Auto-Vacuum: Ensure it is ON (Default in RDS/Hetzner).Bloat: If apps_jobs_application table sees high churn during lottery simulation, run VACUUM ANALYZE manually after the lottery finishes.7.2. Connection PoolingDjango opens a new connection for every request. This is slow.Production: Use PgBouncer (Transaction pooling mode).Django: Set CONN_MAX_AGE to a reasonable value (e.g., 60s) in settings.py.PythonDATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'feriearbete',
        'CONN_MAX_AGE': 60, # Persistent connections
    }
}
8. Anti-PatternsPatternVerdictReasonStoring Large Files in DBAVOIDBloats backups. Use MinIO/S3 and store the URL.Logic in Stored ProceduresAVOIDKeeps logic hidden. Keep business logic in Django Services.Using JSONField for everythingAVOIDLoose schema. Only use for truly dynamic municipal config.Looping over .save()AVOIDUse bulk_create or bulk_update for batch operations.Filtering Python-sideAVOID[x for x in users if x.is_active] loads all users. Filter in DB.