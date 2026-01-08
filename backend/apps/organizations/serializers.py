from rest_framework import serializers
from .models import Municipality, Workplace


class MunicipalitySerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    hero_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Municipality
        fields = [
            'id', 'name', 'slug', 'logo', 'logo_url', 'hero_image',
            'hero_image_url', 'description', 'custom_fields_schema',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'logo_url', 'hero_image_url']

    def _build_absolute_url(self, file_field):
        """Build absolute URL for a file field."""
        if not file_field:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(file_field.url)
        # Fallback: construct URL manually for cases without request context
        return f"http://localhost:8000{file_field.url}"

    def get_logo_url(self, obj):
        return self._build_absolute_url(obj.logo)

    def get_hero_image_url(self, obj):
        return self._build_absolute_url(obj.hero_image)


class WorkplaceSerializer(serializers.ModelSerializer):
    municipality_name = serializers.CharField(source='municipality.name', read_only=True)
    logo_url = serializers.SerializerMethodField()
    promo_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Workplace
        fields = [
            'id', 'name', 'municipality', 'municipality_name',
            'logo', 'logo_url', 'promo_image', 'promo_image_url',
            'description', 'address', 'contact_email', 'contact_phone',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'municipality_name', 'logo_url', 'promo_image_url']

    def _build_absolute_url(self, file_field):
        """Build absolute URL for a file field."""
        if not file_field:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(file_field.url)
        # Fallback: construct URL manually for cases without request context
        return f"http://localhost:8000{file_field.url}"

    def get_logo_url(self, obj):
        return self._build_absolute_url(obj.logo)

    def get_promo_image_url(self, obj):
        return self._build_absolute_url(obj.promo_image)
