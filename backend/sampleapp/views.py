# Create your views here.
import os
import urllib
import json
from django.http import HttpResponse, JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import api_view

from .models import SampleModel
from .serializers import SampleSerializer


def index(request):
    return HttpResponse("Hello, world.")


class SampleViewSet(viewsets.ModelViewSet):
    """
    A ViewSet that provides the 5 standard actions / REST API methods for sample requests
    """
    queryset = SampleModel.objects.all()
    serializer_class = SampleSerializer


@api_view(['POST'])
def submit_sample_request(sample_request):
    try:
        serializer = SampleSerializer(data=sample_request.data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse({'status': 'success', 'message': 'Request submitted.'})
        else:
            return JsonResponse({'status': 'error', 'message': 'Invalid request. Please try again.'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': 'Invalid Request. Please try again.'})

