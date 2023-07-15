from django_filters.rest_framework import FilterSet, BaseCSVFilter

from sadie.models import ProjectsExplorer


class ProjectsExplorerFilterset(FilterSet):
    projectids = BaseCSVFilter(field_name='projectid', lookup_expr='in')

    class Meta:
        model = ProjectsExplorer
        fields = ['project_name', 'Site_No', 'Site_State', 'NPL_Status', 'Description', 'EPARegionNumber',
                  'EPAContact', 'projectids']
