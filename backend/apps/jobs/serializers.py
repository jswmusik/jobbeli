from rest_framework import serializers
from .models import Job, Application


class JobSerializer(serializers.ModelSerializer):
    """Serializer for Job model."""

    # Read-only fields for displaying related names
    municipality_name = serializers.CharField(
        source='municipality.name',
        read_only=True
    )
    workplace_name = serializers.CharField(
        source='workplace.name',
        read_only=True,
        allow_null=True
    )
    lottery_group_name = serializers.CharField(
        source='lottery_group.name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Job
        fields = [
            'id',
            'municipality',
            'municipality_name',
            'workplace',
            'workplace_name',
            'title',
            'description',
            'qualifications',
            'job_details',
            'municipality_info',
            'youtube_url',
            'total_spots',
            'hourly_rate',
            # Grade requirements
            'min_grade',
            'max_grade',
            # Dates
            'start_date',
            'end_date',
            'application_deadline',
            'custom_attributes',
            'status',
            # Job type and lottery
            'job_type',
            'lottery_group',
            'lottery_group_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'municipality',
            'municipality_name',
            'workplace_name',
            'lottery_group_name',
            'created_at',
            'updated_at',
        ]

    def validate(self, data):
        """Validate that lottery jobs have a lottery_group assigned."""
        job_type = data.get('job_type', getattr(self.instance, 'job_type', None))
        lottery_group = data.get('lottery_group', getattr(self.instance, 'lottery_group', None))

        if job_type == 'LOTTERY' and not lottery_group:
            raise serializers.ValidationError({
                'lottery_group': 'Lottery jobs must be assigned to a lottery group.'
            })

        # Clear lottery_group if job_type is NORMAL
        if job_type == 'NORMAL' and 'lottery_group' in data:
            data['lottery_group'] = None

        return data


class ApplicationSerializer(serializers.ModelSerializer):
    """Serializer for Application model."""

    # Read-only details for the frontend to show "You applied to [Job Title]"
    job_details = JobSerializer(source='job', read_only=True)
    youth_email = serializers.CharField(source='youth.user.email', read_only=True)
    youth_name = serializers.SerializerMethodField()
    youth_phone = serializers.CharField(source='youth.user.phone', read_only=True, allow_null=True)
    youth_grade = serializers.CharField(source='youth.grade', read_only=True, allow_null=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    lottery_group_name = serializers.CharField(source='job.lottery_group.name', read_only=True, allow_null=True)

    class Meta:
        model = Application
        fields = [
            'id',
            'job',
            'job_details',
            'job_title',
            'lottery_group_name',
            'youth',
            'youth_email',
            'youth_name',
            'youth_phone',
            'youth_grade',
            'status',
            'priority_rank',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'youth', 'youth_email', 'youth_name', 'youth_phone', 'youth_grade', 'job_title', 'lottery_group_name', 'created_at']

    def get_youth_name(self, obj):
        """Get the full name of the youth."""
        user = obj.youth.user
        if user.first_name or user.last_name:
            return f"{user.first_name} {user.last_name}".strip()
        return user.email
