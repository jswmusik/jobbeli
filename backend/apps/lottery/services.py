"""
Lottery Service Layer.

This module contains the business logic for running the lottery.
It orchestrates fetching data from the database, running the algorithm,
and saving the results.

CRITICAL: All lottery operations must be atomic and auditable.
"""
from django.db import transaction
from django.utils import timezone
from apps.jobs.models import Application, Job
from apps.lottery.models import JobGroup, LotteryRun
from .algorithm.rsd import RSDMatchEngine


def run_lottery_for_group(group_id: str, user_id: str) -> LotteryRun:
    """
    Execute the lottery for a specific job group.

    This function:
    1. Fetches all published jobs in the group
    2. Fetches all pending applications for those jobs
    3. Runs the RSD algorithm
    4. Updates application statuses atomically
    5. Creates an audit record

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
    ).select_related('youth', 'job').order_by('youth_id', 'priority_rank', 'created_at')

    # Build applicant data structure
    # Each youth has a list of job choices ordered by priority_rank
    applicant_map: dict[str, list[tuple[int, str]]] = {}

    for app in applications:
        youth_id = str(app.youth_id)
        job_id = str(app.job_id)
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
        raise ValueError(f"No pending applications found in group '{group.name}'")

    # 3. Generate seed and run the algorithm
    # Use timestamp-based seed for uniqueness, but store it for reproducibility
    seed = int(timezone.now().timestamp() * 1000) % (2**31 - 1)
    engine = RSDMatchEngine(applicant_data, job_data, seed=seed)
    result = engine.run()
    audit_report = engine.get_audit_report(result)

    # 4. Save results atomically
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
