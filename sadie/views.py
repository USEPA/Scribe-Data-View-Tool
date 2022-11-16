from django.contrib.auth.decorators import login_required
from django.db import connections
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import View
from django.utils.decorators import method_decorator

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from rest_framework.response import Response

from social_django.utils import load_strategy
import requests
import json


@method_decorator(login_required, name='dispatch')
class EsriProxy(View):
    def get_url(self, request):
        return request.META['QUERY_STRING'].split('?')[0]

    def get_token(self, request):
        social = request.user.social_auth.get(provider='agol')
        return social.get_access_token(load_strategy())

    def handle_esri_response(self, response):
        return HttpResponse(
            content=response.content,
            status=response.status_code,
            content_type=response.headers['Content-Type']
        )

    def get(self, request, format=None):
        try:
            url = self.get_url(request)
            token = self.get_token(request)

            '''Right now just allow all authorized users to use proxy but we can furthur filter access
            down to those who have access to the data intake'''
            # request.user.has_perm('aum.view_dataintake') # check if user has permission to view data intakes
            '''we will need to build out further the row level access to data intake probably using django-guardian'''
            # data_dump = DataIntake.objects.get(pk=match.group(5)) # get obj to check permissions in teh future

            # put token in params and parse query params to new request
            if 'services.arcgis.com/cJ9YHowT8TU7DUyn' in url or 'utility.arcgis.com' in url:
                params = dict(token=token)
            else:
                params = dict()
            for key, value in request.GET.items():
                if '?' in key:
                    key = key.split('?')[1]
                if key != 'auth_token':
                    params[key] = value

            r = requests.get(url, params=params)
            if r.status_code != requests.codes.ok:
                return HttpResponse(status=r.status_code)

            return self.handle_esri_response(r)

        except PermissionError:
            return HttpResponse(status=403)

        except Exception:
            return HttpResponse(status=500)

    def post(self, request):
        try:
            url = self.get_url(request)
            token = self.get_token(request)

            # for posts the token goes in a header
            r = requests.post(url, request.data, headers={"X-Esri-Authorization": f"Bearer {token}"})
            if r.status_code != requests.codes.ok:
                return HttpResponse(status=r.status_code)

            return self.handle_esri_response(r)

        except:
            return HttpResponse(status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ensure_csrf_cookie
def current_user(request):
    social_auth = request.user.social_auth.get(provider='agol')
    agol_username = social_auth.uid
    agol_token = social_auth.get_access_token(load_strategy())
    current_user_response = {
        'name': '{} {}'.format(request.user.first_name, request.user.last_name) if request.user.first_name else request.user.username,
        'is_superuser': request.user.is_superuser,
        'agol_username': agol_username,
        'agol_token': agol_token
    }
    return Response(current_user_response)


# Note: Using ViewSets instead of APIViews in order to have them as registered routers
# ViewSet -> list, APIView -> get
class ProjectTablesViewSet(ViewSet):

    @staticmethod
    def list(request, project_id_p=0):
        project_id = request.query_params.get('project_id', project_id_p)
        if project_id:
            conn = connections['default']
            cursor = conn.cursor()
            sql = "SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE " \
                  "FROM INFORMATION_SCHEMA.COLUMNS " \
                  "WHERE table_catalog = 'Scribe' AND TABLE_NAME LIKE '%s'" % ('%PID_' + project_id + '%')
            cursor.execute(sql)
            results = []
            table_obj = {}
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
        else:
            return JsonResponse({'status': 'error', 'message': 'Invalid Request.'})

