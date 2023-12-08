from rest_framework import serializers

from sadie.models import ProjectsExplorer


class ProjectsExplorerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectsExplorer
        fields = "__all__"
