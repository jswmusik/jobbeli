from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that uses email instead of username."""
    username_field = 'email'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove default username field and add email
        self.fields.pop('username', None)
        self.fields['email'] = serializers.EmailField()

    def validate(self, attrs):
        # Get email from attrs and use it for authentication
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            try:
                user = User.objects.get(email=email)
                if user.check_password(password):
                    if not user.is_active:
                        raise serializers.ValidationError('User account is disabled.')

                    # Generate tokens
                    refresh = self.get_token(user)

                    return {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                else:
                    raise serializers.ValidationError('Invalid credentials.')
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials.')
        else:
            raise serializers.ValidationError('Must include "email" and "password".')

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims (The Role!)
        token['role'] = user.role
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['municipality'] = str(user.municipality.id) if user.municipality else None

        return token
