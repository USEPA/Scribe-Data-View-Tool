from rest_framework import serializers
from rest_framework import viewsets
from rest_framework.response import Response

from .models.scribe_models import Projects


class ProjectsSerializer(serializers.ModelSerializer):

    class Meta:
        model = Projects
        fields = "__all__"


class ProjectsViewSet(viewsets.ModelViewSet):
    db_name = "scribe_db"
    queryset = Projects.objects.using(db_name).all()
    serializer_class = ProjectsSerializer

