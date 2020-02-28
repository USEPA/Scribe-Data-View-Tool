from rest_framework import permissions


class IsAuthUser(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        if request.user.is_authenticated:
            return True

        return False


class AllowAnonymousPOST(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.method == 'POST'
