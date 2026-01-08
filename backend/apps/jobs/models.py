import uuid
from django.db import models


class Job(models.Model):
    """Job listing for summer work positions."""

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'
        ARCHIVED = 'ARCHIVED', 'Archived'

    class JobType(models.TextChoices):
        NORMAL = 'NORMAL', 'Normal'
        LOTTERY = 'LOTTERY', 'Lottery'

    class Grade(models.TextChoices):
        YEAR_1 = 'YEAR_1', 'Årskurs 1'
        YEAR_2 = 'YEAR_2', 'Årskurs 2'
        YEAR_3 = 'YEAR_3', 'Årskurs 3'
        YEAR_4 = 'YEAR_4', 'Årskurs 4'
        YEAR_5 = 'YEAR_5', 'Årskurs 5'
        YEAR_6 = 'YEAR_6', 'Årskurs 6'
        YEAR_7 = 'YEAR_7', 'Årskurs 7'
        YEAR_8 = 'YEAR_8', 'Årskurs 8'
        YEAR_9 = 'YEAR_9', 'Årskurs 9'
        GYM_1 = 'GYM_1', 'Gymnasiet år 1'
        GYM_2 = 'GYM_2', 'Gymnasiet år 2'
        GYM_3 = 'GYM_3', 'Gymnasiet år 3'
        GYM_4 = 'GYM_4', 'Gymnasiet år 4'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Ownership
    municipality = models.ForeignKey(
        'organizations.Municipality',
        on_delete=models.CASCADE,
        related_name='jobs'
    )
    workplace = models.ForeignKey(
        'organizations.Workplace',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='jobs'
    )

    # Link to Lottery System
    # null=True because some jobs might be "Direct" (outside lottery)
    lottery_group = models.ForeignKey(
        'lottery.JobGroup',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='jobs'
    )

    # Content
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')  # Legacy field, kept for compatibility

    # Rich text content fields (HTML)
    qualifications = models.TextField(blank=True, default='')  # Required qualifications
    job_details = models.TextField(blank=True, default='')  # What the user will be doing
    municipality_info = models.TextField(blank=True, default='')  # Info about the municipality

    # Media
    youtube_url = models.URLField(max_length=500, blank=True, default='')  # YouTube video URL

    # Future: Skills and Tags (placeholders)
    # skills_required = models.ManyToManyField('skills.Skill', blank=True)
    # tags = models.ManyToManyField('tags.Tag', blank=True)

    # Logistics
    total_spots = models.PositiveIntegerField(default=1)
    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Grade requirements (eligibility filter)
    min_grade = models.CharField(
        max_length=20,
        choices=Grade.choices,
        null=True,
        blank=True,
        help_text="Minimum required grade to apply"
    )
    max_grade = models.CharField(
        max_length=20,
        choices=Grade.choices,
        null=True,
        blank=True,
        help_text="Maximum allowed grade to apply"
    )

    # Dates
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    application_deadline = models.DateField(null=True, blank=True)

    # Matching Engine Data
    # Stores values like: {"school": "Centralskolan", "required_license": "AM"}
    custom_attributes = models.JSONField(default=dict, blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )

    job_type = models.CharField(
        max_length=20,
        choices=JobType.choices,
        default=JobType.NORMAL,
        help_text="Normal jobs are always available; Lottery jobs are assigned via the lottery system"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.municipality.name})"


class Application(models.Model):
    """Youth application to a job."""

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        LOTTERY = 'LOTTERY', 'Entered Lottery'
        OFFERED = 'OFFERED', 'Offered'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'
        RESERVE = 'RESERVE', 'Reserve List'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    # Link to YouthProfile, not just User, because the Profile has the data (Age, Grade)
    youth = models.ForeignKey(
        'users.YouthProfile',
        on_delete=models.CASCADE,
        related_name='applications'
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    # Store the rank if they prioritized this job (1st choice, 2nd choice...)
    priority_rank = models.PositiveIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # A youth can only apply to the same job once
        unique_together = ('job', 'youth')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.youth.user.email} -> {self.job.title}"
