from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from .models import YouthProfile, GuardianProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    municipality_name = serializers.SerializerMethodField()
    workplace_name = serializers.SerializerMethodField()
    # Youth profile fields (read-only, for display)
    youth_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role',
            'municipality', 'municipality_name', 'workplace', 'workplace_name',
            'youth_profile',
        ]
        read_only_fields = ['role', 'municipality', 'workplace']  # Security: Users can't change their own role

    def get_municipality_name(self, obj):
        if obj.municipality:
            return obj.municipality.name
        return None

    def get_workplace_name(self, obj):
        if obj.workplace:
            return obj.workplace.name
        return None

    def get_youth_profile(self, obj):
        """Return youth profile data if user is YOUTH role."""
        if obj.role != 'YOUTH':
            return None
        if not hasattr(obj, 'youth_profile'):
            return None
        profile = obj.youth_profile
        return {
            'phone_number': profile.phone_number,
            'gender': profile.gender,
            'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
            'grade': profile.grade,
            'municipality': str(profile.municipality_id) if profile.municipality_id else None,
            'municipality_name': profile.municipality.name if profile.municipality else None,
            'custom_attributes': profile.custom_attributes,
        }


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users (Super Admin only)."""
    # Youth profile fields (only used when role=YOUTH)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    gender = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(write_only=True, required=False, allow_null=True)
    grade = serializers.CharField(write_only=True, required=False, allow_blank=True)
    youth_municipality = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    custom_attributes = serializers.JSONField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'password', 'first_name', 'last_name', 'role',
            'municipality', 'workplace',
            # Youth profile fields
            'phone_number', 'gender', 'date_of_birth', 'grade',
            'youth_municipality', 'custom_attributes',
        ]
        extra_kwargs = {
            'password': {'write_only': True}  # Never send password back in response
        }

    def create(self, validated_data):
        # Extract youth profile fields
        phone_number = validated_data.pop('phone_number', '')
        gender = validated_data.pop('gender', '')
        date_of_birth = validated_data.pop('date_of_birth', None)
        grade = validated_data.pop('grade', '')
        youth_municipality = validated_data.pop('youth_municipality', None)
        custom_attributes = validated_data.pop('custom_attributes', {})

        # Securely hash the password before saving
        validated_data['password'] = make_password(validated_data['password'])
        # Generate username from email (required by AbstractUser)
        validated_data['username'] = validated_data['email']

        user = super().create(validated_data)

        # Create YouthProfile if role is YOUTH
        if user.role == 'YOUTH':
            YouthProfile.objects.create(
                user=user,
                phone_number=phone_number,
                gender=gender,
                date_of_birth=date_of_birth,
                grade=grade,
                municipality_id=youth_municipality,
                custom_attributes=custom_attributes or {},
            )

        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users (Super Admin only)."""
    # Youth profile fields (only used when role=YOUTH)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    gender = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(write_only=True, required=False, allow_null=True)
    grade = serializers.CharField(write_only=True, required=False, allow_blank=True)
    youth_municipality = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    custom_attributes = serializers.JSONField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role',
            'municipality', 'workplace',
            # Youth profile fields
            'phone_number', 'gender', 'date_of_birth', 'grade',
            'youth_municipality', 'custom_attributes',
        ]

    def update(self, instance, validated_data):
        # Extract youth profile fields
        phone_number = validated_data.pop('phone_number', None)
        gender = validated_data.pop('gender', None)
        date_of_birth = validated_data.pop('date_of_birth', None)
        grade = validated_data.pop('grade', None)
        youth_municipality = validated_data.pop('youth_municipality', None)
        custom_attributes = validated_data.pop('custom_attributes', None)

        # Update username if email changes
        if 'email' in validated_data:
            validated_data['username'] = validated_data['email']

        user = super().update(instance, validated_data)

        # Update or create YouthProfile if role is YOUTH
        if user.role == 'YOUTH':
            profile, created = YouthProfile.objects.get_or_create(user=user)

            if phone_number is not None:
                profile.phone_number = phone_number
            if gender is not None:
                profile.gender = gender
            if date_of_birth is not None:
                profile.date_of_birth = date_of_birth
            if grade is not None:
                profile.grade = grade
            if youth_municipality is not None:
                profile.municipality_id = youth_municipality
            if custom_attributes is not None:
                profile.custom_attributes = custom_attributes

            profile.save()

        return user


class YouthProfileSerializer(serializers.ModelSerializer):
    """Serializer for YouthProfile with all profile fields."""
    # Nest the user data inside the profile
    user = UserSerializer(read_only=True)

    # Expose municipality details
    municipality_name = serializers.CharField(source='municipality.name', read_only=True)
    municipality_custom_fields = serializers.SerializerMethodField()

    # Flattened user fields for easier frontend access
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = YouthProfile
        fields = [
            'id',
            'user',
            # Flattened user fields
            'first_name',
            'last_name',
            'email',
            # Youth profile fields
            'phone_number',
            'gender',
            'date_of_birth',
            'grade',
            # Municipality
            'municipality',
            'municipality_name',
            'municipality_custom_fields',
            # Custom attributes (filled by youth based on municipality schema)
            'custom_attributes',
            # Status fields
            'has_protected_identity',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_municipality_custom_fields(self, obj):
        """Return the custom fields schema from the youth's municipality."""
        if obj.municipality and obj.municipality.custom_fields_schema:
            return obj.municipality.custom_fields_schema
        return []


class YouthProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating YouthProfile (used by youth to edit their profile)."""
    # Allow updating user fields
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = YouthProfile
        fields = [
            'first_name',
            'last_name',
            'phone_number',
            'gender',
            'date_of_birth',
            'grade',
            'municipality',
            'custom_attributes',
        ]

    def update(self, instance, validated_data):
        # Extract user fields
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)

        # Update user fields if provided
        if first_name is not None:
            instance.user.first_name = first_name
        if last_name is not None:
            instance.user.last_name = last_name
        if first_name is not None or last_name is not None:
            instance.user.save()

        # Update profile fields
        return super().update(instance, validated_data)
