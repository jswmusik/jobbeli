import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _


class Period(models.Model):
    """
    Time periods for the summer (e.g., Period 1: June 15 - July 5).
    Each municipality can define their own periods.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    municipality = models.ForeignKey(
        'organizations.Municipality',
        on_delete=models.CASCADE,
        related_name='periods'
    )

    name = models.CharField(max_length=100)  # e.g. "Period 1"
    start_date = models.DateField()
    end_date = models.DateField()

    # Application Window (When can youth apply?)
    application_open = models.DateTimeField()
    application_close = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date']

    def __str__(self):
        return f"{self.name} ({self.municipality.name})"


class JobGroup(models.Model):
    """
    Buckets of jobs within a period (e.g., 'Outdoor Jobs - Period 1').
    The lottery runs PER GROUP.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    municipality = models.ForeignKey(
        'organizations.Municipality',
        on_delete=models.CASCADE,
        related_name='job_groups'
    )
    period = models.ForeignKey(
        Period,
        on_delete=models.CASCADE,
        related_name='groups'
    )

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')

    # Config for the algorithm (age restrictions)
    min_age = models.PositiveIntegerField(default=15)
    max_age = models.PositiveIntegerField(default=19)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.period.name}"


class LotteryRun(models.Model):
    """
    Audit log of a lottery execution.
    Every time the lottery runs, we record the seed and results for reproducibility.
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        RUNNING = 'RUNNING', _('Running')
        COMPLETED = 'COMPLETED', _('Completed')
        FAILED = 'FAILED', _('Failed')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(
        JobGroup,
        on_delete=models.CASCADE,
        related_name='lottery_runs'
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    executed_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    executed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='lottery_runs'
    )

    # Random seed used for reproducibility
    seed = models.BigIntegerField(help_text="Random seed used for reproducibility")

    # Engine version for audit trail
    engine_version = models.CharField(max_length=20, default='1.0.0')

    # Stats
    candidates_count = models.IntegerField(default=0)
    matched_count = models.IntegerField(default=0)
    unmatched_count = models.IntegerField(default=0)

    # Store the full audit report as JSON
    audit_report = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-executed_at']

    def __str__(self):
        return f"Run {self.executed_at.strftime('%Y-%m-%d %H:%M')} ({self.group.name})"
