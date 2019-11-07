# Create your views here.
import json
from django.db import connections
from django.http import HttpResponse, JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.views import APIView

from .models import SampleModel
from .serializers import SampleSerializer


def index(request):
    return HttpResponse("Hello, world.")


class ScribeProjectTables(APIView):
    def get(self, request, project_id):
        columns = ["TABLE_NAME", "COLUMN_NAME", "DATA_TYPE"]
        conn = connections['default']
        cursor = conn.cursor()
        sql = "SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE " \
              "FROM INFORMATION_SCHEMA.COLUMNS " \
              "WHERE table_catalog = 'Scribe' AND TABLE_NAME LIKE '%s'" % ('%PID_' + project_id + '%')
        cursor.execute(sql)
        table_obj = {}
        results = []
        for row in cursor.fetchall():
            # desc = connection.introspection.get_table_description(cursor, row[0])
            if "table_name" in table_obj and table_obj["table_name"] != row[0]:
                results.append(table_obj)
                table_obj = {"table_name": row[0], "columns": [{"name": row[1], "data_type": row[2]}]}
            elif "table_name" in table_obj and table_obj["table_name"] == row[0]:
                table_obj["columns"].append({"name": row[1], "data_type": row[2]})
            else:
                table_obj = {"table_name": row[0], "columns": [{"name": row[1], "data_type": row[2]}]}

        conn.close()

        return JsonResponse({'results': json.dumps(results)})


class SampleViewSet(viewsets.ModelViewSet):
    """
    A ViewSet that provides the 5 standard actions / REST API methods for sample requests
    """
    queryset = SampleModel.objects.all()
    serializer_class = SampleSerializer

    @api_view(['POST'])
    def submit_sample_request(self, sample_request):
        try:
            serializer = SampleSerializer(data=sample_request.data)
            if serializer.is_valid():
                serializer.save()
                return JsonResponse({'status': 'success', 'message': 'Request submitted.'})
            else:
                return JsonResponse({'status': 'error', 'message': 'Invalid request. Please try again.'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': 'Invalid Request. Please try again.'})


