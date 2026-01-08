import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    The central user model. Used for Authentication.
    We use 'email' as the username field.
    """
    class Roles(models.TextChoices):
        SUPER_ADMIN = 'SUPER_ADMIN', _('Super Admin')
        MUNICIPALITY_ADMIN = 'MUNICIPALITY_ADMIN', _('Municipality Admin')
        WORKPLACE_ADMIN = 'WORKPLACE_ADMIN', _('Workplace Admin')
        COMPANY_ADMIN = 'COMPANY_ADMIN', _('Company Admin')
        YOUTH = 'YOUTH', _('Youth')
        GUARDIAN = 'GUARDIAN', _('Guardian')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.YOUTH)

    # Municipality Link (string reference to avoid circular imports)
    municipality = models.ForeignKey(
        'organizations.Municipality',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )

    # Workplace Link (for WORKPLACE_ADMIN role)
    workplace = models.ForeignKey(
        'organizations.Workplace',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admins'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email


class YouthProfile(models.Model):
    """Youth applicant profile with specific fields for the lottery system."""

    class Gender(models.TextChoices):
        MALE = 'MALE', _('Male')
        FEMALE = 'FEMALE', _('Female')
        OTHER = 'OTHER', _('Other')
        PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY', _('Prefer not to say')

    class Grade(models.TextChoices):
        # Grundskolan (Primary/Secondary School) - Years 1-9
        YEAR_1 = 'YEAR_1', _('Årskurs 1')
        YEAR_2 = 'YEAR_2', _('Årskurs 2')
        YEAR_3 = 'YEAR_3', _('Årskurs 3')
        YEAR_4 = 'YEAR_4', _('Årskurs 4')
        YEAR_5 = 'YEAR_5', _('Årskurs 5')
        YEAR_6 = 'YEAR_6', _('Årskurs 6')
        YEAR_7 = 'YEAR_7', _('Årskurs 7')
        YEAR_8 = 'YEAR_8', _('Årskurs 8')
        YEAR_9 = 'YEAR_9', _('Årskurs 9')
        # Gymnasiet (Upper Secondary School) - Years 1-3 (4th year is rare but exists)
        GYM_1 = 'GYM_1', _('Gymnasiet år 1')
        GYM_2 = 'GYM_2', _('Gymnasiet år 2')
        GYM_3 = 'GYM_3', _('Gymnasiet år 3')
        GYM_4 = 'GYM_4', _('Gymnasiet år 4')

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='youth_profile')

    # Municipality link - which municipality this youth belongs to
    municipality = models.ForeignKey(
        'organizations.Municipality',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='youth_profiles'
    )

    # Critical Fields
    personal_number = models.CharField(max_length=12, blank=True)  # Swedish SSN
    date_of_birth = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True, default='')
    gender = models.CharField(
        max_length=20,
        choices=Gender.choices,
        blank=True,
        default=''
    )
    grade = models.CharField(
        max_length=20,
        choices=Grade.choices,
        blank=True,
        default=''
    )

    # Ghost Protocol / Protected Identity
    has_protected_identity = models.BooleanField(default=False)
    manual_verification_code = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="The #X9-B22 code for manual admin verification"
    )

    # Custom Fields Store (JSONB)
    # Stores {"school": "Centralskolan", "driver_license": ["AM"]}
    custom_attributes = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Youth: {self.user.email}"


class GuardianProfile(models.Model):
    """Guardian profile for parents/legal guardians who verify applications."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='guardian_profile')
    phone_number = models.CharField(max_length=20)

    # Links Guardian to multiple Youth
    children = models.ManyToManyField(YouthProfile, related_name='guardians', blank=True)

    # Verification Status
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Guardian: {self.user.email}"
