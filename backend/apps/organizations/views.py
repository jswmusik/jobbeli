from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Municipality, Workplace
from .serializers import MunicipalitySerializer, WorkplaceSerializer


class MunicipalityViewSet(viewsets.ModelViewSet):
    queryset = Municipality.objects.all()
    serializer_class = MunicipalitySerializer
    # Only authenticated users can access (Super Admins primarily)
    permission_classes = [permissions.IsAuthenticated]
    # Support file uploads via multipart form data
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @action(detail=False, methods=['get', 'patch'], url_path='my-config')
    def my_config(self, request):
        """
        Helper for the Municipality Admin to manage their own settings.
        GET: Retrieve current municipality configuration
        PATCH: Update municipality settings (custom_fields_schema, etc.)
        """
        user = request.user
        muni = getattr(user, 'municipality', None)

        if not muni:
            return Response(
                {"error": "User has no municipality assigned"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.method == 'GET':
            serializer = self.get_serializer(muni)
            return Response(serializer.data)

        if request.method == 'PATCH':
            # Only allow updating specific safe fields
            allowed_fields = ['custom_fields_schema', 'description']
            data = {k: v for k, v in request.data.items() if k in allowed_fields}

            serializer = self.get_serializer(muni, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


class WorkplaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkplaceSerializer
    permission_classes = [permissions.IsAuthenticated]
    # Support file uploads via multipart form data
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Workplace.objects.select_related('municipality').all()
        # Allow filtering by municipality
        municipality_id = self.request.query_params.get('municipality')
        if municipality_id:
            queryset = queryset.filter(municipality_id=municipality_id)
        return queryset
