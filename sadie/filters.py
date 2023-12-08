from django_filters.rest_framework import FilterSet, BaseCSVFilter
from rest_framework.filters import BaseFilterBackend

from sadie.auth import JWTUser
from sadie.models import ProjectsExplorer


class ProjectsExplorerFilterset(FilterSet):
    projectids = BaseCSVFilter(field_name='projectid', lookup_expr='in')

    class Meta:
        model = ProjectsExplorer
        fields = ['project_name', 'Site_No', 'Site_State', 'NPL_Status', 'Description', 'EPARegionNumber',
                  'EPAContact', 'projectids']


# allowing people with correct auth basic project info for now
# class JWTProjectFilterBackend(BaseFilterBackend):
#     def filter_queryset(self, request, queryset, view):
#         if isinstance(request.user, JWTUser):
#             return queryset.filter(projectid__in=request.user.allowed_projects)
#         return queryset
