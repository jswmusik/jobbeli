"""
URL configuration for Feriearbete Platform.

The API structure follows the Central Hub pattern:
- /admin/ - Django admin interface
- /api/v1/ - REST API endpoints
- /api/v1/health/ - Health check endpoint
- /api/v1/auth/ - JWT authentication endpoints
- /api-auth/ - DRF browsable API authentication
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.views import UserViewSet, CustomTokenObtainPairView
from apps.organizations.views import MunicipalityViewSet, WorkplaceViewSet
from apps.jobs.views import JobViewSet, ApplicationViewSet
from apps.lottery.views import PeriodViewSet, JobGroupViewSet, LotteryRunViewSet


def health_check(request):
    """Simple health check endpoint for monitoring."""
    return JsonResponse({
        'status': 'healthy',
        'service': 'feriearbete-api',
        'version': '0.1.0',
    })


# The Central Router
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'municipalities', MunicipalityViewSet, basename='municipality')
router.register(r'workplaces', WorkplaceViewSet, basename='workplace')
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'periods', PeriodViewSet, basename='period')
router.register(r'groups', JobGroupViewSet, basename='group')
router.register(r'lottery-runs', LotteryRunViewSet, basename='lottery-run')

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Version 1
    path('api/v1/', include(router.urls)),
    path('api/v1/health/', health_check, name='health-check'),

    # JWT Auth endpoints
    path('api/v1/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # DRF browsable API auth (for testing)
    path('api-auth/', include('rest_framework.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
