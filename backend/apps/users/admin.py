from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, YouthProfile, GuardianProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'municipality', 'is_active')
    list_filter = ('role', 'is_active', 'is_staff', 'municipality')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'username')}),
        ('Platform', {'fields': ('role', 'municipality')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'first_name', 'last_name', 'password1', 'password2', 'role'),
        }),
    )


@admin.register(YouthProfile)
class YouthProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'date_of_birth', 'grade', 'has_protected_identity')
    list_filter = ('has_protected_identity', 'grade')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    raw_id_fields = ('user',)


@admin.register(GuardianProfile)
class GuardianProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number', 'is_verified', 'verified_at')
    list_filter = ('is_verified',)
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'phone_number')
    raw_id_fields = ('user',)
    filter_horizontal = ('children',)
