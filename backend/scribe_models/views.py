from django.db import connections
from django.http import HttpResponseServerError
from django.core.cache import cache

from rest_framework import serializers
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models.scribe_base_models import Projects


class ProjectsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Projects
        fields = "__all__"


class ProjectsViewSet(viewsets.ModelViewSet):
    db_name = "scribe_db"
    queryset = Projects.objects.using(db_name).order_by('project_name')
    serializer_class = ProjectsSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_project_samples(request, project_id_p=0):
    """
    :param request:
    :param project_id_p: project identifier
    :return: list of project samples
    """
    try:
        response_data = cache.get(f'project_samples{project_id_p}')
        if response_data is not None:
            return Response(response_data)

        project_samples_sql = f"""
        SELECT * 
        FROM {project_id_p}_Samples samp
        INNER JOIN {project_id_p}_Site s ON samp.Site_No = s.Site_No
        INNER JOIN {project_id_p}_Location loc ON samp.Location = loc.Location
        """

        column_defs = []
        row_data = []
        with connections["scribe_db"].cursor() as cursor:
            cursor.execute(project_samples_sql)
            rows = cursor.fetchall()
            cols = cursor.description
            for idx, col in enumerate(cols):
                column_defs.append({'headerName': col[0], 'field': col[0], 'sortable': True, 'filter': True})
            for row in rows:
                row_values = {}
                for idx, col in enumerate(cols):
                    row_values[col[0]] = row[idx]
                row_data.append(row_values)
            data = {'columnDefs': column_defs, 'rowData': row_data}
            cache.set(f'project_samples{project_id_p}', data)
            return Response(data)
    except Exception as e:
        return Response({'columnDefs': [], 'rowData': []})

