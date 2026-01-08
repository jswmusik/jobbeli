import uuid
from django.db import models


def municipality_logo_path(instance, filename):
    """Generate upload path for municipality logos."""
    ext = filename.split('.')[-1]
    return f'municipalities/{instance.slug}/logo.{ext}'


def municipality_hero_path(instance, filename):
    """Generate upload path for municipality hero images."""
    ext = filename.split('.')[-1]
    return f'municipalities/{instance.slug}/hero.{ext}'


def workplace_logo_path(instance, filename):
    """Generate upload path for workplace logos."""
    ext = filename.split('.')[-1]
    return f'workplaces/{instance.id}/logo.{ext}'


def workplace_promo_path(instance, filename):
    """Generate upload path for workplace promo images."""
    ext = filename.split('.')[-1]
    return f'workplaces/{instance.id}/promo.{ext}'


class Municipality(models.Model):
    """Municipality that manages youth summer job programs."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    # Branding
    logo = models.ImageField(
        upload_to=municipality_logo_path,
        blank=True,
        null=True,
        help_text="Municipality logo (recommended: 200x200px)"
    )
    hero_image = models.ImageField(
        upload_to=municipality_hero_path,
        blank=True,
        null=True,
        help_text="Hero banner image (recommended: 1920x400px)"
    )

    # Rich text description (stored as HTML)
    description = models.TextField(
        blank=True,
        default='',
        help_text="Rich text description with formatting"
    )

    # JSON Schema for Custom Fields
    # Example: { "school": { "type": "select", "options": ["School A", "School B"] } }
    custom_fields_schema = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Municipalities"

    def __str__(self):
        return self.name


class Workplace(models.Model):
    """
    A workplace/department within a municipality.
    Examples: "Parkförvaltningen", "Äldreboendet Solglimten", "Biblioteket"
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)

    # Parent Municipality
    municipality = models.ForeignKey(
        Municipality,
        on_delete=models.CASCADE,
        related_name='workplaces'
    )

    # Branding
    logo = models.ImageField(
        upload_to=workplace_logo_path,
        blank=True,
        null=True,
        help_text="Workplace logo (recommended: 200x200px)"
    )
    promo_image = models.ImageField(
        upload_to=workplace_promo_path,
        blank=True,
        null=True,
        help_text="Promotional image (recommended: 1200x630px)"
    )

    # Rich text description (stored as HTML)
    description = models.TextField(
        blank=True,
        default='',
        help_text="Rich text description with formatting"
    )

    # Contact details
    address = models.CharField(max_length=255, blank=True, default='')
    contact_email = models.EmailField(blank=True, default='')
    contact_phone = models.CharField(max_length=20, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.municipality.name})"
