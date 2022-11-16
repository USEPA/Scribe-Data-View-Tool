from rest_framework import serializers
from .models import SampleModel


class SampleSerializer(serializers.ModelSerializer):
    """
    A Serializer for sample request REST API methods
    """
    class Meta:
        model = SampleModel
        fields = ('first_name', 'last_name', 'email', 'choice')

