from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .models import YouthProfile
from .serializers import (
    UserSerializer,
    YouthProfileSerializer,
    YouthProfileUpdateSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
)
from .token_serializers import CustomTokenObtainPairSerializer

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login view that includes role in token."""
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related('municipality').all()
    permission_classes = [permissions.IsAuthenticated]  # Fortress: Only logged-in users

    def get_serializer_class(self):
        """Dynamic serializer selection based on action."""
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    # GET /api/v1/users/me/
    # Critical for the Frontend to know "Who am I?" on page load
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    # GET/PATCH /api/v1/users/my-profile/
    # For Youth users to get and update their YouthProfile
    @action(detail=False, methods=['get', 'patch'], url_path='my-profile')
    def my_profile(self, request):
        """Get or update the current user's YouthProfile."""
        user = request.user

        # Only YOUTH users have YouthProfile
        if user.role != 'YOUTH':
            return Response(
                {'detail': 'Only youth users have profiles.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get or create YouthProfile
        profile, created = YouthProfile.objects.get_or_create(user=user)

        if request.method == 'GET':
            serializer = YouthProfileSerializer(profile)
            return Response(serializer.data)

        # PATCH - Update profile
        serializer = YouthProfileUpdateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return full profile data after update
            return Response(YouthProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
