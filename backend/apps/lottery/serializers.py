from rest_framework import serializers
from .models import Period, JobGroup, LotteryRun


class PeriodSerializer(serializers.ModelSerializer):
    """Serializer for Period model."""
    municipality_name = serializers.CharField(
        source='municipality.name',
        read_only=True
    )
    groups_count = serializers.SerializerMethodField()

    class Meta:
        model = Period
        fields = [
            'id',
            'municipality',
            'municipality_name',
            'name',
            'start_date',
            'end_date',
            'application_open',
            'application_close',
            'groups_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'municipality', 'municipality_name', 'created_at', 'updated_at']

    def get_groups_count(self, obj):
        return obj.groups.count()


class JobGroupSerializer(serializers.ModelSerializer):
    """Serializer for JobGroup model."""
    period_name = serializers.CharField(source='period.name', read_only=True)
    municipality_name = serializers.CharField(source='municipality.name', read_only=True)
    jobs_count = serializers.SerializerMethodField()

    class Meta:
        model = JobGroup
        fields = [
            'id',
            'municipality',
            'municipality_name',
            'period',
            'period_name',
            'name',
            'description',
            'min_age',
            'max_age',
            'jobs_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'municipality', 'municipality_name', 'created_at', 'updated_at']

    def get_jobs_count(self, obj):
        return obj.jobs.count()


class LotteryRunSerializer(serializers.ModelSerializer):
    """Serializer for LotteryRun model."""
    group_name = serializers.CharField(source='group.name', read_only=True)
    executed_by_email = serializers.CharField(source='executed_by.email', read_only=True)

    class Meta:
        model = LotteryRun
        fields = [
            'id',
            'group',
            'group_name',
            'status',
            'executed_at',
            'completed_at',
            'executed_by',
            'executed_by_email',
            'seed',
            'engine_version',
            'candidates_count',
            'matched_count',
            'unmatched_count',
            'audit_report',
        ]
        read_only_fields = [
            'id', 'status', 'executed_at', 'completed_at', 'executed_by',
            'executed_by_email', 'seed', 'engine_version',
            'candidates_count', 'matched_count', 'unmatched_count', 'audit_report'
        ]
