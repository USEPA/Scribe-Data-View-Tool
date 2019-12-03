from django.db import connections
from django.http import HttpResponseServerError

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
    queryset = Projects.objects.using(db_name).all()
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
        project_samples_sql = f"""
        SELECT *
        FROM {project_id_p}_Samples samp
        INNER JOIN {project_id_p}_Site s ON samp.Site_No = s.Site_No
        INNER JOIN {project_id_p}_Location loc ON samp.Location = loc.Location
        """

        project_samples_results = []
        with connections["scribe_db"].cursor() as cursor:
            cursor.execute(project_samples_sql)
            rows = cursor.fetchall()
            cols = cursor.description
            for row in rows:
                row_values = {}
                for idx, col in enumerate(cols):
                    row_values[col[0]] = row[idx]
                project_samples_results.append(row_values)

            return Response(project_samples_results)

    except Exception as e:
        return Response([])

