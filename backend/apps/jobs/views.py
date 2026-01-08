from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import ValidationError
from .models import Job, Application
from .serializers import JobSerializer, ApplicationSerializer


class JobViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Job listings."""

    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        """Filter jobs based on user's role and assignment."""
        user = self.request.user
        queryset = Job.objects.select_related('municipality', 'workplace')

        # Super Admin sees everything
        if user.role == 'SUPER_ADMIN':
            # Allow optional filtering by municipality
            municipality_id = self.request.query_params.get('municipality')
            if municipality_id:
                queryset = queryset.filter(municipality_id=municipality_id)
            return queryset

        # Municipality Admin sees all jobs in their municipality
        if user.role == 'MUNICIPALITY_ADMIN' and user.municipality:
            return queryset.filter(municipality=user.municipality)

        # Workplace Admin sees only their workplace's jobs
        if user.role == 'WORKPLACE_ADMIN' and user.workplace:
            return queryset.filter(workplace=user.workplace)

        # Youth see only published jobs
        if user.role == 'YOUTH':
            return queryset.filter(status=Job.Status.PUBLISHED)

        # Other roles see nothing
        return Job.objects.none()

    def perform_create(self, serializer):
        """Auto-assign municipality on job creation."""
        user = self.request.user

        # Super Admin must specify municipality
        if user.role == 'SUPER_ADMIN':
            municipality_id = self.request.data.get('municipality')
            if municipality_id:
                serializer.save(municipality_id=municipality_id)
            else:
                raise ValueError("Super Admin must specify a municipality")
        else:
            # Other admins auto-assign to their municipality
            serializer.save(municipality=user.municipality)


class ApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Youth job applications."""

    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter applications based on user's role."""
        user = self.request.user

        # Youth see their own applications
        if user.role == 'YOUTH':
            if hasattr(user, 'youth_profile'):
                return Application.objects.filter(
                    youth=user.youth_profile
                ).select_related('job', 'job__municipality', 'job__workplace')
            return Application.objects.none()

        # Municipality Admin sees applications for jobs in their municipality
        if user.role == 'MUNICIPALITY_ADMIN' and user.municipality:
            return Application.objects.filter(
                job__municipality=user.municipality
            ).select_related('job', 'job__municipality', 'job__workplace', 'youth__user')

        # Super Admin sees all applications
        if user.role == 'SUPER_ADMIN':
            return Application.objects.all().select_related(
                'job', 'job__municipality', 'job__workplace', 'youth__user'
            )

        return Application.objects.none()

    def perform_create(self, serializer):
        """Auto-assign the Youth Profile when creating an application."""
        user = self.request.user

        if user.role != 'YOUTH':
            raise ValidationError("Only youth can apply to jobs.")

        if not hasattr(user, 'youth_profile'):
            raise ValidationError("You must complete your youth profile first.")

        # Check if already applied
        job_id = self.request.data.get('job')
        if Application.objects.filter(job_id=job_id, youth=user.youth_profile).exists():
            raise ValidationError("You have already applied to this job.")

        serializer.save(youth=user.youth_profile)
