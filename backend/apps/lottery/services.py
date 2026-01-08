"""
Lottery Service Layer.

This module contains the business logic for running the lottery.
It orchestrates fetching data from the database, running the algorithm,
and saving the results.

CRITICAL: All lottery operations must be atomic and auditable.
"""
from datetime import date
from django.db import transaction
from django.utils import timezone
from apps.jobs.models import Application, Job
from apps.lottery.models import JobGroup, LotteryRun
from apps.users.models import YouthProfile
from .algorithm.rsd import RSDMatchEngine


# Grade ordering for comparison
GRADE_ORDER = [
    'YEAR_1', 'YEAR_2', 'YEAR_3', 'YEAR_4', 'YEAR_5',
    'YEAR_6', 'YEAR_7', 'YEAR_8', 'YEAR_9',
    'GYM_1', 'GYM_2', 'GYM_3', 'GYM_4'
]


def calculate_age(birth_date: date, reference_date: date = None) -> int:
    """Calculate age from birth date."""
    if reference_date is None:
        reference_date = date.today()
    age = reference_date.year - birth_date.year
    if (reference_date.month, reference_date.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age


def is_grade_in_range(youth_grade: str, min_grade: str | None, max_grade: str | None) -> bool:
    """Check if youth's grade is within the required range."""
    if not youth_grade:
        return True  # No grade set, allow by default

    try:
        youth_idx = GRADE_ORDER.index(youth_grade)
    except ValueError:
        return True  # Unknown grade, allow by default

    if min_grade:
        try:
            min_idx = GRADE_ORDER.index(min_grade)
            if youth_idx < min_idx:
                return False
        except ValueError:
            pass

    if max_grade:
        try:
            max_idx = GRADE_ORDER.index(max_grade)
            if youth_idx > max_idx:
                return False
        except ValueError:
            pass

    return True


def check_eligibility(youth: YouthProfile, job: Job, group: JobGroup) -> tuple[bool, str]:
    """
    Check if a youth is eligible for a specific job.

    Returns:
        Tuple of (is_eligible, reason)
    """
    # Check age requirements from JobGroup
    if youth.user.date_of_birth:
        age = calculate_age(youth.user.date_of_birth)
        if age < group.min_age:
            return False, f"Too young (age {age}, min {group.min_age})"
        if age > group.max_age:
            return False, f"Too old (age {age}, max {group.max_age})"

    # Check grade requirements from Job
    if job.min_grade or job.max_grade:
        if not is_grade_in_range(youth.grade, job.min_grade, job.max_grade):
            return False, f"Grade {youth.grade} not in range {job.min_grade}-{job.max_grade}"

    return True, "Eligible"


def run_lottery_for_group(group_id: str, user_id: str) -> LotteryRun:
    """
    Execute the lottery for a specific job group.

    This function:
    1. Fetches all published jobs in the group
    2. Fetches all pending applications for those jobs
    3. Filters out ineligible applicants (age, grade requirements)
    4. Runs the RSD algorithm
    5. Updates application statuses atomically
    6. Creates an audit record

    Args:
        group_id: UUID of the JobGroup to run lottery for
        user_id: UUID of the user executing the lottery

    Returns:
        LotteryRun record with results

    Raises:
        JobGroup.DoesNotExist: If group_id is invalid
        ValueError: If there are no jobs or applications
    """
    group = JobGroup.objects.select_related('municipality').get(id=group_id)

    # 1. Fetch all published jobs in this group
    jobs = Job.objects.filter(
        lottery_group=group,
        status='PUBLISHED'
    )
    jobs_by_id = {str(j.id): j for j in jobs}
    job_data = [
        {"id": str(j.id), "total_spots": j.total_spots}
        for j in jobs
    ]

    if not job_data:
        raise ValueError(f"No published jobs found in group '{group.name}'")

    # 2. Fetch all PENDING applications for these jobs
    # Group by Youth to form their ranked "choices" list
    applications = Application.objects.filter(
        job__lottery_group=group,
        status='PENDING'
    ).select_related('youth', 'youth__user', 'job').order_by('youth_id', 'priority_rank', 'created_at')

    # 3. Filter by eligibility and build applicant data structure
    # Each youth has a list of job choices ordered by priority_rank
    applicant_map: dict[str, list[tuple[int, str]]] = {}
    ineligible_applications: list[dict] = []  # Track who was filtered out

    for app in applications:
        youth = app.youth
        job = app.job
        youth_id = str(app.youth_id)
        job_id = str(app.job_id)

        # Check eligibility for this specific job
        is_eligible, reason = check_eligibility(youth, job, group)

        if not is_eligible:
            ineligible_applications.append({
                "youth_id": youth_id,
                "youth_email": youth.user.email,
                "job_id": job_id,
                "job_title": job.title,
                "reason": reason,
            })
            # Mark application as REJECTED due to ineligibility
            app.status = 'REJECTED'
            app.save(update_fields=['status'])
            continue

        # Use priority_rank if set, otherwise use a high number (will be sorted by created_at)
        rank = app.priority_rank if app.priority_rank is not None else 999

        if youth_id not in applicant_map:
            applicant_map[youth_id] = []
        applicant_map[youth_id].append((rank, job_id))

    # Sort choices by rank for each applicant and extract just job IDs
    applicant_data = []
    for youth_id, choices in applicant_map.items():
        # Sort by rank (lower = higher priority)
        sorted_choices = sorted(choices, key=lambda x: x[0])
        job_ids = [job_id for _, job_id in sorted_choices]
        applicant_data.append({"id": youth_id, "choices": job_ids})

    if not applicant_data:
        raise ValueError(f"No eligible applications found in group '{group.name}'")

    # 4. Generate seed and run the algorithm
    # Use timestamp-based seed for uniqueness, but store it for reproducibility
    seed = int(timezone.now().timestamp() * 1000) % (2**31 - 1)
    engine = RSDMatchEngine(applicant_data, job_data, seed=seed)
    result = engine.run()
    audit_report = engine.get_audit_report(result)

    # Add eligibility filtering info to audit report
    audit_report["eligibility"] = {
        "total_applications_checked": len(applications),
        "eligible_applicants": len(applicant_data),
        "ineligible_count": len(ineligible_applications),
        "ineligible_details": ineligible_applications,
    }

    # 5. Save results atomically
    with transaction.atomic():
        # Update LotteryRun status to RUNNING
        run_record = LotteryRun.objects.create(
            group=group,
            executed_by_id=user_id,
            seed=seed,
            engine_version=engine.ENGINE_VERSION,
            status=LotteryRun.Status.RUNNING,
            candidates_count=len(applicant_data),
            matched_count=0,
            unmatched_count=0,
            audit_report={},
        )

        try:
            # A. Update matched applications to OFFERED
            matched_count = 0
            for youth_id, job_id in result.matches.items():
                # Update the winning application
                updated = Application.objects.filter(
                    youth_id=youth_id,
                    job_id=job_id
                ).update(status='OFFERED')
                matched_count += updated

                # Reject other applications for this youth in this group
                Application.objects.filter(
                    youth_id=youth_id,
                    job__lottery_group=group
                ).exclude(job_id=job_id).update(status='REJECTED')

            # B. Update reserve applications
            reserve_count = 0
            for youth_id in result.reserves:
                updated = Application.objects.filter(
                    youth_id=youth_id,
                    job__lottery_group=group
                ).update(status='RESERVE')
                reserve_count += updated

            # C. Update the run record with final stats
            run_record.status = LotteryRun.Status.COMPLETED
            run_record.completed_at = timezone.now()
            run_record.matched_count = len(result.matches)
            run_record.unmatched_count = len(result.reserves)
            run_record.audit_report = audit_report
            run_record.save()

        except Exception as e:
            # Mark as failed if anything goes wrong
            run_record.status = LotteryRun.Status.FAILED
            run_record.audit_report = {"error": str(e)}
            run_record.save()
            raise

    return run_record


def get_lottery_preview(group_id: str) -> dict:
    """
    Get a preview of what would happen if lottery runs.

    Returns statistics without actually running the lottery.
    Useful for validation before execution.
    """
    group = JobGroup.objects.get(id=group_id)

    # Count jobs and spots
    jobs = Job.objects.filter(
        lottery_group=group,
        status='PUBLISHED'
    )
    total_jobs = jobs.count()
    total_spots = sum(j.total_spots for j in jobs)

    # Count unique applicants
    applications = Application.objects.filter(
        job__lottery_group=group,
        status='PENDING'
    )
    unique_applicants = applications.values('youth_id').distinct().count()
    total_applications = applications.count()

    return {
        "group_id": str(group.id),
        "group_name": group.name,
        "total_jobs": total_jobs,
        "total_spots": total_spots,
        "unique_applicants": unique_applicants,
        "total_applications": total_applications,
        "can_run": total_jobs > 0 and unique_applicants > 0,
    }
