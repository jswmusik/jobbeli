from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Period, JobGroup, LotteryRun
from .serializers import PeriodSerializer, JobGroupSerializer, LotteryRunSerializer
from .services import run_lottery_for_group, get_lottery_preview


class PeriodViewSet(viewsets.ModelViewSet):
    """ViewSet for Period model."""
    serializer_class = PeriodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return periods based on user role."""
        user = self.request.user

        # Super Admin sees all
        if user.role == 'SUPER_ADMIN':
            return Period.objects.all()

        # Municipality Admin sees their own municipality's periods
        if user.role == 'MUNICIPALITY_ADMIN' and user.municipality:
            return Period.objects.filter(municipality=user.municipality)

        # Workplace Admin sees their municipality's periods
        if user.role == 'WORKPLACE_ADMIN' and user.workplace:
            return Period.objects.filter(municipality=user.workplace.municipality)

        return Period.objects.none()

    def perform_create(self, serializer):
        """Auto-assign municipality from user."""
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            # Super Admin must specify municipality in request
            serializer.save()
        elif user.municipality:
            serializer.save(municipality=user.municipality)


class JobGroupViewSet(viewsets.ModelViewSet):
    """ViewSet for JobGroup model."""
    serializer_class = JobGroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return job groups based on user role."""
        user = self.request.user
        queryset = JobGroup.objects.select_related('period', 'municipality')

        # Super Admin sees all
        if user.role == 'SUPER_ADMIN':
            # Optional filter by period
            period_id = self.request.query_params.get('period')
            if period_id:
                queryset = queryset.filter(period_id=period_id)
            return queryset

        # Municipality Admin sees their own municipality's groups
        if user.role == 'MUNICIPALITY_ADMIN' and user.municipality:
            queryset = queryset.filter(municipality=user.municipality)
            period_id = self.request.query_params.get('period')
            if period_id:
                queryset = queryset.filter(period_id=period_id)
            return queryset

        # Workplace Admin sees their municipality's groups
        if user.role == 'WORKPLACE_ADMIN' and user.workplace:
            queryset = queryset.filter(municipality=user.workplace.municipality)
            period_id = self.request.query_params.get('period')
            if period_id:
                queryset = queryset.filter(period_id=period_id)
            return queryset

        return JobGroup.objects.none()

    def perform_create(self, serializer):
        """Auto-assign municipality from user."""
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            serializer.save()
        elif user.municipality:
            serializer.save(municipality=user.municipality)

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """
        Get a preview of what would happen if lottery runs.
        Returns statistics without actually running the lottery.
        """
        try:
            preview_data = get_lottery_preview(pk)
            return Response(preview_data)
        except JobGroup.DoesNotExist:
            return Response(
                {"error": "Job group not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def run_lottery(self, request, pk=None):
        """
        Trigger the RSD algorithm for this group.

        This action:
        1. Fetches all pending applications
        2. Runs the Random Serial Dictatorship algorithm
        3. Updates application statuses
        4. Creates an audit record

        Only MUNICIPALITY_ADMIN or SUPER_ADMIN can run the lottery.
        """
        user = request.user

        # Permission check
        if user.role not in ['MUNICIPALITY_ADMIN', 'SUPER_ADMIN']:
            return Response(
                {"error": "Only Municipality Admin or Super Admin can run the lottery"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            run_record = run_lottery_for_group(pk, str(user.id))
            return Response({
                "status": "success",
                "run_id": str(run_record.id),
                "matched": run_record.matched_count,
                "reserves": run_record.unmatched_count,
                "candidates": run_record.candidates_count,
                "seed": run_record.seed,
            })
        except JobGroup.DoesNotExist:
            return Response(
                {"error": "Job group not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Lottery failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LotteryRunViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for LotteryRun model (read-only audit log)."""
    serializer_class = LotteryRunSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return lottery runs based on user role."""
        user = self.request.user
        queryset = LotteryRun.objects.select_related('group', 'executed_by')

        # Super Admin sees all
        if user.role == 'SUPER_ADMIN':
            group_id = self.request.query_params.get('group')
            if group_id:
                queryset = queryset.filter(group_id=group_id)
            return queryset

        # Municipality Admin sees their own municipality's runs
        if user.role == 'MUNICIPALITY_ADMIN' and user.municipality:
            queryset = queryset.filter(group__municipality=user.municipality)
            group_id = self.request.query_params.get('group')
            if group_id:
                queryset = queryset.filter(group_id=group_id)
            return queryset

        return LotteryRun.objects.none()
